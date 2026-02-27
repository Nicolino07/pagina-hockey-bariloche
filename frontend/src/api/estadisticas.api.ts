import axiosPublic from './axiosPublic';

export const obtenerStatsGlobales = async (filtros = {}) => {
  const { data } = await axiosPublic.get('/stats/global', { params: filtros });
  return data;
};