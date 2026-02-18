import axiosAdmin from './axiosAdmin';

// Reutilizamos o definimos la interfaz aquí
export interface Usuario {
  id_usuario: number;
  username: string;
  email: string;
  tipo: string;
  activo: boolean;
  ultimo_login: string | null;
}

export const usuariosApi = {
  /**
   * Obtiene la lista de todos los usuarios (solo Admin)
   */
  getAll: async (): Promise<Usuario[]> => {
    const response = await axiosAdmin.get<Usuario[]>('/auth/usuarios');
    return response.data;
  },

  /**
   * Envía una invitación por email
   */
  invitar: async (email: string, tipo: string): Promise<{ message: string }> => {
    const response = await axiosAdmin.post('/auth/invitar', { email, tipo });
    return response.data;
  },

  /**
   * Actualiza el rol de un usuario específico
   */
  updateRol: async (id: number, tipo: string): Promise<{ message: string }> => {
    // Coincide con backend: PATCH /auth/usuarios/{id_usuario}/rol
    const response = await axiosAdmin.patch(`/auth/usuarios/${id}/rol`, { tipo });
    return response.data;
  },

  /**
   * Activa o desactiva la cuenta de un usuario
   */
  toggleEstado: async (id: number, activo: boolean): Promise<{ message: string }> => {
    // Coincide con backend: PATCH /auth/usuarios/{id_usuario}/estado
    const response = await axiosAdmin.patch(`/auth/usuarios/${id}/estado`, { activo });
    return response.data;
  }
};