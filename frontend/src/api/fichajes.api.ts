import api from "./axiosAdmin"


/**
 * Crea un nuevo fichaje vinculando una persona con un club y un rol.
 */
export const crearFichaje = async (data: {
  id_persona: number;
  id_club: number;
  rol: string;
  fecha_inicio?: string;
  creado_por?: string;
}) => {
  const response = await api.post(`/fichajes`, data);
  return response.data;
};


/**
 * Obtiene todos los fichajes de un club específico.
 * @param solo_activos Si es true, solo trae los que no tienen fecha_fin.
 * @param filtroTorneo Si se pasan `id_torneo` e `id_equipo`, el backend
 * excluye a quien ya esté anotado en el plantel de OTRO equipo del mismo
 * club para ese torneo (no puede jugar para dos equipos del mismo club a
 * la vez). El cuerpo técnico no se excluye: puede repetirse.
 */
export const getFichajesPorClub = async (
  id_club: number,
  solo_activos = true,
  filtroTorneo?: { id_torneo: number; id_equipo: number },
) => {
  const response = await api.get(`/fichajes/club/${id_club}`, {
    params: {
      solo_activos,
      id_torneo: filtroTorneo?.id_torneo,
      id_equipo: filtroTorneo?.id_equipo,
    },
  });
  return response.data;
};


export const getFichajesActivosPorClubYRol = async (
  id_club: number,
  rol: string
): Promise<any[]> => {
  const response = await api.get(
    `/fichajes/club/${id_club}/rol/${rol}/activos`
  )
  return response.data
}


/**
 * Devuelve personas disponibles para fichar en un club con un rol dado.
 * Filtra: tienen el rol habilitante activo y no están ya fichadas con ese rol
 * en ningún club (JUGADOR, DELEGADO) o en este club (cuerpo técnico, que puede
 * estar fichado en varios clubes a la vez).
 */
export const getPersonasDisponiblesParaFichar = async (
  id_club: number,
  rol: string
): Promise<any[]> => {
  const response = await api.get(`/fichajes/disponibles`, {
    params: { id_club, rol },
  })
  return response.data
}


/**
 * Da de baja un fichaje existente (borrado lógico).
 */
export const darBajaFichaje = async (
  id_fichaje_rol: number,
  data: {
    fecha_fin: string;
    actualizado_por: string;
  }
) => {
  const response = await api.patch(`/fichajes/${id_fichaje_rol}/baja`,
    data
  );
  return response.data;
};


/** Un plantel del que la persona sale por efecto cascada de la baja general. */
export interface PlantelImpactadoBaja {
  id_plantel_integrante: number;
  id_plantel: number;
  plantel_nombre: string;
  id_equipo: number;
  equipo_nombre: string;
  equipo_categoria: string | null;
  equipo_division: string | null;
  equipo_genero: string | null;
  rol_en_plantel: string;
  numero_camiseta: number | null;
  id_torneo: number | null;
  torneo_nombre: string | null;
  fecha_alta: string;
  plantel_cerrado: boolean;
}

/** Un rol vigente en el club que la baja general va a cerrar. */
export interface RolImpactadoBaja {
  id_fichaje_rol: number;
  rol: string;
  fecha_inicio: string;
  /** Planteles abiertos, de los que la persona efectivamente sale. */
  planteles: PlantelImpactadoBaja[];
  /** Planteles ya cerrados: la baja no los toca, quedan como historial. */
  planteles_historial: PlantelImpactadoBaja[];
}

/** Impacto completo de la baja general, para mostrar antes de confirmar. */
export interface BajaClubPreview {
  id_persona: number;
  persona_nombre: string;
  persona_apellido: string;
  persona_documento: number;
  id_club: number;
  club_nombre: string;
  roles: RolImpactadoBaja[];
  total_planteles: number;
  total_historial: number;
}

/**
 * Consulta, sin modificar nada, qué roles y qué planteles se verían afectados
 * por la baja general de una persona en un club.
 */
export const getPreviewBajaClub = async (
  id_club: number,
  id_persona: number,
): Promise<BajaClubPreview> => {
  const response = await api.get(`/fichajes/club/${id_club}/persona/${id_persona}/baja/preview`);
  return response.data;
};

/**
 * Baja general: cierra todos los roles vigentes de la persona en el club y la
 * saca de todos los planteles que dependían de ellos.
 */
export const darBajaDelClub = async (
  id_club: number,
  id_persona: number,
  data: {
    fecha_fin: string;
    actualizado_por?: string;
  },
) => {
  const response = await api.patch(`/fichajes/club/${id_club}/persona/${id_persona}/baja`, data);
  return response.data;
};
