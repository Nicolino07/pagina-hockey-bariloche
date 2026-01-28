export interface Torneo {
  id_torneo: number
  nombre: string
  categoria: string
  genero: "FEMENINO" | "MASCULINO" | "MIXTO"
  fecha_inicio: string
  fecha_fin: string | null
  activo: boolean
  creado_en: string
  actualizado_en: string | null
  creado_por: string
  actualizado_por: string | null
}
