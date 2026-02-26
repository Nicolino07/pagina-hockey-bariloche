// api/noticias.api.ts
import api from "./axiosAdmin"
import axiosPublic from "./axiosPublic";

// --- FUNCIONES PÚBLICAS (Usan axiosPublic) ---

export const obtenerNoticiasRecientes = async (limit: number = 5) => {
  // Usamos axiosPublic porque cualquier usuario debe ver el home/lista
  const res = await axiosPublic.get(`/noticias/`, { params: { limit } }); // ✅ Barra final
  return res.data; 
};

export const obtenerNoticiaPorId = async (id: string | number) => {
  // ✅ Barra final después del ID es CRÍTICA
  const response = await axiosPublic.get(`/noticias/${id}/`); 
  return response.data;
};


// --- FUNCIONES PRIVADAS (Usan axiosAdmin / Requieren Token) ---

export const crearNoticia = async (noticia: any) => {
  const res = await api.post(`/noticias/`, noticia); // ✅ Barra final
  return res.data;
};

export const eliminarNoticia = async (id_noticia: number) => {
  // Agregamos la barra final después del ID
  const res = await api.delete(`/noticias/${id_noticia}/`); // ✅ Barra final
  return res.data;
};

export const actualizarNoticia = async (id_noticia: number, datos: any) => {
  // Agregamos la barra final después del ID
  const res = await api.put(`/noticias/${id_noticia}/`, datos); // ✅ Barra final
  return res.data;
};