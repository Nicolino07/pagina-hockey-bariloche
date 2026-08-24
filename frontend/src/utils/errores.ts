/**
 * Utilidades para convertir errores de la API en mensajes legibles.
 *
 * El backend responde el motivo en `detail`, pero ese campo no siempre es un
 * string: ante un error de validación (422) FastAPI devuelve una lista de
 * objetos. Mostrarla directo en un alert imprime "[object Object]", que no le
 * dice nada al usuario.
 */

/** Un ítem de la lista que FastAPI devuelve en los errores 422. */
interface ErrorValidacion {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

/** Nombres técnicos de los campos traducidos a como se ven en el formulario. */
const NOMBRES_CAMPOS: Record<string, string> = {
  horario: "Horario",
  fecha: "Fecha",
  id_torneo: "Torneo",
  id_inscripcion_local: "Equipo local",
  id_inscripcion_visitante: "Equipo visitante",
  id_arbitro1: "Árbitro 1",
  id_arbitro2: "Árbitro 2",
  id_capitan_local: "Capitán local",
  id_capitan_visitante: "Capitán visitante",
  numero_camiseta: "Número de camiseta",
  numero_fecha: "Número de fecha",
  minuto: "Minuto",
  cuarto: "Cuarto",
  referencia_gol: "Tipo de gol",
  tipo: "Tipo de tarjeta",
  goles_local_manual: "Goles del local",
  goles_visitante_manual: "Goles del visitante",
  ubicacion: "Ubicación",
  observaciones: "Observaciones",
};

/**
 * Arma una línea legible por cada error de validación de Pydantic.
 * Ej: `{loc: ["body", "partido", "horario"], msg: "invalid time format"}`
 * se convierte en `• Horario: invalid time format`.
 */
function formatearErrorValidacion(err: ErrorValidacion): string {
  const loc = (err.loc ?? []).filter(
    (parte) => parte !== "body" && typeof parte === "string"
  ) as string[];
  const campo = loc.length ? loc[loc.length - 1] : "";
  const etiqueta = NOMBRES_CAMPOS[campo] ?? campo;
  const msg = err.msg ?? "valor inválido";
  return etiqueta ? `• ${etiqueta}: ${msg}` : `• ${msg}`;
}

/**
 * Extrae un mensaje de error mostrable a partir de un error de axios.
 *
 * @param error - Error capturado en el catch (normalmente un AxiosError).
 * @param fallback - Mensaje a usar si la respuesta no trae nada aprovechable.
 * @returns Un string listo para mostrar en un alert o cartel de error.
 */
export function mensajeDeError(error: unknown, fallback: string): string {
  const respuesta = (error as { response?: { status?: number; data?: unknown } })?.response;

  // Sin respuesta: el request nunca llegó (backend caído o sin conexión).
  if (!respuesta) {
    return "No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.";
  }

  if (respuesta.status === 401) {
    return "Tu sesión expiró. Iniciá sesión de nuevo; los datos cargados no se guardaron.";
  }
  if (respuesta.status === 403) {
    return "No tenés permisos para realizar esta acción.";
  }

  const detail = (respuesta.data as { detail?: unknown })?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  // 422 de FastAPI: lista de errores de validación campo por campo.
  if (Array.isArray(detail) && detail.length) {
    const lineas = (detail as ErrorValidacion[]).map(formatearErrorValidacion);
    return `Hay datos incompletos o inválidos en la planilla:\n\n${lineas.join("\n")}`;
  }

  if (detail && typeof detail === "object") {
    const msg = (detail as { msg?: unknown }).msg;
    if (typeof msg === "string") return msg;
  }

  return fallback;
}

/**
 * Indica si el error corresponde a un jugador suspendido, caso en el que la
 * planilla puede reenviarse con `forzar = true`.
 */
export function esErrorDeSuspension(mensaje: string): boolean {
  return mensaje.toLowerCase().includes("suspendid");
}
