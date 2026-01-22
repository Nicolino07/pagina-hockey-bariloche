import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: true, // 👈 necesario para cookies (refresh token)
})

// 👉 Request interceptor (access token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 👉 Response interceptor (401 → logout por ahora)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default api
