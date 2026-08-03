import axiosAdmin from './axiosAdmin';
import axiosPublic from './axiosPublic';

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

// Recuperar y cambiar contraseña

export const authApi = {
  // Cambio de clave estando logueado
  cambiarPassword: async (oldPassword: string, newPassword: string) => {
    const res = await axiosAdmin.patch("/auth/cambiar-password", {
      old_password: oldPassword,
      new_password: newPassword
    });
    return res.data;
  },

  // Olvido de clave (Público)
  solicitarRecuperacion: async (email: string) => {
    const res = await axiosPublic.post("/auth/recuperar-password", { email });
    return res.data;
  },

  // Formulario final con el token del mail
  confirmarReset: async (token: string, newPassword: string) => {
    const res = await axiosPublic.post("/auth/reset-password-confirm", {
      token,
      new_password: newPassword
    });
    return res.data;
  },

  // Edición del propio perfil (Mi Perfil)
  // Si se envía `email` y es distinto al actual, no se aplica al instante:
  // el backend manda un link de confirmación al email nuevo (ver `email_pendiente`
  // en la respuesta) y el login sigue funcionando con el email actual hasta confirmarlo.
  actualizarPerfil: async (data: { nombre?: string; apellido?: string; telefono?: string; email?: string }) => {
    const res = await axiosAdmin.patch("/auth/me", data);
    return res.data;
  },

  // Confirma el cambio de email con el token recibido en el link (Público)
  confirmarCambioEmail: async (token: string) => {
    const res = await axiosPublic.post("/auth/confirmar-cambio-email", { token });
    return res.data;
  },

  // Danger zone: cierre de la cuenta propia
  cerrarCuenta: async () => {
    const res = await axiosAdmin.delete("/auth/me");
    return res.data;
  }
};