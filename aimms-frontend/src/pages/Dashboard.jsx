import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import API, {
  getTransactions, getUserBudgets, getUserGoals, getRecommendations, getMyNotifications, getBudgetProfile
} from '../services/api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName') || 'User';

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profRes, txRes, budRes, goalRes, notifRes, recRes] = await Promise.all([
        API.get(`/budgets/profile/${userId}`).catch(() => ({ data: null })), // Handle 404 if no profile
        getTransactions(userId),
        getUserBudgets(userId),
        getUserGoals(userId),
        getMyNotifications(userId, 0, 5), // Top 5
        getRecommendations(userId)
      ]);

      setProfile(profRes.data);
      setTransactions(txRes || []);
      setBudgets(budRes || []);
      setGoals(goalRes || []);
      setNotifications(notifRes || []);
      setRecommendations(recRes || []);
    } catch (error) {
      console.error("Dashboard Data Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center p-10">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white/60 animate-pulse">Gathering financial insights...</p>
      </div>
    </div>
  );

  // --- Derived Data & Calculations ---

  // 1. Financial Summary
  const monthlyIncome = profile?.monthlyIncome || 0;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthTransactions = transactions.filter(t => {
    const d = new Date(t.txnDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpent = thisMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  const savings = monthlyIncome - totalSpent - (profile?.fixedExpensesAmount || 0);
  const savingsProgress = profile?.savingsTarget ? (savings / profile.savingsTarget) * 100 : 0;

  // 2. Chart Data (Category Wise)
  const categoryData = budgets.map(b => ({
    name: b.name,
    spent: b.currentAmount || 0,
    limit: b.limitAmount || 1000, // Fallback
    color: (b.currentAmount > b.limitAmount) ? '#EF4444' : '#10B981' // Red if over, Green otherwise
  })).filter(c => c.spent > 0); // Only show active categories

  // 3. Alerts
  const criticalBudgets = budgets.filter(b => b.currentAmount > b.limitAmount);

  return (
    <div className="p-6 space-y-8 animate-fade-in text-white pb-20">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Welcome back, <span className="bg-gradient-to-r from-lime-400 to-yellow-400 bg-clip-text text-transparent">{userName}</span>
          </h1>
          <p className="text-yellow-50/80 mt-1 font-medium">
            Here is your financial forecast for today.
          </p>
        </div>
        <Link to="/transactions" className="btn-vibrant px-5 py-2 rounded-full shadow-lg hover:shadow-cyan-500/20">
          + Add Transaction
        </Link>
      </div>

      {/* Row 1: Financial Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Monthly Income"
          value={`₹${monthlyIncome.toLocaleString()}`}
          icon="💰"
          color="bg-emerald-500/30 border-emerald-300/40 text-emerald-50"
          valueColor="text-emerald-300"
        />
        <SummaryCard
          title="Total Spent"
          value={`₹${totalSpent.toLocaleString()}`}
          subValue={`${thisMonthTransactions.length} txns`}
          icon="💸"
          color="bg-rose-500/30 border-rose-300/40 text-rose-50"
          valueColor="text-rose-300"
        />
        <SummaryCard
          title="Savings Forecast"
          value={`₹${Math.max(0, savings).toLocaleString()}`}
          subValue={profile?.savingsTarget ? `${Math.min(100, Math.round(savingsProgress))}% of target` : 'No target set'}
          icon="🛡️"
          color="bg-blue-500/30 border-blue-300/40 text-blue-50"
          valueColor="text-blue-300"
        />
        <SummaryCard
          title="Active Alerts"
          value={criticalBudgets.length}
          subValue={criticalBudgets.length > 0 ? "Budgets Exceeded!" : "All Clean"}
          icon="⚠️"
          color={criticalBudgets.length > 0 ? "bg-amber-500/30 border-amber-300/40 text-amber-50 animate-pulse" : "bg-white/10 border-white/20 text-white"}
          valueColor={criticalBudgets.length > 0 ? "text-amber-300" : "text-white"}
        />
      </div>

      {/* Row 2: Charts & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Left: Spending Visualization */}
        <div className="lg:col-span-2 card-vibrant bg-white/5 border-white/10 min-h-[400px] flex flex-col">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <span className="p-1 rounded bg-purple-500/20 text-purple-300">📊</span> Spending Analysis
          </h3>
          <div className="flex-1 w-full min-h-[300px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.5)" tickFormatter={(val) => `₹${val}`} />
                  <YAxis dataKey="name" type="category" stroke="white" width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="spent" name="Spent" radius={[0, 4, 4, 0]} barSize={20}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                  <Bar dataKey="limit" name="Budget Limit" fill="rgba(255, 255, 255, 1)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/30">
                <p>No category data yet.</p>
                <Link to="/budgets" className="text-blue-400 text-sm mt-2 hover:underline">Set up Budgets</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Intelligence Panel */}
        <div className="card-vibrant bg-gradient-to-b from-indigo-900/40 to-purple-900/40 border-indigo-500/30 flex flex-col">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-indigo-200">
            <span className="animate-pulse">✨</span> AIMMS Intelligence
          </h3>

          <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2 max-h-[350px]">
            {/* Budget Alerts */}
            {criticalBudgets.map(b => (
              <div key={b.budgetId} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs">
                <div className="flex justify-between font-bold text-red-300 mb-1">
                  <span>Over Budget: {b.name}</span>
                  <span>{Math.round((b.currentAmount / b.limitAmount) * 100)}%</span>
                </div>
                <p className="text-white/70">
                  Limit: ₹{b.limitAmount} | Spent: ₹{b.currentAmount}
                </p>
              </div>
            ))}

            {/* Recommendations */}
            {recommendations.length > 0 ? (
              recommendations.map((rec, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">💡</span>
                    <p className="text-sm text-white/80 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: rec.replace(/\*\*(.*?)\*\*/g, '<b class="text-white">$1</b>') }}>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-white/70 text-sm">
                AI is analyzing your patterns...
              </div>
            )}
          </div>

          <Link to="/budgets" className="mt-4 text-center text-xs text-indigo-300 hover:text-white transition-colors">
            View Full Analysis →
          </Link>
        </div>
      </div>

      {/* Row 3: Operational Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="card-vibrant bg-white/5 border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Recent Activity</h3>
            <Link to="/transactions" className="text-xs text-white/50 hover:text-white">View All</Link>
          </div>
          <div className="space-y-3">
            {transactions.slice(0, 5).map(t => (
              <div key={t.transactionId} className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold 
                                        ${t.type === 'EXPENSE' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                    {t.type === 'EXPENSE' ? '↓' : '↑'}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t.merchant || 'Unknown'}</div>
                    <div className="text-xs text-white/70">{new Date(t.txnDate).toLocaleDateString()}</div>
                  </div>
                </div>
                <span className={`font-mono text-sm ${t.type === 'EXPENSE' ? 'text-white' : 'text-green-400'}`}>
                  {t.type === 'EXPENSE' ? '-' : '+'}₹{t.amount}
                </span>
              </div>
            ))}
            {transactions.length === 0 && <div className="text-center text-white/50 text-sm py-4">No recent transactions</div>}
          </div>
        </div>

        {/* Savings Goals */}
        <div className="card-vibrant bg-white/5 border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Savings Goals</h3>
            <Link to="/goals" className="text-xs text-white/50 hover:text-white">Manage</Link>
          </div>
          <div className="space-y-4">
            {goals.slice(0, 3).map(g => {
              const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
              return (
                <div key={g.goalId}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{g.goalName}</span>
                    <span className="text-white/90">{Math.round(pct)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && (
              <div className="text-center py-6">
                <p className="text-white/70 text-sm mb-3">No goals set yet.</p>
                <Link to="/goals" className="btn-vibrant-outline text-xs px-3 py-1 rounded-full">Create Goal</Link>
              </div>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="card-vibrant bg-white/5 border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Announcements</h3>
            <Link to="/notifications" className="text-xs text-white/50 hover:text-white">View All</Link>
          </div>
          <div className="space-y-3">
            {notifications.filter(n => n.broadcast).slice(0, 3).map(n => (
              <div key={n.notificationId} className="p-3 rounded bg-blue-500/5 border border-blue-500/10">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">System</span>
                  <span className="text-[10px] text-white/70">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="text-sm font-bold mb-1">{n.title}</h4>
                <p className="text-xs text-white/90 line-clamp-2">{n.body}</p>
              </div>
            ))}
            {notifications.filter(n => n.broadcast).length === 0 && (
              <div className="text-center text-white/50 text-sm py-4">No recent announcements</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function SummaryCard({ title, value, subValue, icon, color, valueColor }) {
  return (
    <div className={`p-5 rounded-2xl border transition-all hover:scale-105 ${color}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xs uppercase tracking-widest opacity-80 mb-1">{title}</h3>
          <div className={`text-2xl font-bold font-display ${valueColor || ''}`}>{value}</div>
          {subValue && <div className="text-[10px] mt-1 opacity-70 font-medium">{subValue}</div>}
        </div>
        <div className="text-4xl opacity-100 drop-shadow-sm">{icon}</div>
      </div>
    </div>
  );
}
