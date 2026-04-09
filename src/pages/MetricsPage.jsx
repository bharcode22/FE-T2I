import { useEffect, useRef, useState, useCallback } from 'react'

const WS_BASE = import.meta.env.VITE_API_SOCKET_URL

console.log("url web socket", WS_BASE);

const HISTORY_MAX = 60

function formatBytes(bytes, decimals = 1) {
  if (bytes == null) return '—'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(Math.abs(bytes)) / Math.log(k)), sizes.length - 1)
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`
}

function GaugeBar({ value, colorClass }) {
  const resolved =
    colorClass ??
    (value >= 90 ? 'bg-red-500' : value >= 70 ? 'bg-yellow-500' : 'bg-indigo-500')
  return (
    <div className="w-full bg-gray-800 rounded-full h-2">
      <div
        className={`${resolved} h-2 rounded-full transition-all duration-300`}
        style={{ width: `${Math.min(Math.max(value ?? 0, 0), 100)}%` }}
      />
    </div>
  )
}

function Sparkline({ history, height = 40, color = '#6366f1' }) {
  if (!history || history.length < 2) return null
  const w = 200
  const h = height
  const max = 100
  const pts = history.map((v, i) => {
    const x = (i / (HISTORY_MAX - 1)) * w
    const y = h - (v / max) * h
    return `${x},${y}`
  })
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  )
}

function BigMetricCard({ icon, label, value, unit, sub, pct, sparkHistory, color = 'indigo', children }) {
  const colorMap = {
    indigo: { bar: 'bg-indigo-500', spark: '#6366f1', ring: 'border-indigo-500/30', bg: 'bg-indigo-500/10' },
    sky:    { bar: 'bg-sky-500',    spark: '#0ea5e9', ring: 'border-sky-500/30',    bg: 'bg-sky-500/10'    },
    purple: { bar: 'bg-purple-500', spark: '#a855f7', ring: 'border-purple-500/30', bg: 'bg-purple-500/10' },
    green:  { bar: 'bg-green-500',  spark: '#22c55e', ring: 'border-green-500/30',  bg: 'bg-green-500/10'  },
    orange: { bar: 'bg-orange-500', spark: '#f97316', ring: 'border-orange-500/30', bg: 'bg-orange-500/10' },
  }
  const c = colorMap[color] ?? colorMap.indigo
  const barClass = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : c.bar

  return (
    <div className={`bg-gray-900 border ${c.ring} rounded-2xl p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="text-gray-400 text-sm font-medium">{label}</span>
        </div>
        {pct != null && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.bg} text-white`}>
            {pct.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold text-white tabular-nums">
          {value ?? '—'}
        </span>
        {unit && <span className="text-gray-400 text-sm mb-1">{unit}</span>}
      </div>

      {sub && <p className="text-xs text-gray-500 -mt-2">{sub}</p>}

      {pct != null && (
        <GaugeBar value={pct} colorClass={barClass} />
      )}

      {sparkHistory && (
        <Sparkline history={sparkHistory} color={c.spark} />
      )}

      {children}
    </div>
  )
}

function SmallRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300 font-medium tabular-nums">{value ?? '—'}</span>
    </div>
  )
}

function CoreGrid({ cores }) {
  if (!cores || cores.length === 0) return null
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(cores.length, 8)}, 1fr)` }}>
      {cores.map((pct, i) => {
        const bg = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-indigo-500'
        return (
          <div key={i} title={`Core ${i}: ${pct.toFixed(0)}%`} className="flex flex-col items-center gap-0.5">
            <div className="w-full bg-gray-800 rounded h-8 relative overflow-hidden">
              <div
                className={`${bg} absolute bottom-0 w-full transition-all duration-300`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-gray-600 text-[9px]">{i}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function MetricsPage() {
  const [data, setData] = useState(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const [interval, setIntervalVal] = useState(1.0)
  const [history, setHistory] = useState({ cpu: [], ram: [], gpu: [] })
  const wsRef = useRef(null)
  const prevNetRef = useRef(null)
  const prevDiskRef = useRef(null)
  const prevTimeRef = useRef(null)

  const connect = useCallback((intervalSec) => {
    if (wsRef.current) {
      wsRef.current.onclose = null
      // wsRef.current.close()
    }
    prevNetRef.current = null
    prevDiskRef.current = null
    prevTimeRef.current = null
    setError(null)
    const ws = new WebSocket(`${WS_BASE}/ws/metrics?interval=${intervalSec}`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data)

        const now = Date.now()
        const dt = prevTimeRef.current ? (now - prevTimeRef.current) / 1000 : null
        const calcPs = (curr, prev, key) =>
          curr && prev && dt ? Math.max(0, (curr[key] - prev[key]) / dt) : null

        const d = {
          ...raw,
          memory: raw.memory ? {
            ...raw.memory,
            used_gb: raw.memory.used_mb / 1024,
            total_gb: raw.memory.total_mb / 1024,
          } : null,
          network: raw.network ? {
            bytes_sent_ps: calcPs(raw.network, prevNetRef.current, 'bytes_sent'),
            bytes_recv_ps: calcPs(raw.network, prevNetRef.current, 'bytes_recv'),
            bytes_sent_total: raw.network.bytes_sent,
            bytes_recv_total: raw.network.bytes_recv,
          } : null,
          disk: raw.disk ? {
            read_bytes_ps: calcPs(raw.disk, prevDiskRef.current, 'read_bytes'),
            write_bytes_ps: calcPs(raw.disk, prevDiskRef.current, 'write_bytes'),
            read_bytes_total: raw.disk.read_bytes,
            write_bytes_total: raw.disk.write_bytes,
          } : null,
          gpu: raw.gpu?.map(g => ({
            ...g,
            vram_used_gb: g.memory_used_mb != null ? g.memory_used_mb / 1024 : null,
            vram_total_gb: g.memory_total_mb != null ? g.memory_total_mb / 1024 : null,
            vram_pct: g.memory_pct ?? (
              g.memory_used_mb != null && g.memory_total_mb != null
                ? (g.memory_used_mb / g.memory_total_mb) * 100
                : null
            ),
          })),
        }

        prevNetRef.current = raw.network
        prevDiskRef.current = raw.disk
        prevTimeRef.current = now

        setData(d)
        setHistory((prev) => {
          const push = (arr, val) => {
            const next = [...arr, val ?? 0]
            return next.length > HISTORY_MAX ? next.slice(-HISTORY_MAX) : next
          }
          return {
            cpu: push(prev.cpu, d.cpu?.total_pct),
            ram: push(prev.ram, d.memory?.pct),
            gpu: push(prev.gpu, d.gpu?.[0]?.utilization_pct),
          }
        })
      } catch (_) {}
    }

    ws.onerror = () => setError('WebSocket error — pastikan server berjalan')
    ws.onclose = () => setConnected(false)
  }, [])

  useEffect(() => {
    connect(interval)
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null
        // wsRef.current.close()
      }
    }
  }, [])

  function handleIntervalChange(val) {
    setIntervalVal(val)
    connect(val)
    setHistory({ cpu: [], ram: [], gpu: [] })
  }

  const cpu  = data?.cpu
  const mem  = data?.memory
  const swap = data?.swap
  const net  = data?.network
  const disk = data?.disk
  const gpu  = data?.gpu?.[0]

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Live Metrics</h1>
            <p className="text-gray-500 text-sm mt-0.5">Real-time server monitoring via WebSocket</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Interval selector */}
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5">
              <span className="text-gray-500 text-xs">Interval</span>
              {[0.5, 1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => handleIntervalChange(s)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                    interval === s
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>

            {/* Status badge */}
            {connected ? (
              <span className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-500/30">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Disconnected
              </span>
            )}

            {!connected && (
              <button
                onClick={() => connect(interval)}
                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Waiting */}
        {!data && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        )}

        {/* Main grid */}
        {data && (
          <>
            {/* Row 1: CPU · RAM · GPU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* CPU */}
              <BigMetricCard
                icon="🖥️"
                label="CPU"
                value={cpu?.total_pct?.toFixed(1)}
                unit="%"
                sub={`${cpu?.per_core_pct?.length ?? 0} logical cores`}
                pct={cpu?.total_pct}
                sparkHistory={history.cpu}
                color="indigo"
              >
                <CoreGrid cores={cpu?.per_core_pct} />
              </BigMetricCard>

              {/* RAM */}
              <BigMetricCard
                icon="💾"
                label="RAM"
                value={mem?.pct?.toFixed(1)}
                unit="%"
                sub={mem ? `${mem.used_gb?.toFixed(2)} / ${mem.total_gb?.toFixed(2)} GB` : undefined}
                pct={mem?.pct}
                sparkHistory={history.ram}
                color="sky"
              >
                {swap?.pct != null && (
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Swap {swap.used_mb?.toFixed(0)} / {swap.total_mb?.toFixed(0)} MB</span>
                      <span className="text-gray-300">{swap.pct?.toFixed(1)}%</span>
                    </div>
                    <GaugeBar value={swap.pct} colorClass="bg-sky-700" />
                  </div>
                )}
              </BigMetricCard>

              {/* GPU */}
              {gpu ? (
                <BigMetricCard
                  icon="⚡"
                  label={`GPU · ${gpu.name ?? 'GPU 0'}`}
                  value={gpu.utilization_pct?.toFixed(1)}
                  unit="%"
                  sub={gpu.vram_used_gb != null ? `VRAM ${gpu.vram_used_gb?.toFixed(2)} / ${gpu.vram_total_gb?.toFixed(2)} GB` : undefined}
                  pct={gpu.utilization_pct}
                  sparkHistory={history.gpu}
                  color="purple"
                >
                  <div className="space-y-1 mt-1">
                    {gpu.vram_pct != null && (
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">VRAM</span>
                          <span className="text-gray-300">{gpu.vram_pct?.toFixed(1)}%</span>
                        </div>
                        <GaugeBar value={gpu.vram_pct} colorClass="bg-purple-700" />
                      </div>
                    )}
                    <SmallRow label="Temp" value={gpu.temp_c != null ? `${gpu.temp_c} °C` : null} />
                    <SmallRow label="Power" value={gpu.power_w != null ? `${gpu.power_w} W` : null} />
                  </div>
                </BigMetricCard>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-center text-gray-600 text-sm">
                  No GPU data
                </div>
              )}
            </div>

            {/* Row 2: Network · Disk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Network */}
              <div className="bg-gray-900 border border-green-500/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌐</span>
                  <span className="text-gray-400 text-sm font-medium">Network</span>
                </div>
                {net ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/60 rounded-xl p-3 space-y-1">
                      <p className="text-xs text-gray-500">Sent / s</p>
                      <p className="text-lg font-bold text-green-400 tabular-nums">
                        {net.bytes_sent_ps != null ? formatBytes(net.bytes_sent_ps) : '—'}
                      </p>
                      <p className="text-xs text-gray-600">Total: {formatBytes(net.bytes_sent_total)}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl p-3 space-y-1">
                      <p className="text-xs text-gray-500">Recv / s</p>
                      <p className="text-lg font-bold text-sky-400 tabular-nums">
                        {net.bytes_recv_ps != null ? formatBytes(net.bytes_recv_ps) : '—'}
                      </p>
                      <p className="text-xs text-gray-600">Total: {formatBytes(net.bytes_recv_total)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No network data</p>
                )}
              </div>

              {/* Disk */}
              <div className="bg-gray-900 border border-orange-500/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💿</span>
                  <span className="text-gray-400 text-sm font-medium">Disk I/O</span>
                </div>
                {disk ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/60 rounded-xl p-3 space-y-1">
                      <p className="text-xs text-gray-500">Read / s</p>
                      <p className="text-lg font-bold text-orange-400 tabular-nums">
                        {disk.read_bytes_ps != null ? formatBytes(disk.read_bytes_ps) : '—'}
                      </p>
                      <p className="text-xs text-gray-600">Total: {formatBytes(disk.read_bytes_total)}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl p-3 space-y-1">
                      <p className="text-xs text-gray-500">Write / s</p>
                      <p className="text-lg font-bold text-yellow-400 tabular-nums">
                        {disk.write_bytes_ps != null ? formatBytes(disk.write_bytes_ps) : '—'}
                      </p>
                      <p className="text-xs text-gray-600">Total: {formatBytes(disk.write_bytes_total)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No disk data</p>
                )}
              </div>
            </div>

            {/* Multiple GPUs */}
            {data.gpu?.length > 1 && (
              <div className="space-y-2">
                <h2 className="text-sm font-medium text-gray-400 px-1">All GPUs</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.gpu.map((g, i) => (
                    <div key={i} className="bg-gray-900 border border-purple-500/20 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white font-medium">GPU {i} · {g.name ?? '—'}</span>
                        <span className="text-xs text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">
                          {g.utilization_pct?.toFixed(1)}%
                        </span>
                      </div>
                      <GaugeBar value={g.utilization_pct} />
                      <div className="grid grid-cols-3 gap-2">
                        <SmallRow label="VRAM" value={g.vram_pct != null ? `${g.vram_pct?.toFixed(1)}%` : null} />
                        <SmallRow label="Temp" value={g.temp_c != null ? `${g.temp_c} °C` : null} />
                        <SmallRow label="Power" value={g.power_w != null ? `${g.power_w} W` : null} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
