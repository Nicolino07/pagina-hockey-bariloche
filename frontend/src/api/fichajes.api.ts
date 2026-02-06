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

/**
 * Obtiene todos los fichajes de un club específico.
 * @param solo_activos Si es true, solo trae los que no tienen fecha_fin.
 */
export const getFichajesByClub = async (id_club: number, solo_activos = true) => {
  const response = await api.get(`/fichajes/club/${id_club}`, {
    params: { solo_activos },
  });
  return response.data;
};