// src/types/plantelUI.ts

import type { PlantelIntegrante } from "./plantelIntegrante"

export type PlantelPorRol = {
  jugadores: PlantelIntegrante[]
  entrenadores: PlantelIntegrante[]
  cuerpoTecnico: PlantelIntegrante[]
}

