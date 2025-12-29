import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import OCR from './pages/OCR'
// import Plaid from './pages/Plaid'
// import Subscriptions from './pages/Subscriptions'
import Notifications from './pages/Notifications'
import Feedback from './pages/Feedback'
import Admin from './pages/Admin'
import Receipts from './pages/Receipts'
import Badges from './pages/Badges'
import LoginUser from './pages/LoginUser'
import LoginAdmin from './pages/LoginAdmin'
import SignUp from './pages/SignUp'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const location = useLocation(); // Force re-render on route change
  const role = localStorage.getItem('role') || 'USER';
  const isAdmin = ['ADMIN', 'SUB_ADMIN'].includes(role);

  return (
    <Routes>
      {/* Login Routes */}
      <Route path="/" element={<Navigate to='/login-user' replace />} />
      <Route path="/login-user" element={<LoginUser />} />
      <Route path="/login-admin" element={<LoginAdmin />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Protected Routes */}
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="flex h-screen">
            {!isAdmin && <Sidebar />}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />

                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/budgets" element={<Budgets />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/ocr" element={<OCR />} />
                  {/* <Route path="/plaid" element={<Plaid />} /> */}
                  {/* <Route path="/subscriptions" element={<Subscriptions />} /> */}
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN']}>
                      <Admin />
                    </ProtectedRoute>
                  } />
                  <Route path="/receipts" element={<Receipts />} />
                  <Route path="/badges" element={<Badges />} />
                </Routes>
              </main>
            </div>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  )
}
