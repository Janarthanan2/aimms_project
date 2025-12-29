import React, { useEffect, useState } from 'react'
import API from '../api'
import BudgetOnboarding from './BudgetOnboarding'

export default function Budgets() {
  const [profile, setProfile] = useState(null)
  const [budgets, setBudgets] = useState([])
  const [transactions, setTransactions] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const userId = localStorage.getItem('userId')

  useEffect(() => {
    if (userId) {
      Promise.all([
        API.get(`/budgets/profile/${userId}`),
        API.get(`/budgets/user/${userId}`),
        API.get(`/transactions/user/${userId}`),
        API.get(`/recommendations/${userId}`)
      ]).then(([profRes, budRes, txRes, recRes]) => {
        if (profRes.status === 200) setProfile(profRes.data)
        if (budRes.status === 200) setBudgets(budRes.data || [])
        if (txRes.status === 200) setTransactions(txRes.data || [])
        if (recRes.status === 200) setRecommendations(recRes.data || [])
      }).catch(err => {
        console.error("Failed to load budget data", err)
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [userId])

  if (!userId) return <div className="p-10 text-center text-white">Please log in to view budget.</div>
  if (loading) return <div className="p-10 text-center text-white animate-pulse">Loading Budget...</div>
  if (!profile) return <BudgetOnboarding userId={userId} onComplete={() => window.location.reload()} />

  // Calculations
  const totalSpent = budgets.reduce((sum, b) => sum + (b.currentAmount || 0), 0)
  const projectedSavings = (profile.monthlyIncome || 0) - (profile.fixedExpensesAmount || 0) - totalSpent
  const isSavingsAtRisk = projectedSavings < (profile.savingsTarget || 0)

  return (
    <div className="p-6 space-y-8 animate-fade-in text-white">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold gradient-text">Your Monthly Budget</h2>
          <p className="text-yellow-50/80 mt-1 font-medium">
            Track your daily spending and protect your savings.
          </p>
        </div>
        <button
          onClick={() => setProfile(null)}
          className="btn-vibrant-outline text-sm py-2 px-4 rounded-full"
        >
          Edit Plan
        </button>
      </div>

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <i className="fas fa-robot text-6xl"></i>
          </div>
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <span className="text-blue-300">🤖 AI Financial Advisor</span>
          </h3>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <p key={idx} className="text-sm md:text-base text-white/90" dangerouslySetInnerHTML={{ __html: rec.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }}></p>
            ))}
          </div>
        </div>
      )}

      {/* High Level Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-vibrant bg-white/5 border-white/10">
          <div className="text-sm text-lime-100/70 uppercase tracking-wider mb-1 font-bold">Income</div>
          <div className="text-2xl font-bold">₹{profile.monthlyIncome?.toLocaleString()}</div>
        </div>
        <div className="card-vibrant bg-white/5 border-white/10">
          <div className="text-sm text-lime-100/70 uppercase tracking-wider mb-1 font-bold">Fixed Expenses</div>
          <div className="text-2xl font-bold">₹{profile.fixedExpensesAmount?.toLocaleString()}</div>
        </div>
        <div className="card-vibrant bg-white/5 border-white/10">
          <div className="text-sm text-lime-100/70 uppercase tracking-wider mb-1 font-bold">Total Spent (Variable)</div>
          <div className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</div>
        </div>
        <div className={`card - vibrant border ${isSavingsAtRisk ? 'bg-orange-500/10 border-orange-500/30' : 'bg-emerald-500/10 border-emerald-500/30'} `}>
          <div className={`text - sm uppercase tracking - wider mb - 1 ${isSavingsAtRisk ? 'text-orange-300' : 'text-emerald-300'} `}>Projected Savings</div>
          <div className="text-2xl font-bold">₹{projectedSavings.toLocaleString()}</div>
          <div className="text-xs mt-1 text-white/80 font-medium">Target: ₹{profile.savingsTarget?.toLocaleString()}</div>
        </div>
      </div>

      {/* Savings Alert */}
      {isSavingsAtRisk && (
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="font-bold text-orange-200">Savings Risk Alert</h4>
            <p className="text-sm text-white/70">
              You are overspending by <span className="font-bold text-white">₹{(profile.savingsTarget - projectedSavings).toLocaleString()}</span>.
              Reduce variable spending to meet your savings goal.
            </p>
          </div>
        </div>
      )}

      {/* Category Budgets */}
      <div>
        <h3 className="text-xl font-bold mb-4">Category Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets
            .filter(b => [
              "Bills", "Health", "Miscellaneous", "Food & Drink", "Shopping",
              "Groceries", "Transport", "Entertainment", "Subscriptions", "Rent", "Utilities"
            ].includes(b.name))
            .map(b => (
              <BudgetCard
                key={b.budgetId}
                budget={b}
                transactions={transactions.filter(t =>
                  (t.category?.name || t.predictedCategory)?.toLowerCase() === b.name.toLowerCase() &&
                  new Date(t.txnDate).getMonth() === new Date().getMonth() &&
                  new Date(t.txnDate).getFullYear() === new Date().getFullYear()
                )}
                alertThresholds={profile?.alertThresholds}
              />
            ))}
        </div>
      </div>
    </div>
  )
}

function BudgetCard({ budget, transactions = [], alertThresholds = "80" }) {
  const [expanded, setExpanded] = useState(false)
  const limit = budget.limitAmount || 1 // Avoid div by 0
  const spent = budget.currentAmount || 0
  const percent = (spent / limit) * 100
  const isOver = spent > limit

  // Dynamic Alert Logic
  const thresholds = alertThresholds.split(',').map(Number).sort((a, b) => b - a); // Descending
  const crossedThreshold = thresholds.find(t => percent >= t);
  const isAlert = crossedThreshold && !isOver;

  let color = "bg-emerald-500"
  if (isAlert) color = "bg-yellow-500"
  if (isOver) color = "bg-red-500"

  return (
    <div className="card-vibrant group hover:translate-y-[-2px] transition-all relative">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-bold text-lg">{budget.name}</h4>
        {isOver && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">Over Expectation</span>}
        {!isOver && isAlert && <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full">{crossedThreshold}% Used</span>}
      </div>

      <div className="flex justify-between text-sm mb-2 text-white/70">
        <span>Spent: <span className={isOver ? 'text-red-300 font-bold' : 'text-white'}>₹{spent.toLocaleString()}</span></span>
        <span>Limit: ₹{limit.toLocaleString()}</span>
      </div>

      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full ${color} transition-all duration-1000`}
          style={{ width: `${Math.min(100, percent)}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center text-xs text-white/40">
        <span>
          {isOver
            ? `Exceeded by ₹${(spent - limit).toLocaleString()} `
            : `${(limit - spent).toLocaleString()} remaining`}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="hover:text-white transition-colors"
        >
          {expanded ? 'Hide Transactions' : 'Show Transactions'} ▼
        </button>
      </div>

      {/* Transactions List */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-2 max-h-40 overflow-y-auto animate-fade-in">
          {transactions.length === 0 ? (
            <div className="text-xs text-white/30 text-center italic">No transactions this month</div>
          ) : (
            transactions.map(t => (
              <div key={t.transactionId} className="flex justify-between text-xs">
                <span className="text-white/60">{t.merchant}</span>
                <span className="font-mono">₹{t.amount}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}