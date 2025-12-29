import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'

const items = [

  ['Transactions', '/transactions', '💳'],
  ['Budgets', '/budgets', '💰'],
  ['Goals', '/goals', '🎯'],
  ['Receipts', '/receipts', '🧾'],
  ['OCR', '/ocr', '📷'],
  // ['Plaid', '/plaid', '🔗'],
  // ['Subscriptions', '/subscriptions', '📅'],
  ['Feedback', '/feedback', '💬'],
  ['Badges', '/badges', '🏆'],
  ['Admin', '/admin', '⚙️']
]

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const role = localStorage.getItem('role') || 'USER';

  // Process items: Map Dashboard -> /admin if ADMIN
  const filteredItems = items.map(([label, to, icon]) => {
    if (['ADMIN', 'SUB_ADMIN'].includes(role) && label === 'Dashboard') {
      return [label, '/admin', icon];
    }
    return [label, to, icon];
  }).filter(([label]) => {
    if (['ADMIN', 'SUB_ADMIN'].includes(role)) {
      // Hide Duplicate 'Admin' link link since Dashboard points there now
      if (label === 'Admin') return false;
      return !['Users', 'Budgets', 'Goals', 'Receipts', 'OCR', 'Plaid', 'Subscriptions', 'Transactions', 'Feedback', 'Badges'].includes(label);
    }
    // User hides Admin and Users
    return !['Admin', 'Users'].includes(label);
  });

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-60'} h-full border-r border-lime-900/30 transition-all duration-300 overflow-hidden flex flex-col bg-black/60 backdrop-blur-xl`}
    // style={{ backgroundColor: '#F8F8FF' }}
    >
      {/* Header with toggle */}
      {/* Header with toggle */}
      <div className="p-4 border-b border-lime-900/30 flex items-center justify-between flex-shrink-0">
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-3xl font-display font-bold gradient-text whitespace-nowrap">AIMMS</h1>
            <p className="text-lime-100 text-xs mt-1 whitespace-nowrap font-medium">Financial Management</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg bg-lime-900/10 hover:bg-lime-900/30 transition-all duration-200 flex-shrink-0"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-5 h-5 text-lime-500 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-2 mt-2 overflow-y-auto flex-1">
        {filteredItems.map(([label, to, icon]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg my-1 transition-all duration-300 font-medium overflow-hidden ${isActive
                ? 'bg-gradient-to-r from-lime-600 to-olive-700 text-white shadow-lg shadow-lime-900/40 transform scale-105'
                : 'text-yellow-50/90 hover:bg-lime-900/30 hover:text-white hover:transform hover:scale-105'
              }`
            }
            title={isCollapsed ? label : ''}
          >
            <span className="text-xl flex-shrink-0">{icon}</span>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
