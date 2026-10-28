import { useState, useEffect, useCallback } from "react";
import { obtenerPartidosRecientes } from "../api/partidos.api";

/**
 * Hook que carga los partidos recientes, opcionalmente filtrados por torneo.
 * @param torneoId - ID del torneo para filtrar (opcional).
 * @returns Objeto con partidos, estado de carga, error, función de recarga y parseIncidencias.
 */
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

  /**
   * Parsea un string de incidencias concatenadas (goles/tarjetas) proveniente de la DB
   * y lo convierte en un array de objetos estructurados.
   * @param str - String con incidencias separadas por "; " y campos por "|".
   * @returns Array de objetos con jugador, minuto, cuarto, esAutogol y tipoTarjeta.
   */
  const parseIncidencias = (str: string) => {
    if (!str) return [];

    return str.split("; ").map((item) => {
      const [apellido, nombre, minuto, cuarto, extra] = item.split("|");

      return {
        jugador: `${apellido}, ${nombre}`,
        minuto,
        cuarto,
        esAutogol: extra === "true",
        tipoTarjeta:
          extra === "VERDE" ||
          extra === "AMARILLA" ||
          extra === "ROJA"
            ? extra
            : undefined,
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
