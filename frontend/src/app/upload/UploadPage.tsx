import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, TrendingUp, CheckCircle, AlertCircle, Trash2, Download } from 'lucide-react'
import { backtestApi, handleApiError } from '../../lib/api'
import { db } from '../../lib/storage'

interface FileInfo {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  pair: string
  timeframe: string
  recordCount: number
  startDate: string
  endDate: string
  processingTime: string
  uploadedAt: string
}

export default function UploadPage() {
  const navigate = useNavigate()
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedFiles, setSavedFiles] = useState<FileInfo[]>([])
  const [loading, setLoading] = useState(true)

  // Load saved files on mount
  useEffect(() => {
    loadSavedFiles()
  }, [])

  const loadSavedFiles = async () => {
    try {
      const files = await db.getAllFiles()
      // Sort by upload date (newest first)
      files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      setSavedFiles(files)
    } catch (err) {
      console.error('Failed to load saved files:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['.csv', '.hst', '.bin', '.txt']
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(fileExt)) {
      setError('Invalid file type. Only CSV, HST, BIN, and TXT files are allowed.')
      return
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is 100MB (current: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`)
      return
    }

    setError(null)
    setFileInfo(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      const response = await backtestApi.uploadFile(file, (progress) => {
        setUploadProgress(progress)
      })

      if (response.success && response.data) {
        const uploadedFileInfo: FileInfo = {
          ...response.data.fileInfo,
          uploadedAt: new Date().toISOString()
        }

        // Save to IndexedDB with sample data
        await db.saveFile({
          ...uploadedFileInfo,
          sampleData: response.data.sample || []
        })

        setFileInfo(uploadedFileInfo)
        setUploadProgress(100)
        
        // Reload saved files list
        await loadSavedFiles()
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(handleApiError(err))
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      await db.deleteFile(id)
      await loadSavedFiles()
      if (fileInfo?.id === id) {
        setFileInfo(null)
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete file')
    }
  }

  const handleSelectFile = async (file: FileInfo) => {
    setFileInfo(file)
    setError(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-ghost mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gradient-primary mb-2">
            Upload Trading Data
          </h1>
          <p className="text-muted-foreground">
            Upload CSV, HST, or BIN files. All data stored offline in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload Zone */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Zone */}
            {!fileInfo && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`card-premium rounded-2xl p-12 text-center transition-all ${
                  isDragging ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex flex-col items-center gap-6">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    isDragging ? 'bg-primary/20' : 'bg-primary/10'
                  }`}>
                    <Upload className={`w-12 h-12 transition-all ${
                      isDragging ? 'text-primary scale-110' : 'text-primary/70'
                    }`} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {isDragging ? 'Drop your file here' : 'Drag & drop your file'}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      or click to browse
                    </p>

                    <label className="btn-primary cursor-pointer inline-block">
                      Choose File
                      <input
                        type="file"
                        className="hidden"
                        accept=".csv,.hst,.bin,.txt"
                        onChange={handleFileSelect}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>✓ Supported: CSV, HST, BIN, TXT</p>
                    <p>✓ Max size: 100 MB</p>
                    <p>✓ Stored offline forever</p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="card-premium rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="spinner" />
                  <div className="flex-1">
                    <p className="font-medium">Uploading and parsing...</p>
                    <p className="text-sm text-muted-foreground">
                      This may take a few seconds
                    </p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {uploadProgress}%
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="card-premium rounded-2xl p-6 bg-destructive/10 border-destructive/50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-destructive mb-1">Upload Failed</h3>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setError(null)
                    setFileInfo(null)
                  }}
                  className="btn-secondary w-full mt-4"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Success - File Info */}
            {fileInfo && !uploading && (
              <div className="space-y-6">
                <div className="card-premium rounded-2xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Ready for Backtesting!</h2>
                      <p className="text-muted-foreground">
                        Parsed in {fileInfo.processingTime}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InfoCard label="File" value={fileInfo.fileName} />
                    <InfoCard label="Size" value={formatFileSize(fileInfo.fileSize)} />
                    <InfoCard label="Pair" value={fileInfo.pair} />
                    <InfoCard label="Timeframe" value={fileInfo.timeframe} />
                    <InfoCard label="Candles" value={fileInfo.recordCount.toLocaleString()} />
                    <InfoCard label="Range" value={`${formatDate(fileInfo.startDate)} - ${formatDate(fileInfo.endDate)}`} />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/backtest', { state: { fileId: fileInfo.id } })}
                    className="btn-primary flex-1"
                  >
                    Start Backtesting →
                  </button>
                  <button
                    onClick={() => setFileInfo(null)}
                    className="btn-secondary"
                  >
                    Upload Another
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Saved Files */}
          <div className="space-y-4">
            <div className="card-premium rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">📁 Saved Files ({savedFiles.length})</h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="spinner mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : savedFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No files yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Upload your first file!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {savedFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        fileInfo?.id === file.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-muted/50 border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleSelectFile(file)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm truncate flex-1">{file.fileName}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFile(file.id)
                          }}
                          className="text-destructive hover:text-destructive/80 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{file.pair}</span>
                        <span>•</span>
                        <span>{file.timeframe}</span>
                        <span>•</span>
                        <span>{formatFileSize(file.fileSize)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(file.uploadedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              {savedFiles.length > 0 && (
                <button
                  onClick={async () => {
                    if (confirm('Delete all saved files?')) {
                      await db.clearAllFiles()
                      await loadSavedFiles()
                      setFileInfo(null)
                    }
                  }}
                  className="w-full mt-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                >
                  Clear All Files
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-sm text-foreground truncate">{value}</p>
    </div>
  )
}
