import React, { useState } from 'react'
import API from '../api'

export default function OCR() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    const formData = new FormData()
    formData.append('file', selectedFile)

    setLoading(true)
    setError(null)

    try {
      // The backend endpoint is /api/ocr/upload. 
      // API base URL is http://localhost:8080/api
      const response = await API.post('/ocr/upload', formData)
      setResult(response.data)
    } catch (err) {
      const token = localStorage.getItem('token')
      const tokenStatus = !token ? 'Missing' : token === 'undefined' ? 'UNDEFINED' : 'Present'
      const msg = err.response?.data?.message || err.message || 'Failed to extract data'
      setError(`Error: ${msg} (Status: ${err.response?.status}, Token: ${tokenStatus})`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>📸</span> Smart Receipt Scanner
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-gray-50">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
            />
            <label
              htmlFor="fileInput"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Receipt Preview"
                  className="max-h-64 object-contain rounded shadow-sm"
                />
              ) : (
                <div className="text-gray-500">
                  <span className="text-4xl block mb-2">📄</span>
                  <span className="font-medium">Click to upload receipt</span>
                  <span className="text-sm block text-gray-400 mt-1">
                    JPG, PNG or PDF
                  </span>
                </div>
              )}
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all transform hover:scale-[1.02] ${!selectedFile || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              'Extract Details'
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
            Extracted Information
          </h3>

          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-md shadow-sm border border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Merchant
                  </span>
                  <span className="text-lg font-medium text-gray-800 break-words">
                    {result.merchant_name || 'Not detected'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-md shadow-sm border border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Total Amount
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {result.total_amount
                      ? `$${result.total_amount.toFixed(2)}`
                      : 'Unavailable'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-md shadow-sm border border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Date
                  </span>
                  <span className="text-gray-800">
                    {result.date || 'Not detected'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-md shadow-sm border border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Time
                  </span>
                  <span className="text-gray-800">
                    {result.time || 'Not detected'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-md shadow-sm border border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Tax
                  </span>
                  <span className="text-gray-800">
                    {result.tax_amount
                      ? `$${result.tax_amount.toFixed(2)}`
                      : 'N/A'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-md shadow-sm border border-gray-100">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Bill No
                  </span>
                  <span className="text-gray-800">
                    {result.bill_number || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Raw Text Accordion (Optional) */}
              <div className="mt-6">
                <details className="group">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium list-none flex items-center gap-1">
                    <span className="transform group-open:rotate-90 transition-transform text-xs">▶</span>
                    Show Raw Text
                  </summary>
                  <div className="mt-2 p-3 bg-gray-800 text-green-400 rounded text-xs overflow-auto max-h-40 font-mono">
                    {result.raw_text?.join('\n')}
                  </div>
                </details>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[200px]">
              <span className="text-5xl mb-3 opacity-20">📊</span>
              <p>Upload a receipt to see details here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
