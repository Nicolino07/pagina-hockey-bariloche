
import api from "./axiosAdmin"
import axiosPublic from "./axiosPublic";


/**
 * Obtiene los últimos partidos con el detalle de la vista (goles, tarjetas, autores)
 * @param {number} torneoId - Opcional: filtra por un torneo específico
 */
export const obtenerPartidosRecientes = async (torneoId?: number) => {
  try {
    // Ahora si no pasas nada, torneoId es null y la URL será limpia
    const url = torneoId ? `/partidos/recientes?torneo_id=${torneoId}` : `/partidos/recientes`;
    const response = await axiosPublic.get(url, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    // ... error handling
  }
};


/**
 * Crea la planilla completa del partido (Endpoint: POST /partidos/planilla)
 * Este objeto 'data' debe seguir la estructura PlanillaPartidoCreate de tu backend.
 */
export const crearPlanillaPartido = async (data: any) => {
  try {
    const response = await api.post(`/partidos/planilla`, data, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    // Capturamos el error detallado de FastAPI si existe
    const mensaje = error.response?.data?.detail || "Error al crear la planilla";
    console.error("Error en crearPlanillaPartido:", mensaje);
    throw new Error(mensaje);
  }
};

/**
 * Elimina un partido (solo si está en estado BORRADOR)
 */
export const eliminarPartido = async (id_partido: number) => {
  try {
    const response = await api.delete(`/partidos/${id_partido}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    const mensaje = error.response?.data?.detail || "No se pudo eliminar el partido";
    throw new Error(mensaje);
  }
};

/**
 * Obtiene el detalle completo de un partido por su ID
 */
export const obtenerDetallePartido = async (partidoId: number) => {
  try {
    const response = await axiosPublic.get(`/partidos/${partidoId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener detalle del partido:", error);
    throw error;
  }
};