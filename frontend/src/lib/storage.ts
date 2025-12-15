// IndexedDB Storage for Offline Data Persistence

interface UploadedFile {
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
  sampleData: any[]
  fullData?: any[]
}

class StrategyForgeDB {
  private dbName = 'StrategyForgeDB'
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' })
          filesStore.createIndex('uploadedAt', 'uploadedAt', { unique: false })
          filesStore.createIndex('pair', 'pair', { unique: false })
        }

        if (!db.objectStoreNames.contains('backtests')) {
          const backtestsStore = db.createObjectStore('backtests', { keyPath: 'id' })
          backtestsStore.createIndex('fileId', 'fileId', { unique: false })
          backtestsStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })
  }

  // File Storage Methods
  async saveFile(fileData: UploadedFile): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite')
      const store = transaction.objectStore('files')
      const request = store.put(fileData)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getFile(id: string): Promise<UploadedFile | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly')
      const store = transaction.objectStore('files')
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllFiles(): Promise<UploadedFile[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly')
      const store = transaction.objectStore('files')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async deleteFile(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite')
      const store = transaction.objectStore('files')
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearAllFiles(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite')
      const store = transaction.objectStore('files')
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Backtest Storage Methods (for Phase 3)
  async saveBacktest(backtestData: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['backtests'], 'readwrite')
      const store = transaction.objectStore('backtests')
      const request = store.put(backtestData)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getBacktest(id: string): Promise<any | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['backtests'], 'readonly')
      const store = transaction.objectStore('backtests')
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllBacktests(): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['backtests'], 'readonly')
      const store = transaction.objectStore('backtests')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }
}

// Export singleton instance
export const db = new StrategyForgeDB()

// Initialize on import
db.init().catch(console.error)
