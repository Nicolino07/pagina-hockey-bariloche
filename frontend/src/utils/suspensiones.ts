// frontend/src/utils/suspensiones.ts
import { obtenerSuspensionesActivasPorPersonas } from "../api/suspensiones.api"
import type { Suspension } from "../types/suspension"

/**
 * Una suspensión de torneo (las automáticas por tarjetas, o una manual con
 * torneo) nace y muere en su torneo de origen: solo aplica en ese torneo.
 * Una global (manual, sin torneo, marcada así de forma explícita) aplica en
 * cualquiera, salvo que restrinja roles y no incluya el rol dado.
 * `idTorneo` null = contexto sin torneo (ej. plantel histórico): solo cuentan
 * las globales.
 */
export function aplicaASuspension(s: Suspension, rol: string, idTorneo: number | null): boolean {
  if (s.id_torneo != null) return s.id_torneo === idTorneo
  return !s.roles_afectados || s.roles_afectados.length === 0 || s.roles_afectados.includes(rol as any)
}

/**
 * Dada una lista de integrantes (con id_persona y rol_en_plantel), devuelve la
 * misma lista con un campo `suspendido: boolean` agregado a cada uno, según las
 * suspensiones activas vigentes en el torneo `idTorneo` (ver `aplicaASuspension`).
 * Uso informativo (listados, PDFs), no bloquea nada.
 */
export async function marcarSuspendidos<T extends { id_persona?: number | null; rol_en_plantel?: string | null }>(
  integrantes: T[],
  idTorneo: number | null
): Promise<(T & { suspendido: boolean })[]> {
  const idsPersona = integrantes
    .map(i => i.id_persona)
    .filter((id): id is number => typeof id === "number")

  if (idsPersona.length === 0) {
    return integrantes.map(i => ({ ...i, suspendido: false }))
  }

  const mapa = await obtenerSuspensionesActivasPorPersonas(idsPersona).catch(() => ({}))
  return integrantes.map(i => {
    const suspensiones = typeof i.id_persona === "number" ? mapa[i.id_persona] || [] : []
    const suspendido = suspensiones.some(s => aplicaASuspension(s, i.rol_en_plantel || "", idTorneo))
    return { ...i, suspendido }
  })
}
