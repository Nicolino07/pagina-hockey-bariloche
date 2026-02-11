
import api from "./axiosAdmin"

/**
 * Obtiene la lista de todos los partidos registrados.
 * Ideal para la PartidosPage.
 */
export const listarPartidos = async () => {
  try {
    const response = await api.get(`/partidos/`, {
      withCredentials: true, // Importante si usas cookies de sesión/auth
    });
    return response.data;
  } catch (error) {
    console.error("Error en listarPartidos:", error);
    throw error;
  }
};

/**
 * Obtiene el detalle de un partido específico.
 */
export const obtenerPartido = async (id_partido: number) => {
  try {
    const response = await api.get(`/partidos/${id_partido}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Error al obtener partido ${id_partido}:`, error);
    throw error;
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