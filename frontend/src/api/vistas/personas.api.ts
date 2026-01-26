import axiosAdmin from "../axiosAdmin"
import type { PersonaConRol } from "../../types/vistas"
import type { TipoRolPersona } from "../../types/enums"

export async function getPersonasConRol(
  rol: TipoRolPersona
): Promise<PersonaConRol[]> {
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
