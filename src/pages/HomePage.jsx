import { useState } from 'react'
import { Link } from 'react-router-dom'
import { generateImage, generateImageToImage } from '../services/imageService'

const PLACEHOLDER =
  'A beach night with pastel sky, soft glowing colors, calm sea, gentle waves, aesthetic atmosphere...'

const RESOLUTION_PRESETS = [
  { label: 'Landscape (1216x832)', width: 1216, height: 832 },
  { label: 'Portrait (832x1216)', width: 832, height: 1216 },
  { label: 'Square (1024x1024)', width: 1024, height: 1024 },
  { label: 'Wide (1536x640)', width: 1536, height: 640 },
  { label: 'Custom', width: null, height: null },
]

export default function HomePage() {
  const [mode, setMode] = useState('text2img')
  const [prompt, setPrompt] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  
  // Resolution states
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [customWidth, setCustomWidth] = useState(1216)
  const [customHeight, setCustomHeight] = useState(832)

  const getResolution = () => {
    const preset = RESOLUTION_PRESETS[selectedPreset]
    if (preset.width && preset.height) {
      return { width: preset.width, height: preset.height }
    }
    return { width: customWidth, height: customHeight }
  }

  async function handleGenerate(e) {
    e.preventDefault()
    
    if (mode === 'text2img' && !prompt.trim()) return
    if (mode === 'img2img' && (!prompt.trim() || !imageFile)) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const { width, height } = getResolution()
      let data

      if (mode === 'text2img') {
        data = await generateImage({
          prompt: prompt.trim(),
          width,
          height,
        })
      } else {
        data = await generateImageToImage({
          file: imageFile,
          prompt: prompt.trim(),
          width,
          height,
        })
      }

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
    setImageFile(null)
    setImagePreview(null)
    setError(null)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-16 px-4 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-extrabold tracking-tight">
          AI <span className="text-indigo-400">Image </span>
        </h1>
        <p className="text-gray-400 text-lg">
          Explore your imagination
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-gray-900 rounded-xl">
        <button
          onClick={() => setMode('text2img')}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
            mode === 'text2img'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📝 Text to Image
        </button>
        <button
          onClick={() => setMode('img2img')}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
            mode === 'img2img'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🖼️ Image to Image
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="space-y-4">
        {/* Image Upload (only for img2img mode) */}
        {mode === 'img2img' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Upload Gambar Referensi
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer disabled:opacity-50"
              />
            </div>
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 rounded-lg border border-gray-700"
                />
              </div>
            )}
          </div>
        )}

        {/* Prompt Input */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={mode === 'text2img' ? PLACEHOLDER : 'Deskripsikan modifikasi yang diinginkan...'}
            rows={4}
            disabled={loading}
            className="w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-3 text-white placeholder-gray-600 resize-none transition-colors disabled:opacity-50"
          />
          <span className="absolute bottom-3 right-4 text-xs text-gray-600">
            {prompt.length} karakter
          </span>
        </div>

        {/* Resolution Control */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            Resolution
          </label>
          
          {/* Preset Selector */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {RESOLUTION_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPreset(idx)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedPreset === idx
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Resolution Inputs */}
          {selectedPreset === RESOLUTION_PRESETS.length - 1 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Width</label>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 512)}
                  min="64"
                  max="2048"
                  step="64"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Height</label>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value) || 512)}
                  min="64"
                  max="2048"
                  step="64"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}
          
          {/* Current Resolution Display */}
          <div className="text-xs text-gray-500">
            Output: {getResolution().width} × {getResolution().height}
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={
            loading ||
            (mode === 'text2img' && !prompt.trim()) ||
            (mode === 'img2img' && (!prompt.trim() || !imageFile))
          }
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-xl font-semibold text-white flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating…
            </>
          ) : (
            `Generate ${mode === 'text2img' ? 'Image' : 'Variasi'}`
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
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link ke galeri */}
      {!loading && (
        <p className="text-center text-gray-600 text-sm">
          All Result{' '}
          <Link to="/gallery" className="text-indigo-400 hover:underline">
            Gallery
          </Link>
        </p>
      )}
    </div>
  )
}
