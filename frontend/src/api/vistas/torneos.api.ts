// src/api/vistas/torneos.api.ts
import axiosPublic from "../axiosPublic";
import type { InscripcionTorneoDetalle } from "../../types/inscripcion";

export const obtenerEquiposTorneo = async (idTorneo: number): Promise<InscripcionTorneoDetalle[]> => {
  // Usamos axiosPublic para que cualquier visitante vea los equipos
  const res = await axiosPublic.get<InscripcionTorneoDetalle[]>(`torneos/${idTorneo}/inscripciones/`);
  return res.data;
}