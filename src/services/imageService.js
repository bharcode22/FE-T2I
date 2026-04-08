// services/imageService.js

const BASE_URL = import.meta.env.VITE_API_BASE_URL

// ==================== FETCH LIST ====================
export async function fetchImages() {
  try {
    const res = await fetch(`${BASE_URL}/generate/list`)

    if (!res.ok) {
      throw new Error(`Error ${res.status}`)
    }

    return await res.json()
  } catch (err) {
    console.error("fetchImages error:", err)
    throw err
  }
}

// ==================== DELETE ====================
export async function deleteImage(jobId) {
  try {
    const res = await fetch(`${BASE_URL}/generate/delete/${jobId}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      throw new Error(`Error ${res.status}`)
    }

    return await res.json().catch(() => null)
  } catch (err) {
    console.error("deleteImage error:", err)
    throw err
  }
}

// ==================== GENERATE TEXT TO IMAGE ====================
export async function generateImage({ prompt, height, width }) {
  try {
    const res = await fetch(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        height: height ?? null,
        width: width ?? null
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Generate gagal: ${text}`)
    }

    return await res.json()
  } catch (err) {
    console.error("generateImage error:", err)
    throw err
  }
}

// ==================== GENERATE IMAGE TO IMAGE ====================
export async function generateImageToImage({ file, prompt, height, width }) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('prompt', prompt)
    
    if (height) {
      formData.append('height', height.toString())
    }
    if (width) {
      formData.append('width', width.toString())
    }

    const res = await fetch(`${BASE_URL}/img2img`, {
      method: 'POST',
      body: formData,
      // Jangan set Content-Type header untuk FormData, browser akan mengaturnya otomatis dengan boundary
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Generate Image to Image gagal: ${text}`)
    }

    const data = await res.json()
    
    // Transform response to match expected format if needed
    return {
      ...data,
      job_id: data.job_id || data.id,
      status: data.status || 'completed',
      seed: data.seed || null,
      'download-url': data['download-url'] || data.download_url,
    }
  } catch (err) {
    console.error("generateImageToImage error:", err)
    throw err
  }
}

// ==================== GET IMAGE DETAIL ====================
export async function getImageDetail(jobId) {
  try {
    const res = await fetch(`${BASE_URL}/generate/detail/${jobId}`)

    if (!res.ok) {
      throw new Error(`Error ${res.status}`)
    }

    return await res.json()
  } catch (err) {
    console.error("getImageDetail error:", err)
    throw err
  }
}

// ==================== CHECK STATUS ====================
export async function checkImageStatus(jobId) {
  try {
    const res = await fetch(`${BASE_URL}/generate/status/${jobId}`)

    if (!res.ok) {
      throw new Error(`Error ${res.status}`)
    }

    return await res.json()
  } catch (err) {
    console.error("checkImageStatus error:", err)
    throw err
  }
}