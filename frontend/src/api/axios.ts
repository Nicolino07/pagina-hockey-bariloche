import axios from "axios"

// 🔁 Estado global del refresh
let isRefreshing = false
let refreshPromise: Promise<any> | null = null

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: true, // cookies (refresh token)
})

// ===============================
// RESPONSE INTERCEPTOR
// ===============================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh")

    // ⛔ No es 401 o es auth → salir
    if (error.response?.status !== 401 || isAuthEndpoint) {
      return Promise.reject(error)
    }

    // ⛔ Evitar loop infinito
    if (originalRequest._retry) {
      logout()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      // 🔁 Refresh en curso
      if (isRefreshing && refreshPromise) {
        await refreshPromise
      } else {
        isRefreshing = true

        refreshPromise = api.post("/auth/refresh")
        const response = await refreshPromise

        const { access_token } = response.data
        localStorage.setItem("access_token", access_token)

        isRefreshing = false
        refreshPromise = null
      }

      // 🔁 Reintentar request original
      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization = `Bearer ${localStorage.getItem(
        "access_token"
      )}`

      return api(originalRequest)

    } catch (err) {
      logout()
      return Promise.reject(err)
    }
  }
)

// ===============================
// REQUEST INTERCEPTOR
// ===============================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ===============================
// LOGOUT
// ===============================
function logout() {
  localStorage.removeItem("access_token")
  localStorage.removeItem("user")
  window.location.href = "/login"
}

export default api
