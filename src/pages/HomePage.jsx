import { useState } from 'react'
import { Link } from 'react-router-dom'
import { generateImage } from '../services/imageService'

const PLACEHOLDER =
  'A beach night with pastel sky, soft glowing colors, calm sea, gentle waves, aesthetic atmosphere...'

export default function HomePage() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleGenerate(e) {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const data = await generateImage(prompt.trim())
      setResult({
        ...data,
        image_url: `${import.meta.env.VITE_API_BASE_URL}/generate/image/${data.job_id}`,
        download_url: data['download-url'],
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setPrompt('')
    setError(null)
  }

  return (
    <div className="max-w-2xl mx-auto py-16 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Teks<span className="text-indigo-400">2</span>Image
        </h1>
        <p className="text-gray-400 text-lg">
          Ubah deskripsi teks menjadi gambar menggunakan AI.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={4}
            disabled={loading}
            className="w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-3 text-white placeholder-gray-600 resize-none transition-colors disabled:opacity-50"
          />
          <span className="absolute bottom-3 right-4 text-xs text-gray-600">
            {prompt.length} karakter
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-xl font-semibold text-white flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sedang generate…
            </>
          ) : (
            'Generate Gambar'
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-5 py-4 text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden space-y-0">
          <img
            src={result.image_url}
            alt="Hasil generate"
            className="w-full object-cover"
          />
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-900/50 border border-green-700 text-green-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {result.status}
              </span>
              <span className="text-xs text-gray-500">Seed: {result.seed}</span>
            </div>
            <p className="text-xs font-mono text-gray-600 break-all">
              {result.job_id}
            </p>
            <div className="flex gap-3">
              <a
                href={result.download_url}
                download
                className="flex-1 text-center bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-sm font-medium py-2 rounded-lg"
              >
                Download
              </a>
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300 text-sm font-medium py-2 rounded-lg"
              >
                Generate Lagi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link ke galeri */}
      {!loading && (
        <p className="text-center text-gray-600 text-sm">
          Lihat semua hasil di{' '}
          <Link to="/gallery" className="text-indigo-400 hover:underline">
            Galeri
          </Link>
        </p>
      )}
    </div>
  )
}
