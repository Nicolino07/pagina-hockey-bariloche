// Archivo: frontend/src/api/vistas/posiciones.api.ts
import AxiosPublic from "../axiosPublic"
import type { FilaPosiciones } from "../../types/vistas"

export async function obtenerPosiciones(idTorneo: number): Promise<FilaPosiciones[]> {
  const res = await AxiosPublic.get<FilaPosiciones[]>(`/vistas/torneos/${idTorneo}/posiciones`);
  return res.data;
}