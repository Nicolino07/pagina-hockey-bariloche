import axiosPublic from "../axiosPublic";
import type { VallaMenosVencida } from "../../types/vistas";

export async function obtenerVallaMenosVencida(idTorneo: number): Promise<VallaMenosVencida[]> {
  const res = await axiosPublic.get<VallaMenosVencida[]>(`/vistas/valla-menos-vencida/${idTorneo}`);
  return res.data;
}
