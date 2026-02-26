import axiosPublic from "../axiosPublic";
import type { GoleadorTorneo } from "../../types/vistas";

export async function obtenerGoleadoresTorneo(idTorneo: number): Promise<GoleadorTorneo[]> {
  const res = await axiosPublic.get<GoleadorTorneo[]>(`vistas/goleadores/${idTorneo}`);
  return res.data;
}