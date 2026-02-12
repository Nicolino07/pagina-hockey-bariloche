// frontend/src/types/vistas.ts
import type { Key, ReactNode } from "react"
import type { TipoGenero, TipoRolPersona } from "../constants/enums"



export interface PlantelActivoIntegrante {
  id_plantel: number;
  id_equipo: number;
  nombre_plantel: string;
  temporada: string;
  plantel_activo: boolean;

  // Estos campos son opcionales porque el plantel puede estar vacío
  id_persona?: number | null;
  nombre_persona?: string | null;
  apellido_persona?: string | null;
  documento?: number | null;
  rol_en_plantel?: string | null;
  numero_camiseta?: number | null;
  id_plantel_integrante?: number | null;
  rol_en_palntel?: string | null;
  fecha_alta?: string | null; 
  fecha_baja?: string | null;
}


// lista de personas con roles completa
export interface PersonasRolesVista {
  rol: ReactNode
  id_persona_rol: Key | null | undefined
  id_persona: number
  nombre: string
  apellido: string
  id_rol: number
  rol_codigo: TipoRolPersona
  genero: TipoGenero   // 👈 esta línea
  nombre_club?: string | null
  fecha_desde?: string | null
  fecha_hasta?: string | null
}

// Ver una persona con sus roles asociados utiliza la vista
export interface PersonaConRoles {
  id_persona: number
  nombre: string
  apellido: string
  roles: PersonasRolesVista[]
}


export interface PersonasArbitro {

  id_persona_rol: number
  nombre: string
  apellido: string
  documento?: number | null
  rol: TipoRolPersona

}


export interface FilaPosiciones {
  id_equipo: number;
  equipo: string; // Antes era nombre_equipo
  partidos_jugados: number; // Antes era pj
  ganados: number; // Antes era pg
  empatados: number; // Antes era pe
  perdidos: number; // Antes era pp
  goles_a_favor: number; // Antes era gf
  goles_en_contra: number; // Antes era gc
  diferencia_gol: number; // Antes era dif
  puntos: number;
}

export interface TarjetaAcumulada {

  id_torneo: number;
  torneo: string;
  id_persona: number;
  nombre_persona: string;
  apellido_persona: string;
  id_equipo: number;
  equipo: string;
  total_tarjetas: number;
  total_verdes: number;
  total_amarillas: number;
  total_rojas: number;

}

export interface GoleadorTorneo {
  id_persona: number;
  nombre: string;
  apellido: string;
  nombre_equipo: string;
  goles_en_torneo: number;
  goles_netos_en_torneo: number;
  goles_totales_carrera: number;
  ranking_en_torneo: number;
}