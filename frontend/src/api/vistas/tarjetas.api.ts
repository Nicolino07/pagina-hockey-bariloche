// En api/vistas/tarjetas.api.ts

import AxiosPublic from "../axiosPublic"
import type { TarjetaAcumulada } from "../../types/vistas"

export async function obtenerTarjetasAcumuladas(idTorneo: number): Promise<TarjetaAcumulada[]> {
  const res = await AxiosPublic.get<TarjetaAcumulada[]>(`/vistas/tarjetas-acumuladas`, {
    params: { id_torneo: idTorneo }
  });
  return res.data;
}