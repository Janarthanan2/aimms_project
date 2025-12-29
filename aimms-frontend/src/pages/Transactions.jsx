import React, { useEffect, useState } from 'react'
import { getTransactions, createTransaction, deleteTransaction, getUsers, getCategories } from '../services/api'

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]); // New state
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(''); // Empty by default for Admin search
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    merchant: '',
    category: '',
    paymentMode: 'Cash', // Default
    txnDate: new Date().toISOString().split('T')[0]
  });

  // Check if current user is admin (read-only access for admins)
  const isAdmin = localStorage.getItem('userType') === 'admin';
  const userRole = localStorage.getItem('role');

  // Load categories on mount
  useEffect(() => {
    if (!isAdmin) {
      getCategories()
        .then(data => setCategories(data || []))
        .catch(err => console.error("Failed to load categories", err));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin && userId) {
      loadTransactions();
    }
  }, [userId, isAdmin]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert("Please enter a User ID");
      return;
    }
    loadTransactions();
  };

  const loadTransactions = async () => {
    console.log("Loading transactions for userId:", userId);
    setLoading(true);
    setTransactions([]); // Clear previous
    try {
      const data = await getTransactions(userId);
      console.log("Loaded transactions:", data);
      setTransactions(data);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting transaction:", formData, "for userId:", userId);
    try {
      const res = await createTransaction(userId, formData);
      console.log("Transaction created:", res);
      setFormData({
        amount: '',
        description: '',
        merchant: '',
        category: '',
        paymentMode: 'Cash',
        txnDate: new Date().toISOString().split('T')[0]
      });
      loadTransactions();
    } catch (err) {
      alert("Failed to create transaction");
      console.error("Create transaction error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete transaction?")) return;
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter(t => t.transactionId !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Transactions</h2>
        {isAdmin && (
          <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
            Admin View (Read-Only)
          </span>
        )}
      </div>

      {/* Simple User Selector for Demo */}
      {isAdmin && (
        <form onSubmit={handleSearch} className="mb-6 flex items-center gap-4 card-vibrant p-4 border border-lime-500/30">
          <div>
            <label className="block text-sm font-medium text-lime-100 mb-1">Search User Transactions</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Enter User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="input-vibrant w-40"
                required
              />
              <button
                type="submit"
                className="btn-vibrant px-4 py-2 rounded-full hover:scale-105"
              >
                Search
              </button>
            </div>
          </div>
        </form>
      )}

      <div className={`grid grid-cols-1 ${!isAdmin ? 'md:grid-cols-3' : ''} gap-6`}>
        {/* Form - Only show for non-admin users */}
        {!isAdmin && (
          <div className="card-vibrant h-fit">
            <h3 className="text-lg font-bold mb-4 text-white">Add Transaction</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-lime-100 mb-1">Amount</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} required className="input-vibrant w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-lime-100 mb-1">Description</label>
                <input type="text" name="description" value={formData.description} onChange={handleInputChange} required className="input-vibrant w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-lime-100 mb-1">Merchant</label>
                <input type="text" name="merchant" value={formData.merchant} onChange={handleInputChange} required className="input-vibrant w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-lime-100 mb-1">
                  Category <span className="text-lime-300/50 font-normal">(Optional - AI will detect if empty)</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input-vibrant w-full"
                >
                  <option value="" className="text-black">Auto-Detect (AI)</option>
                  {categories.map(cat => (
                    <option key={cat.categoryId} value={cat.name} className="text-black">{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-lime-100 mb-1">Payment Mode</label>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleInputChange}
                  className="input-vibrant w-full"
                >
                  <option value="Cash" className="text-black">Cash</option>
                  <option value="Card" className="text-black">Card</option>
                  <option value="UPI" className="text-black">UPI</option>
                  <option value="NetBanking" className="text-black">NetBanking</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-lime-100 mb-1">Date</label>
                <input type="date" name="txnDate" value={formData.txnDate} onChange={handleInputChange} required className="input-vibrant w-full" />
              </div>

              <button type="submit" className="w-full btn-vibrant py-2 mt-2">Add Transaction</button>
            </form>
          </div>
        )}

        {/* List */}
        <div className={`${!isAdmin ? 'md:col-span-2' : ''} card-vibrant overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-black/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-lime-200 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-lime-200 uppercase tracking-wider">Merchant</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-lime-200 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-lime-200 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-lime-200 uppercase tracking-wider">Category</th>
                  {!isAdmin && <th className="px-6 py-3 text-right text-xs font-bold text-lime-200 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr><td colSpan={isAdmin ? "4" : "5"} className="p-4 text-center text-white/70">Loading...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={isAdmin ? "4" : "5"} className="p-4 text-center text-white/50">
                    {isAdmin && !userId ? "Enter a User ID to view transactions." : "No transactions found."}
                  </td></tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.transactionId} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-50">{t.txnDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{t.merchant}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-50/80">{t.paymentMode || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">₹{t.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-lime-500/20 text-lime-200 border border-lime-500/30">
                          {t.predictedCategory || t.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      {!isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleDelete(t.transactionId)} className="text-red-400 hover:text-red-300 transition-colors">Delete</button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
