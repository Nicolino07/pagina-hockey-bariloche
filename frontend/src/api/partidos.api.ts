
import api from "./axiosAdmin"
import axiosPublic from "./axiosPublic";


/**
 * Obtiene los últimos partidos con el detalle de la vista (goles, tarjetas, autores)
 * @param {number} torneoId - Opcional: filtra por un torneo específico
 */
export const obtenerPartidosRecientes = async (torneoId?: number) => {
  try {
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
 * Obtiene los datos estructurados de un partido para edición
 * Incluye participantes, goles y tarjetas separados
 */
export const getPartidoParaEditar = async (id_partido: number) => {
  try {
    const response = await api.get(`/partidos/planilla/${id_partido}/editar`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    const mensaje = error.response?.data?.detail || "Error al obtener partido";
    console.error("Error en getPartidoParaEditar:", mensaje);
    throw new Error(mensaje);
  }
};

/**
 * Actualiza la planilla completa de un partido existente
 * Borra y recrea participantes, goles y tarjetas
 */
export const actualizarPlanillaPartido = async (id_partido: number, data: any) => {
  try {
    const response = await api.put(`/partidos/planilla/${id_partido}`, data, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    const mensaje = error.response?.data?.detail || "Error al actualizar el partido";
    console.error("Error en actualizarPlanillaPartido:", mensaje);
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


/**
 * Trae los partidos del equipo usando la vista vw_partidos_detallados
 */
export const getPartidosByEquipo = async (equipoNombre: string) => {
  // Nota: Si tu backend permite filtrar la vista por query params
  const response = await axiosPublic.get(`/partidos/detallados?equipo=${equipoNombre}`);
  return response.data; 
  // Si el backend no filtra, tendrías que hacer el .filter() en el frontend
};

/**
 * Trae la tabla de posiciones de un torneo específico
 */
export const getTablaPosiciones = async (torneoId: number) => {
  const response = await axiosPublic.get(`/posiciones/torneo/${torneoId}`);
  return response.data;
};

/**
 * Trae el historial de partidos de un equipo por su id
 */
export const getHistorialPorEquipo = async (id_equipo: number, limit = 10) => {
  const response = await axiosPublic.get(`/partidos/equipos/${id_equipo}`, {
    params: { limit },
  });
  return response.data;
};