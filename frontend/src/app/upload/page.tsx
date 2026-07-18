'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logout } from '../login/actions'
import styles from './upload.module.css'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState<string>('study_material')
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null)
  const router = useRouter()

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setMessage({ text: 'Please select a file', type: 'error' })
      return
    }

    if (file.type !== 'application/pdf') {
      setMessage({ text: 'Only PDF files are supported', type: 'error' })
      return
    }

    setIsUploading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setMessage({ text: 'Document uploaded successfully!', type: 'success' })
      setFile(null)
      
      // Optionally revalidate or redirect
      router.refresh()
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>CampusOS Documents</h1>
        <form action={logout} style={{ margin: 0 }}>
          <button type="submit" className={styles.logoutBtn}>
            Sign Out
          </button>
        </form>
      </div>

      <div className={styles.card}>
        <h2>Upload Document</h2>
        <p className={styles.subtitle}>Upload PDFs to extract text and make them searchable via MCP.</p>

        <form onSubmit={handleUpload} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Document Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} disabled={isUploading}>
              <option value="study_material">Study Material</option>
              <option value="syllabus">Syllabus</option>
              <option value="assignment">Assignment</option>
            </select>
          </div>

          <div className={styles.dropzone}>
            <input 
              type="file" 
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isUploading}
              id="file-upload"
              className={styles.fileInput}
            />
            <label htmlFor="file-upload" className={styles.fileLabel}>
              {file ? (
                <span className={styles.fileName}>📄 {file.name}</span>
              ) : (
                <span>Click to select a PDF</span>
              )}
            </label>
          </div>

          <button type="submit" disabled={!file || isUploading} className={styles.submitBtn}>
            {isUploading ? 'Uploading & Extracting...' : 'Upload Document'}
          </button>

          {message && (
            <div className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
