import { useState, useEffect, useCallback } from "react";
import { obtenerPartidosRecientes } from "../api/partidos.api";

export const usePartidos = (torneoId?: number) => {
  const [partidos, setPartidos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartidos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await obtenerPartidosRecientes(torneoId);
      setPartidos(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar los partidos");
    } finally {
      setLoading(false);
    }
  }, [torneoId]);

  useEffect(() => {
    fetchPartidos();
  }, [fetchPartidos]);

  // Función para procesar los strings de la DB y convertirlos en arrays de objetos
  const parseIncidencias = (str: string) => {
    if (!str) return [];
    return str.split("; ").map((item) => {
      const [apellido, nombre, minuto, cuarto, extra] = item.split("|");
      return {
        jugador: `${apellido}, ${nombre}`,
        minuto,
        cuarto,
        extra, // esAutogol (boolean) o tipoTarjeta (string)
      };
    });
  };

  return { 
    partidos, 
    loading, 
    error, 
    refresh: fetchPartidos,
    parseIncidencias 
  };
};