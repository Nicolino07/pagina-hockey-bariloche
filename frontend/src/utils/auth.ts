interface StoredAuth {
  token: string
  user: any
}

const AUTH_KEY = 'auth_data'

export const authUtils = {
  setAuthData(token: string, user: any) {
    const data: StoredAuth = { token, user }
    localStorage.setItem(AUTH_KEY, JSON.stringify(data))
  },

  getAuthData(): StoredAuth | null {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  clearAuth() {
    localStorage.removeItem(AUTH_KEY)
  }
}