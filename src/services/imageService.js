const BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function fetchImages() {
  const res = await fetch(`${BASE_URL}/generate/list`)
  if (!res.ok) throw new Error('Gagal mengambil data gambar')
  return res.json()
}

export async function deleteImage(jobId) {
  const res = await fetch(`${BASE_URL}/generate/delete/${jobId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Gagal menghapus gambar')
  return res.json().catch(() => null)
}

export async function generateImage(prompt) {
  const res = await fetch(`${BASE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) throw new Error('Gagal generate gambar')
  return res.json()
}
