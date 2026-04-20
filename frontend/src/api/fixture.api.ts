import axiosAdmin from "./axiosAdmin"
import axiosPublic from "./axiosPublic"
import type {
  FixturePartido,
  FixturePartidoCreate,
  FixturePartidoUpdate,
  FixturePreviewResponse,
  TipoFixture,
} from "../types/fixture"

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

export async function listarFixturePorTorneoAdmin(idTorneo: number): Promise<FixturePartido[]> {
  const res = await axiosAdmin.get<FixturePartido[]>(`/fixture/admin/torneo/${idTorneo}`)
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

export async function previsualizarFixture(idTorneo: number, tipo: TipoFixture): Promise<FixturePreviewResponse> {
  const res = await axiosAdmin.post<FixturePreviewResponse>(`/fixture/preview/${idTorneo}`, { tipo })
  return res.data
}

export async function generarFixture(idTorneo: number, tipo: TipoFixture): Promise<FixturePartido[]> {
  const res = await axiosAdmin.post<FixturePartido[]>(`/fixture/generar/${idTorneo}`, { tipo })
  return res.data
}

export async function eliminarFixtureTorneo(idTorneo: number): Promise<void> {
  await axiosAdmin.delete(`/fixture/torneo/${idTorneo}`)
}
