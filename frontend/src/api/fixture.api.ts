import axiosAdmin from "./axiosAdmin"
import axiosPublic from "./axiosPublic"
import type { FixturePartido, FixturePartidoCreate, FixturePartidoUpdate } from "../types/fixture"

// ── Público ────────────────────────────────────────────────────────────────────

export async function listarProximosPartidos(torneoId?: number): Promise<FixturePartido[]> {
  const params = torneoId ? { torneo_id: torneoId } : {}
  const res = await axiosPublic.get<FixturePartido[]>("/fixture/proximos", { params })
  return res.data
}

export async function listarFixturePorTorneo(idTorneo: number): Promise<FixturePartido[]> {
  const res = await axiosPublic.get<FixturePartido[]>(`/fixture/torneo/${idTorneo}`)
  return res.data
}

export async function obtenerFixturePartido(id: number): Promise<FixturePartido> {
  const res = await axiosPublic.get<FixturePartido>(`/fixture/${id}`)
  return res.data
}

// ── Admin ──────────────────────────────────────────────────────────────────────

export async function programarPartido(data: FixturePartidoCreate): Promise<FixturePartido> {
  const res = await axiosAdmin.post<FixturePartido>("/fixture/", data)
  return res.data
}

export async function editarPartidoFixture(id: number, data: FixturePartidoUpdate): Promise<FixturePartido> {
  const res = await axiosAdmin.put<FixturePartido>(`/fixture/${id}`, data)
  return res.data
}

export async function eliminarPartidoFixture(id: number): Promise<void> {
  await axiosAdmin.delete(`/fixture/${id}`)
}
