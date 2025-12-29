import axios from 'axios'
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8080/api',
  timeout: 60000,
})

// Add a request interceptor to attach the JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('API Request:', config.url, 'Token:', token.substring(0, 10) + '...')
    } else {
      console.warn('API Request:', config.url, 'No Token found in localStorage!')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default API
