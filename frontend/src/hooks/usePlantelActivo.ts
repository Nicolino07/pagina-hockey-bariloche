import { useEffect, useState, useCallback } from "react"
import { getPlantelActivoPorEquipo } from "../api/vistas/plantel.api"
import type { PlantelActivoIntegrante } from "../types/vistas"

/**
 * Hook que carga los integrantes del plantel de un equipo.
 *
 * Pasando `id_torneo` devuelve la nómina de ESE torneo (lo correcto al armar
 * una planilla: evita ofrecer jugadores de otro torneo). Sin `id_torneo`
 * mantiene el comportamiento anterior.
 *
 * El backend garantiza que todas las filas son de un único plantel, así que
 * tomar `data[0].id_plantel` es seguro.
 *
 * @param id_equipo - ID del equipo cuyo plantel se consulta (opcional).
 * @param id_torneo - Torneo para el que se quiere la nómina (opcional).
 * @returns Objeto con integrantes, ID del plantel, estado de carga, error,
 *          indicador de existencia del plantel y función de recarga.
 */
export function usePlantelActivo(id_equipo?: number, id_torneo?: number) {
  const [integrantes, setIntegrantes] = useState<PlantelActivoIntegrante[]>([]);
  const [id_plantel, setIdPlantel] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Si no hay equipo, reseteamos para evitar que queden datos del equipo anterior
    if (!id_equipo) {
        setIntegrantes([]);
        setIdPlantel(null);
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getPlantelActivoPorEquipo(id_equipo, id_torneo);

      if (data && data.length > 0) {
        setIdPlantel(data[0].id_plantel);

        // Filtramos personas reales
        const personasReales = data.filter(i => i.id_persona !== null && i.id_plantel_integrante !== null);
        setIntegrantes(personasReales as any);
      } else {
        setIdPlantel(null);
        setIntegrantes([]);
      }
    } catch (e) {
      setError("Error al cargar los datos del plantel");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id_equipo, id_torneo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    integrantes,
    id_plantel,
    loading,
    error,
    hasPlantel: id_plantel !== null,
    refetch: fetchData,
  };
}
