
import AxiosPublic from "../axiosPublic"
import type { FilaPosiciones } from "../../types/vistas"

export async function obtenerPosiciones(idTorneo: number): Promise<FilaPosiciones[]> {
  // Agregamos el prefijo /vistas que pide tu backend
  const res = await AxiosPublic.get<FilaPosiciones[]>(`vistas/torneos/${idTorneo}/posiciones`);
  return res.data;
}