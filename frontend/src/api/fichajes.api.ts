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
 * la vez).
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
 * Filtra: tienen el rol habilitante activo y no están fichadas con ese rol en ningún club.
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
