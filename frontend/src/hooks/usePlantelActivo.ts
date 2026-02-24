import { useEffect, useState, useCallback } from "react"
import { getPlantelActivoPorEquipo } from "../api/vistas/plantel.api"
import type { PlantelActivoIntegrante } from "../types/vistas"

export function usePlantelActivo(id_equipo?: number) {
  // Aseguramos que el estado siempre sepa que maneja este tipo de array
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
      const data = await getPlantelActivoPorEquipo(id_equipo);

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
  }, [id_equipo]);

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