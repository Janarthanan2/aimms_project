import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdmin } from '../services/api'

export default function LoginAdmin() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            setLoading(true)
            const admin = await loginAdmin(email, password)

            localStorage.setItem('userType', 'admin')
            localStorage.setItem('token', admin.token) // Store JWT Token
            localStorage.setItem('userId', admin.id || admin.adminId)
            localStorage.setItem('userName', admin.name)
            localStorage.setItem('userEmail', admin.email)
            localStorage.setItem('role', admin.role) // Store role (should be ADMIN)
            navigate('/admin')
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements - darker theme for admin */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
                <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl animate-pulse-slow"></div>
            </div>

            <div className="card-vibrant max-w-md w-full animate-scale-in relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-dark mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-display font-bold gradient-text mb-3">
                        Admin Portal
                    </h1>
                    <p className="text-white/80 text-lg">Secure Administrator Access</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-white text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-white/90 font-medium mb-2">Admin Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-vibrant w-full"
                            placeholder="admin@aimms.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-white/90 font-medium mb-2">Admin Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-vibrant w-full"
                            placeholder="Enter admin password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-white/80 cursor-pointer">
                            <input type="checkbox" className="mr-2 rounded" />
                            Keep me signed in
                        </label>
                        <a href="#" className="text-white hover:text-white/80 transition-colors">
                            Reset password
                        </a>
                    </div>

                    <button type="submit" className="btn-vibrant w-full" disabled={loading}>
                        {loading ? 'Signing In...' : 'Access Admin Panel'}
                    </button>
                </form>

                <div className="mt-8 p-4 glass-dark rounded-lg">
                    <p className="text-white/60 text-xs text-center">
                        ⚠️ This is a restricted area. All access attempts are logged and monitored.
                    </p>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-white/60 text-sm">
                        Not an administrator?{' '}
                        <button
                            onClick={() => navigate('/login-user')}
                            className="text-primary-300 font-semibold hover:text-primary-200 transition-colors"
                        >
                            User Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
