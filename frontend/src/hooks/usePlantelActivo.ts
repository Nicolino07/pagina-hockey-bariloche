import { useEffect, useState, useCallback } from "react"
import { getPlantelActivoPorEquipo } from "../api/vistas/plantel.api"
import type { PlantelActivoIntegrante } from "../types/vistas"

export function usePlantelActivo(id_equipo?: number) {
  const [integrantes, setIntegrantes] = useState<PlantelActivoIntegrante[]>([]);
  const [id_plantel, setIdPlantel] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id_equipo) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getPlantelActivoPorEquipo(id_equipo);

      if (data && data.length > 0) {
        // 1. Siempre capturamos el ID del plantel del primer registro
        setIdPlantel(data[0].id_plantel);

        // 2. Filtramos: solo guardamos como 'integrantes' a los que tienen persona real
        // Esto evita que una fila con id_persona=null rompa tu tabla o UI
        const personasReales = data.filter(i => i.id_persona !== null && i.id_persona !== undefined);
        setIntegrantes(personasReales);
      } else {
        // Si data es [], realmente no existe el plantel
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
    integrantes, // Solo contiene personas reales (o array vacío)
    id_plantel,  // Tendrá el ID aunque no haya personas (si el plantel existe)
    loading,
    error,
    hasPlantel: id_plantel !== null,
    refetch: fetchData,
  };
}