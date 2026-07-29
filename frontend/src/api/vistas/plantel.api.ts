// frontend/src/api/vistas/plantel.api.ts
import AxiosPublic from '../axiosPublic'
import type { PlantelActivoIntegrante } from '../../types/vistas'

/**
 * Devuelve la nómina de un equipo, siempre de UN solo plantel.
 *
 * Con `idTorneo` el backend resuelve el plantel de ese torneo (contemplando los
 * playoffs, que usan el del torneo base, y cayendo al plantel histórico si el
 * equipo todavía no cargó su nómina para ese torneo). Sin `idTorneo` devuelve
 * el histórico si existe y, si no, el más reciente.
 *
 * Los errores se propagan a propósito: devolver [] los volvía indistinguibles
 * de "el equipo no tiene plantel", que es un estado legítimo y muy distinto.
 */
export async function getPlantelActivoPorEquipo(
  idEquipo: number,
  idTorneo?: number,
): Promise<PlantelActivoIntegrante[]> {
  const response = await AxiosPublic.get(`/vistas/plantel-activo/${idEquipo}`, {
    params: idTorneo != null ? { id_torneo: idTorneo } : undefined,
  })
  return Array.isArray(response.data) ? response.data : []
}
