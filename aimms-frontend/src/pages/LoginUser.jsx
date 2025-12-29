import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../services/api'

export default function LoginUser() {
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
            const user = await loginUser(email, password)

            localStorage.setItem('userType', 'user')
            localStorage.setItem('token', user.token) // Store JWT Token
            localStorage.setItem('userId', user.id)
            localStorage.setItem('userName', user.name)
            localStorage.setItem('role', user.role) // Store role
            navigate('/dashboard')
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary-400/30 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary-400/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
            </div>

            <div className="card-vibrant max-w-md w-full animate-scale-in relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-display font-bold gradient-text mb-3">
                        Welcome Back
                    </h1>
                    <p className="text-white/80 text-lg">Sign in to your account</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-white text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-white/90 font-medium mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-vibrant w-full"
                            placeholder="Enter your email"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-white/90 font-medium mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-vibrant w-full"
                            placeholder="Enter your password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-white/80 cursor-pointer">
                            <input type="checkbox" className="mr-2 rounded" />
                            Remember me
                        </label>
                        <a href="#" className="text-white hover:text-white/80 transition-colors">
                            Forgot password?
                        </a>
                    </div>

                    <button type="submit" className="btn-vibrant w-full" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-white/70">
                        Don't have an account?{' '}
                        <button
                            onClick={() => navigate('/signup')}
                            className="text-white font-semibold hover:text-white/80 transition-colors"
                        >
                            Sign up
                        </button>
                    </p>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-white/60 text-sm">
                        Are you an administrator?{' '}
                        <button
                            onClick={() => navigate('/login-admin')}
                            className="text-accent-300 font-semibold hover:text-accent-200 transition-colors"
                        >
                            Admin Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
