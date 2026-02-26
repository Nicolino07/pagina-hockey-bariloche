// frontend/src/api/vistas.api.ts
import AxiosPublic from '../axiosPublic'
import type { PlantelActivoIntegrante } from '../../types/vistas'

// Modifica vistas.api.ts para debug EXTREMO
export async function getPlantelActivoPorEquipo(idEquipo: number): Promise<PlantelActivoIntegrante[]> {
  console.log(`🔍 [1/5] INICIO: Llamando API con ID ${idEquipo}`)
  
  try {
    console.log(`🔍 [2/5] Haciendo request a: /vistas/plantel-activo/${idEquipo}`)
    
    const response = await AxiosPublic.get(`vistas/plantel-activo/${idEquipo}`)
    
    console.log(`✅ [3/5] RESPONSE RECIBIDA:`, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      dataType: typeof response.data,
      dataIsArray: Array.isArray(response.data),
      dataLength: response.data?.length || 0,
      dataFirst3: response.data?.slice(0, 3) || 'no data'
    })
    
    // Asegúrate que es un array
    const result = Array.isArray(response.data) ? response.data : []
    
    console.log(`✅ [4/5] RESULTADO FINAL:`, {
      length: result.length,
      data: result
    })
    
    console.log(`🏁 [5/5] RETORNANDO: ${result.length} registros`)
    
    return result
    
  } catch (error: any) {
    console.error(`💥 ERROR COMPLETO:`, {
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      responseData: error.response?.data
    })
    return []
  }
}