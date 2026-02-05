import axiosAdmin from "../axiosAdmin"
import type { PersonaRolVista } from "../../types/vistas"
import type { TipoRolPersona } from "../../constants/enums"

export async function getPersonasConRol(
  rol: TipoRolPersona
): Promise<PersonaRolVista[]> {
  const response = await axiosAdmin.get(
    "/vistas/personas-con-roles",
    {
      params: {
        rol,           // 👈 coincide con el backend
        solo_activos: true,
      },
    }
  )

  return Array.isArray(response.data) ? response.data : []
}
