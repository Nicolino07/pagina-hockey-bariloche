import api from "./axiosAdmin"


export const obtenerNoticiasRecientes = async (limit: number = 5) => {
  // Pasamos el limit como query param según definimos en el Router
  const res = await api.get(`/noticias/`, { params: { limit } });
  return res.data; 
};

export const crearNoticia = async (noticia: any) => {
  // El body debe coincidir con el Schema 'NoticiaCreate'
  const res = await api.post(`/noticias/`, noticia);
  return res.data;
};

export const eliminarNoticia = async (id_noticia: number) => {
  // Usamos el ID específico de tu tabla
  const res = await api.delete(`/noticias/${id_noticia}`);
  return res.data;
};

export const actualizarNoticia = async (id_noticia: number, datos: any) => {
  const res = await api.put(`/noticias/${id_noticia}`, datos);
  return res.data;
};


// api/noticias.api.ts
import axiosPublic from "./axiosPublic";


// Obtener una noticia específica por ID
export const obtenerNoticiaPorId = async (id: string | number) => {
  const response = await axiosPublic.get(`/noticias/${id}/`); // ✅ Barra final
  return response.data;
};