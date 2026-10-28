// src/types/auth.ts

export interface LoginCredentials {
  email: string;    // 👈 Cambiado de username a email
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  // Si tu backend NO envía el objeto 'user' en el login, 
  // es mejor quitarlo de aquí para evitar errores de TypeScript.
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  nombre?: string;    // 👈 Puestos como opcionales (?) porque en el registro
  apellido?: string;  // inicial quizás solo tengas el email.
  rol: string;
  documento?: number;
  telefono?: string;
  fecha_nacimiento?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}