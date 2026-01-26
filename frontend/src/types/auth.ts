// src/types/auth.ts
export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id: number
    email: string
    nombre: string
    apellido: string
    rol: string
  }
}

export interface RefreshResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: number
  email: string
  nombre: string
  apellido: string
  rol: string
  documento?: number
  telefono?: string
  fecha_nacimiento?: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  error: string | null
}

