import React, { useEffect, useState } from 'react';
import { getReceipts } from '../services/api';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('DATE_DESC'); // DATE_DESC, DATE_ASC, AMT_DESC
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      if (userId) {
        const data = await getReceipts(userId);
        setReceipts(data);
      }
    } catch (error) {
      console.error("Failed to load receipts", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts
    .filter(r =>
      (r.merchant || 'Unknown').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.totalAmount?.toString() || '').includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortOrder === 'DATE_DESC') return new Date(b.receiptDate || 0) - new Date(a.receiptDate || 0);
      if (sortOrder === 'DATE_ASC') return new Date(a.receiptDate || 0) - new Date(b.receiptDate || 0);
      if (sortOrder === 'AMT_DESC') return (b.totalAmount || 0) - (a.totalAmount || 0);
      return 0;
    });

  if (loading) return <div className="p-10 flex justify-center text-slate-500 font-medium animate-pulse">Loading Receipts...</div>;

  return (
    <div className="p-6 pb-20 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">My Receipts</h1>
          <p className="text-white/60">Archive of your scanned documents</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search merchant or amount..."
            className="input-vibrant w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="input-vibrant"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="DATE_DESC" className="text-black">Newest First</option>
            <option value="DATE_ASC" className="text-black">Oldest First</option>
            <option value="AMT_DESC" className="text-black">Highest Amount</option>
          </select>
        </div>
      </div>

      {filteredReceipts.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10">
          <div className="text-4xl mb-4">🧾</div>
          <p className="text-white/50">No receipts found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredReceipts.map(receipt => (
            <div
              key={receipt.receiptId}
              onClick={() => setSelectedReceipt(receipt)}
              className="card-vibrant p-0 overflow-hidden cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all group"
            >
              <div className="h-48 bg-black/40 relative items-center justify-center flex overflow-hidden">
                {receipt.imagePath ? (
                  <img src={receipt.imagePath} alt="Receipt" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                ) : (
                  <span className="text-4xl text-white/20">📄</span>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                  <span className="text-white font-bold text-lg">₹{(receipt.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white truncate">{receipt.merchant || 'Unknown Merchant'}</h3>
                <div className="flex justify-between items-center mt-2 text-xs text-white/60">
                  <span>{new Date(receipt.receiptDate).toLocaleDateString()}</span>
                  {receipt.processed && <span className="text-lime-300 font-bold bg-lime-500/20 px-2 py-0.5 rounded border border-lime-500/30">Processed</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedReceipt(null)}>
          <div className="card-vibrant w-full max-w-5xl h-[80vh] flex overflow-hidden shadow-2xl animate-scale-in p-0" onClick={e => e.stopPropagation()}>
            {/* Left: Image */}
            <div className="w-1/2 bg-black/50 flex items-center justify-center p-4 border-r border-white/10">
              {selectedReceipt.imagePath ? (
                <img src={selectedReceipt.imagePath} className="max-w-full max-h-full object-contain" alt="Full Receipt" />
              ) : (
                <div className="text-white/50">No Image Available</div>
              )}
            </div>

            {/* Right: Details */}
            <div className="w-1/2 p-8 overflow-y-auto bg-transparent">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedReceipt.merchant || 'Unknown Merchant'}</h2>
                  <p className="text-white/60">{new Date(selectedReceipt.receiptDate).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedReceipt(null)} className="p-2 hover:bg-white/10 rounded-full text-white/70">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-xs text-lime-200/70 uppercase font-bold">Total Amount</p>
                  <p className="text-2xl font-mono text-lime-300 font-bold">₹{(selectedReceipt.totalAmount || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-xs text-lime-200/70 uppercase font-bold">OCR Confidence</p>
                  <p className="text-lg font-bold text-white">{selectedReceipt.ocrConfidence ? Math.round(selectedReceipt.ocrConfidence) : 0}%</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="bg-black/20 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm">Extracted Text</h3>
                  <span className="text-xs text-white/40 font-mono">RAW_DATA</span>
                </div>
                <div className="p-4 max-h-96 overflow-auto font-mono text-xs text-white/70 whitespace-pre-wrap leading-relaxed">
                  {selectedReceipt.extractedText || "No text extracted."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
