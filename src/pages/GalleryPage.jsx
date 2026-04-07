import { useEffect, useState } from 'react'
import { fetchImages, deleteImage } from '../services/imageService'
import GallerySkeleton from '../components/skeleton/GallerySkeleton'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function GalleryPage() {
  const [images, setImages] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    fetchImages()
      .then((data) => {
        setImages(data.images)
        setTotal(data.total)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(jobId) {
    setDeletingId(jobId)
    setConfirmId(null)
    try {
      await deleteImage(jobId)
      setImages((prev) => prev.filter((img) => img.job_id !== jobId))
      setTotal((prev) => prev - 1)
      if (selected?.job_id === jobId) setSelected(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Galeri</h1>
        {!loading && !error && (
          <p className="text-gray-400 mt-1">{total} gambar tersedia</p>
        )}
      </div>

      {/* Loading */}
      {loading && <GallerySkeleton count={8} />}

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-5 py-4 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 ml-4">✕</button>
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {images.map((img) => (
            <div
              key={img.job_id}
              className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-indigo-500 transition-colors group relative"
            >
              {/* Thumbnail */}
              <div
                className="aspect-square overflow-hidden bg-gray-800 cursor-pointer"
                onClick={() => setSelected(img)}
              >
                <img
                  src={img.image_url}
                  alt={img.filename}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Delete button — muncul saat hover */}
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmId(img.job_id) }}
                disabled={deletingId === img.job_id}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 hover:bg-red-600 text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-all disabled:cursor-not-allowed"
                title="Hapus gambar"
              >
                {deletingId === img.job_id ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                )}
              </button>

              <div className="px-3 py-3 space-y-1">
                <p className="text-xs text-gray-400 truncate font-mono">{img.job_id.slice(0, 16)}…</p>
                <p className="text-xs text-gray-500">{formatDate(img.created_at)}</p>
                <p className="text-xs text-gray-500">{formatBytes(img.size_bytes)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Konfirmasi delete */}
      {confirmId && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmId(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-900/50 border border-red-700 flex items-center justify-center text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">Hapus gambar?</p>
                <p className="text-xs text-gray-500 font-mono">{confirmId.slice(0, 20)}…</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">Gambar yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmId)}
                className="flex-1 bg-red-600 hover:bg-red-500 transition-colors text-white text-sm font-medium py-2 rounded-lg"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300 text-sm font-medium py-2 rounded-lg"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl overflow-hidden max-w-2xl w-full border border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selected.image_url}
              alt={selected.filename}
              className="w-full object-contain max-h-[60vh]"
            />
            <div className="px-5 py-4 space-y-1">
              <p className="text-sm font-mono text-gray-300">{selected.filename}</p>
              <p className="text-xs text-gray-500">
                {formatDate(selected.created_at)} · {formatBytes(selected.size_bytes)}
              </p>
              <div className="flex gap-3 mt-3">
                <a
                  href={selected.download_url}
                  download
                  className="flex-1 text-center bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-sm font-medium py-2 rounded-lg"
                >
                  Download
                </a>
                <button
                  onClick={() => { setSelected(null); setConfirmId(selected.job_id) }}
                  className="flex-1 bg-red-900/50 hover:bg-red-600 border border-red-800 hover:border-red-600 transition-colors text-red-300 hover:text-white text-sm font-medium py-2 rounded-lg"
                >
                  Hapus
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300 text-sm font-medium py-2 rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
