import { useState } from "react"
import { getToken } from "../api.js"

const API_URL = "http://localhost:5000"

function ImageUploader({ currentImage, onUpload }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentImage || "")

  async function handleChange(e) {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    setUploading(true)
    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setPreview(data.url)
        onUpload(data.url)
      }
    } catch {
      alert("Gagal upload")
    }
    setUploading(false)
  }

  return (
    <div className="image-uploader">
      {preview && <img src={preview} alt="preview" className="image-preview" />}
      <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
        {uploading ? "Mengupload..." : preview ? "Ganti Gambar" : "Pilih Gambar"}
        <input type="file" accept="image/*" onChange={handleChange} hidden />
      </label>
    </div>
  )
}

export default ImageUploader
