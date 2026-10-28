import type { Torneo } from "../types/torneo"
import type { Temporada } from "../types/temporada"

export const ORDEN_CATEGORIA: Record<string, number> = {
  MAYORES: 0, SUB_19: 1, SUB_16: 2, SUB_14: 3, SUB_12: 4,
}

export const CATEGORIA_LABEL: Record<string, string> = {
  MAYORES: "Mayores", SUB_19: "Sub 19", SUB_16: "Sub 16", SUB_14: "Sub 14", SUB_12: "Sub 12",
}

export const GENERO_ICON: Record<string, string> = {
  MASCULINO: "♂", FEMENINO: "♀", MIXTO: "⚥",
}

export const GENERO_LABEL: Record<string, string> = {
  MASCULINO: "Masculino", FEMENINO: "Femenino", MIXTO: "Mixto",
}

/** Femenino primero, después masculino, después mixto. */
export const ORDEN_GENERO: Record<string, number> = {
  FEMENINO: 0, MASCULINO: 1, MIXTO: 2,
}

interface ConCategoria {
  categoria: string
  genero: string
  division?: string | null
}

/**
 * Clave de agrupación de una liga: categoría + género + división.
 *
 * No alcanza con la categoría: Mayores Femenino A y Mayores Femenino B son
 * ligas distintas, con tablas y temporadas distintas. Es la misma tupla que
 * identifica a una `temporada`.
 */
export function claveCategoria(x: ConCategoria): string {
  return `${x.categoria}|${x.genero}|${x.division ?? ""}`
}

export function etiquetaCategoria(x: ConCategoria): string {
  const cat = CATEGORIA_LABEL[x.categoria] ?? x.categoria
  const div = x.division ? ` ${x.division}` : ""
  return `${cat}${div} ${GENERO_LABEL[x.genero] ?? x.genero}`
}

export interface GrupoCategoria {
  clave: string
  etiqueta: string
  categoria: string
  genero: string
  division?: string | null
  /** Torneos en curso: son los que tienen pestaña propia. */
  torneos: Torneo[]
  /** Torneos ya finalizados de la liga, para la pestaña de históricos. */
  historicos: Torneo[]
  /**
   * Playoffs que no se listan acá porque se abren desde otro lado: el de un
   * torneo, desde ese torneo; el anual, desde la tabla anual.
   */
  playoffsOcultos: Torneo[]
  temporada: Temporada | null
}

/**
 * Un playoff que se abre desde otro lado y por eso no va en la navegación
 * por categoría.
 *
 * Son dos casos: el playoff de un torneo, que se abre desde la ficha de ese
 * torneo, y el playoff del campeón del año, que se abre desde su tabla anual.
 *
 * Un playoff suelto —sin torneo base y sin ser el anual— **sí** se lista: no
 * hay ninguna otra pantalla desde donde llegar a él, y esconderlo lo dejaría
 * inalcanzable.
 */
function esPlayoffQueViveEnOtroLado(t: Torneo, idsFinalAnual: Set<number>): boolean {
  if (t.tipo !== "PLAYOFF") return false
  return t.torneo_base_id != null || idsFinalAnual.has(t.id_torneo)
}

/**
 * Agrupa torneos por liga y le cuelga a cada grupo su temporada, si existe.
 *
 * Recibe activos y finalizados juntos y los separa: los activos van a las
 * pestañas y los finalizados a la de históricos. Una liga que ya terminó
 * aparece igual, con sus históricos y su tabla anual.
 *
 * Los grupos se arman desde los TORNEOS y no desde las temporadas: los torneos
 * que todavía no fueron asignados a ninguna temporada tienen que seguir
 * apareciendo igual.
 */
export function agruparPorCategoria(
  torneos: Torneo[],
  temporadas: Temporada[] = [],
): GrupoCategoria[] {
  const porClave = new Map<string, GrupoCategoria>()

  // El rol no viaja en el torneo, sí en la temporada: de ahí salen los ids de
  // los playoffs anuales.
  const idsFinalAnual = new Set(
    temporadas.flatMap(tp =>
      tp.torneos.filter(t => t.rol_en_temporada === "FINAL_ANUAL").map(t => t.id_torneo),
    ),
  )

  for (const t of torneos) {
    const clave = claveCategoria(t)
    if (!porClave.has(clave)) {
      porClave.set(clave, {
        clave,
        etiqueta: etiquetaCategoria(t),
        categoria: t.categoria,
        genero: t.genero,
        division: t.division,
        torneos: [],
        historicos: [],
        playoffsOcultos: [],
        temporada: null,
      })
    }
    const grupo = porClave.get(clave)!
    if (esPlayoffQueViveEnOtroLado(t, idsFinalAnual)) grupo.playoffsOcultos.push(t)
    else if (t.activo) grupo.torneos.push(t)
    else grupo.historicos.push(t)
  }

  for (const grupo of porClave.values()) {
    grupo.temporada = temporadas.find(tp => claveCategoria(tp) === grupo.clave) ?? null
    grupo.torneos.sort((a, b) => (a.fecha_inicio ?? "").localeCompare(b.fecha_inicio ?? ""))
    // Los históricos, del más reciente al más viejo.
    grupo.historicos.sort((a, b) => (b.fecha_inicio ?? "").localeCompare(a.fecha_inicio ?? ""))
  }

  // Una liga cuyos únicos torneos eran playoffs de otro torneo no es una liga:
  // no se la lista, se llega a ella desde el torneo que la originó.
  const grupos = [...porClave.values()].filter(
    g => g.torneos.length > 0 || g.historicos.length > 0,
  )

  // Mayores → Sub 19 → … ; dentro de cada una, femenino antes que masculino;
  // y dentro de cada género, por división (las que no tienen van primero).
  return grupos.sort((a, b) => {
    const porCategoria =
      (ORDEN_CATEGORIA[a.categoria] ?? 99) - (ORDEN_CATEGORIA[b.categoria] ?? 99)
    if (porCategoria !== 0) return porCategoria

    const porGenero = (ORDEN_GENERO[a.genero] ?? 99) - (ORDEN_GENERO[b.genero] ?? 99)
    if (porGenero !== 0) return porGenero

    return (a.division ?? "").localeCompare(b.division ?? "")
  })
}
