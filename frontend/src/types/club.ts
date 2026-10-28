// src/types/club.ts

export type Club = {
  id_club: number
  nombre: string
  provincia: string
  ciudad: string
  direccion?: string | null
  telefono?: string | null
  email?: string | null
  borrado_en?: string | null
  activo: boolean
}

export type ClubCreate = {
  nombre: string
  provincia: string
  ciudad: string
  direccion?: string
  telefono?: string
  email?: string
}

export type ClubUpdate = Partial<ClubCreate>
