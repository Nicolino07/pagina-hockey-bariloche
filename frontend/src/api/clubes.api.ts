import api from "./axiosAdmin"
import AxiosPublic from "./axiosPublic"
import type { Club, ClubCreate, ClubUpdate } from "../types/club"
import type {Equipo} from "../types/equipo"

function mapClubFromApi(data: any): Club {
  return {
    id_club: data.id_club,
    nombre: data.nombre,
    provincia: data.provincia,
    ciudad: data.ciudad,
    direccion: data.direccion,
    telefono: data.telefono,
    email: data.email,
    borrado_en: data.borrado_en,
    activo: data.borrado_en === null,
  }
}

// 🔓 Público
export async function getClubes(): Promise<Club[]> {
  const res = await AxiosPublic.get("/clubes/")
  return res.data.map(mapClubFromApi)
}

// 🔓 Público
export async function getClubById(id: number): Promise<Club> {
  const res = await AxiosPublic.get(`/clubes/${id}`)
  return mapClubFromApi(res.data)
}
// 🔓 Público
export async function listarEquiposPorClub(idClub: number): Promise<Equipo[]> {
  const res = await AxiosPublic.get(`/clubes/${idClub}/equipos/`)
  return res.data
}


// ---------------- Rutas Admin ------------------------------------
// 🔐 ADMIN
export async function crearClub(payload: ClubCreate): Promise<Club> {
  const res = await api.post("/clubes/", payload)
  return mapClubFromApi(res.data)
}

// 🔐 ADMIN
export async function updateClub(
  id: number,
  payload: ClubUpdate
): Promise<Club> {
  const res = await api.put(`/clubes/${id}`, payload)
  return mapClubFromApi(res.data)
}

// 🔐 ADMIN
export async function deleteClub(id: number): Promise<void> {
  await api.delete(`/clubes/${id}`)
}

