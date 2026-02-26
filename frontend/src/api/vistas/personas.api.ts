import axiosAdmin from "../axiosAdmin"
import type { PersonasRolesVista, PersonasArbitro } from "../../types/vistas"
import type { TipoRolPersona } from "../../constants/enums"

export async function getPersonasConRol(
  rol: TipoRolPersona
): Promise<PersonasRolesVista[]> {
  const response = await axiosAdmin.get(
    "vistas/personas-con-roles",
    {
      params: {
        rol,           // 👈 coincide con el backend
        solo_activos: true,
      },
    }
  )

  return Array.isArray(response.data) ? response.data : []
}

export async function getPersonasArbitro (
 ): Promise<PersonasArbitro[]>{
    const response = await axiosAdmin.get(
        "vistas/persona-arbitro",
      )
    return response.data;
 }
  
