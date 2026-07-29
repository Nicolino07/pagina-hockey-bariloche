import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { listarInscripcionesTorneo } from "../../../api/torneos.api"
import {
  listarFixturePorTorneoAdmin,
  programarPartido,
  editarPartidoFixture,
  eliminarPartidoFixture,
  previsualizarFixture,
  generarFixture,
  eliminarFixtureTorneo,
  previsualizarPlayoff,
  generarPlayoff,
  listarRondasPlayoff,
  crearRondaPlayoff,
} from "../../../api/fixture.api"
import type { Torneo } from "../../../types/torneo"
import type { InscripcionTorneoDetalle } from "../../../types/inscripcion"
import type {
  EstadoPartido,
  FixturePartido,
  FixturePartidoCreate,
  FixturePartidoUpdate,
  FixturePreviewResponse,
  TipoFixture,
  FixtureDescansoPreview,
  PlayoffPreviewResponse,
  TipoFormatoPlayoff,
  TipoAsignacion,
  TipoRondaInicial,
  DueloManual,
  PlayoffRonda,
} from "../../../types/fixture"
import Button from "../../../components/ui/button/Button"
import { exportarFixturePDF } from "./exportarFixturePDF"
import { generarPlanillaPDF, generarPlanillaCompletaPDF } from "../../../services/PlanillaVacia.service"
import { marcarSuspendidos } from "../../../utils/suspensiones"
import { getPlantelActivoPorEquipo } from "../../../api/vistas/plantel.api"
import { obtenerDetallePartido, eliminarPartido, otorgarPuntosPartido } from "../../../api/partidos.api"
import OtorgarPuntosModal from "../../../components/admin/OtorgarPuntosModal"
import styles from "./FixturePanel.module.css"

/** Valores iniciales del formulario de partido. */
const FORM_VACIO: FixturePartidoCreate = {
  id_torneo: 0,
  id_equipo_local: 0,
  id_equipo_visitante: 0,
  fecha_programada: "",
  horario: "",
  ubicacion: "",
  numero_fecha: undefined,
  id_fixture_playoff_ronda: null,
}

/** Etiquetas legibles para cada estado de partido. */
const ESTADOS_LABELS: Record<EstadoPartido, string> = {
  BORRADOR: "Borrador",
  PENDIENTE: "Pendiente",
  TERMINADO: "Jugado",
  SUSPENDIDO: "Suspendido",
  ANULADO: "Anulado",
  REPROGRAMADO: "Reprogramado",
}

/** Clases CSS de badge para cada estado de partido. */
const ESTADOS_BADGE: Record<EstadoPartido, string> = {
  BORRADOR: styles.badgeBorrador,
  PENDIENTE: styles.badgePendiente,
  TERMINADO: styles.badgeTerminado,
  SUSPENDIDO: styles.badgeSuspendido,
  ANULADO: styles.badgeAnulado,
  REPROGRAMADO: styles.badgeReprogramado,
}

interface FixturePanelProps {
  /** Torneo cuyo fixture se administra. El id se toma de acá, no de un selector. */
  torneo: Torneo
}

/**
 * Panel de administración del fixture de un torneo.
 * Permite programar partidos individuales y generar automáticamente
 * fixtures de liga (round-robin) o brackets de playoff/copa.
 * La vista se adapta según el tipo de torneo recibido por prop.
 */
export default function FixturePanel({ torneo }: FixturePanelProps) {
  const navigate = useNavigate()
  const torneoId = torneo.id_torneo
  const [inscripciones, setInscripciones] = useState<InscripcionTorneoDetalle[]>([])
  const [partidos, setPartidos] = useState<FixturePartido[]>([])
  const [loadingPartidos, setLoadingPartidos] = useState(false)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarGenerador, setMostrarGenerador] = useState(false)
  const [editando, setEditando] = useState<FixturePartido | null>(null)
  const [form, setForm] = useState<FixturePartidoCreate>(FORM_VACIO)
  const [estadoEdicion, setEstadoEdicion] = useState<EstadoPartido>("BORRADOR")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  // Generación automática (liga)
  const [tipoFixture, setTipoFixture] = useState<TipoFixture>("simple")
  const [preview, setPreview] = useState<FixturePreviewResponse | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [errorGenerar, setErrorGenerar] = useState<string | null>(null)

  // Generación playoff
  const [formatoPlayoff, setFormatoPlayoff] = useState<TipoFormatoPlayoff>("ida")
  const [asignacionPlayoff, setAsignacionPlayoff] = useState<TipoAsignacion>("automatico")
  const [rondaInicialPlayoff, setRondaInicialPlayoff] = useState<TipoRondaInicial | "">("")
  const [tercerPuesto, setTercerPuesto] = useState(false)
  const [duelos, setDuelos] = useState<DueloManual[]>([{ id_equipo_local: 0, id_equipo_visitante: 0 }])
  const [previewPlayoff, setPreviewPlayoff] = useState<PlayoffPreviewResponse | null>(null)
  const [loadingPreviewPlayoff, setLoadingPreviewPlayoff] = useState(false)
  const [generandoPlayoff, setGenerandoPlayoff] = useState(false)
  const [rondasPlayoff, setRondasPlayoff] = useState<PlayoffRonda[]>([])
  const [nuevaRondaNombre, setNuevaRondaNombre] = useState("")
  const [nuevaRondaIdaVuelta, setNuevaRondaIdaVuelta] = useState(false)
  const [creandoRonda, setCreandoRonda] = useState(false)
  const [modalPDF, setModalPDF] = useState(false)
  const [generandoPDF, setGenerandoPDF] = useState(false)

  // Modal de detalle de partido jugado
  const [detalleModal, setDetalleModal] = useState(false)
  const [detallePartido, setDetallePartido] = useState<any | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  // Modal de otorgar puntos
  const [otorgarPuntosModal, setOtorgarPuntosModal] = useState(false)
  const [partidoOtorgarPuntos, setPartidoOtorgarPuntos] = useState<FixturePartido | null>(null)
  const [otorgandoPuntos, setOtorgandoPuntos] = useState(false)

  useEffect(() => {
    if (!torneoId) return
    setInscripciones([])
    setPartidos([])
    setPreview(null)
    setRondasPlayoff([])
    setLoadingPartidos(true)

    const esPlayoffTorneo = torneo.tipo === "PLAYOFF" || torneo.tipo === "COPA"

    // En playoff/copa con torneo base, los equipos se toman de los inscriptos
    // del torneo base (no de los del propio playoff).
    const idInscripciones = (esPlayoffTorneo && torneo.torneo_base_id)
      ? torneo.torneo_base_id
      : torneoId

    const promesas: Promise<any>[] = [
      listarInscripcionesTorneo(idInscripciones),
      listarFixturePorTorneoAdmin(torneoId),
      ...(esPlayoffTorneo ? [listarRondasPlayoff(torneoId)] : []),
    ]

    Promise.all(promesas)
      .then(([insc, fix, rondas]) => {
        setInscripciones(insc)
        setPartidos(fix)
        if (rondas) setRondasPlayoff(rondas)
        else setRondasPlayoff([])
      })
      .catch(console.error)
      .finally(() => setLoadingPartidos(false))
  }, [torneoId])

  // ── Handlers de UI ──────────────────────────────────────────────────────

  function abrirFormularioNuevo() {
    setEditando(null)
    setForm({ ...FORM_VACIO, id_torneo: torneoId! })
    setEstadoEdicion("BORRADOR")
    setError(null)
    setMostrarFormulario(true)
    setMostrarGenerador(false)
    setPreview(null)
  }

  function abrirGenerador() {
    setMostrarGenerador(true)
    setMostrarFormulario(false)
    setPreview(null)
    setError(null)
  }

  function cerrarGenerador() {
    setMostrarGenerador(false)
    setPreview(null)
    setPreviewPlayoff(null)
    setErrorGenerar(null)
  }

  function abrirFormularioEdicion(p: FixturePartido) {
    setEditando(p)
    setForm({
      id_torneo: p.id_torneo,
      id_equipo_local: p.id_equipo_local,
      id_equipo_visitante: p.id_equipo_visitante,
      fecha_programada: p.fecha_programada ?? "",
      horario: p.horario ?? "",
      ubicacion: p.ubicacion ?? "",
      numero_fecha: p.numero_fecha ?? undefined,
    })
    setEstadoEdicion(p.estado)
    setError(null)
    setMostrarFormulario(true)
    setPreview(null)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setEditando(null)
    setError(null)
  }

  // ── Acciones de API ──────────────────────────────────────────────────────

  /** Crea o edita un partido individual.
   * Solo envía el campo `estado` si el usuario lo modificó manualmente,
   * para respetar la transición automática BORRADOR ↔ PENDIENTE del backend. */
  async function handleGuardar() {
    if (!form.id_equipo_local || !form.id_equipo_visitante) {
      setError("Seleccioná ambos equipos.")
      return
    }
    if (form.id_equipo_local === form.id_equipo_visitante) {
      setError("El equipo local y visitante deben ser distintos.")
      return
    }

    setGuardando(true)
    setError(null)
    try {
      const horarioConSegundos = (h: string | null | undefined) =>
        h ? (h.length === 5 ? `${h}:00` : h) : null

      if (editando) {
        const update: FixturePartidoUpdate = {
          fecha_programada: form.fecha_programada || null,
          horario: horarioConSegundos(form.horario),
          ubicacion: form.ubicacion || null,
          numero_fecha: form.numero_fecha ?? null,
          // solo envía estado si el usuario lo cambió manualmente,
          // para que el backend pueda hacer la transición automática BORRADOR↔PENDIENTE
          ...(estadoEdicion !== editando.estado ? { estado: estadoEdicion } : {}),
        }
        await editarPartidoFixture(editando.id_fixture_partido, update)
      } else {
        await programarPartido({
          ...form,
          fecha_programada: form.fecha_programada || null,
          horario: horarioConSegundos(form.horario),
          ubicacion: form.ubicacion || null,
          estado: estadoEdicion,
        })
      }
      const nuevos = await listarFixturePorTorneoAdmin(torneoId!)
      setPartidos(nuevos)
      cerrarFormulario()
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Error al guardar el partido.")
    } finally {
      setGuardando(false)
    }
  }

  /** Crea una nueva ronda de playoff y la selecciona automáticamente en el form. */
  async function handleCrearRonda() {
    if (!torneoId || !nuevaRondaNombre.trim()) return
    setCreandoRonda(true)
    try {
      const nueva = await crearRondaPlayoff(torneoId, nuevaRondaNombre.trim(), nuevaRondaIdaVuelta)
      setRondasPlayoff(prev => [...prev, nueva])
      setForm(f => ({ ...f, id_fixture_playoff_ronda: nueva.id_fixture_playoff_ronda }))
      setNuevaRondaNombre("")
      setNuevaRondaIdaVuelta(false)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Error al crear la ronda.")
    } finally {
      setCreandoRonda(false)
    }
  }

  async function handleEliminar(p: FixturePartido) {
    const tieneDatos = !!p.id_partido_real
    const msg = tieneDatos
      ? `¿Eliminar este partido?\n\nYa tiene resultado cargado. Se eliminarán también los goles, tarjetas y jugadores asociados.\n\nEsta acción no se puede deshacer.`
      : `¿Eliminar este partido del fixture?`
    if (!confirm(msg)) return
    try {
      if (tieneDatos && p.id_partido_real) {
        await eliminarPartido(p.id_partido_real)
      }
      await eliminarPartidoFixture(p.id_fixture_partido).catch(() => {})
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "Error al eliminar.")
      return
    }
    setPartidos(prev => prev.filter(x => x.id_fixture_partido !== p.id_fixture_partido))
  }

  async function handlePrevisualizar() {
    if (!torneoId) return
    setLoadingPreview(true)
    setErrorGenerar(null)
    setPreview(null)
    try {
      const resultado = await previsualizarFixture(torneoId, tipoFixture)
      setPreview(resultado)
    } catch (e: any) {
      setErrorGenerar(e?.response?.data?.detail ?? "Error al previsualizar el fixture.")
    } finally {
      setLoadingPreview(false)
    }
  }

  async function handleGenerarFixture() {
    if (!torneoId || !preview) return
    setGenerando(true)
    setErrorGenerar(null)
    try {
      const nuevos = await generarFixture(torneoId, tipoFixture)
      setPartidos(nuevos)
      setPreview(null)
      setMostrarGenerador(false)
    } catch (e: any) {
      setErrorGenerar(e?.response?.data?.detail ?? "Error al generar el fixture.")
    } finally {
      setGenerando(false)
    }
  }

  async function handlePrevisualizarPlayoff() {
    if (!torneoId) return
    if (asignacionPlayoff === "manual") {
      const invalidos = duelos.some(d => !d.id_equipo_local || !d.id_equipo_visitante || d.id_equipo_local === d.id_equipo_visitante)
      if (invalidos || duelos.length === 0) {
        setErrorGenerar("Completá todos los duelos. Los equipos deben ser distintos.")
        return
      }
    }
    setLoadingPreviewPlayoff(true)
    setErrorGenerar(null)
    setPreviewPlayoff(null)
    try {
      const resultado = await previsualizarPlayoff(
        torneoId, formatoPlayoff, asignacionPlayoff,
        asignacionPlayoff === "manual" ? duelos : undefined,
        asignacionPlayoff === "automatico" && rondaInicialPlayoff ? rondaInicialPlayoff : null,
        tercerPuesto
      )
      setPreviewPlayoff(resultado)
    } catch (e: any) {
      setErrorGenerar(e?.response?.data?.detail ?? "Error al previsualizar el playoff.")
    } finally {
      setLoadingPreviewPlayoff(false)
    }
  }

  async function handleGenerarPlayoff() {
    if (!torneoId || !previewPlayoff) return
    setGenerandoPlayoff(true)
    setErrorGenerar(null)
    try {
      const nuevos = await generarPlayoff(
        torneoId, formatoPlayoff, asignacionPlayoff,
        asignacionPlayoff === "manual" ? duelos : undefined,
        asignacionPlayoff === "automatico" && rondaInicialPlayoff ? rondaInicialPlayoff : null,
        tercerPuesto
      )
      setPartidos(nuevos)
      setPreviewPlayoff(null)
      setMostrarGenerador(false)
    } catch (e: any) {
      setErrorGenerar(e?.response?.data?.detail ?? "Error al generar el playoff.")
    } finally {
      setGenerandoPlayoff(false)
    }
  }

  function agregarDuelo() {
    setDuelos(prev => [...prev, { id_equipo_local: 0, id_equipo_visitante: 0 }])
  }

  function quitarDuelo(idx: number) {
    setDuelos(prev => prev.filter((_, i) => i !== idx))
  }

  function actualizarDuelo(idx: number, campo: keyof DueloManual, valor: number) {
    setDuelos(prev => prev.map((d, i) => i === idx ? { ...d, [campo]: valor } : d))
  }

  /** Elimina todo el fixture del torneo. Solo borra partidos en estado no-TERMINADO. */
  async function handleEliminarFixtureCompleto() {
    if (!torneoId) return
    if (!confirm("¿Eliminar TODO el fixture de este torneo? Esta acción no se puede deshacer.")) return
    try {
      await eliminarFixtureTorneo(torneoId)
      setPartidos([])
      setPreview(null)
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? "Error al eliminar el fixture.")
    }
  }

  // ── Helpers para modal de detalle ───────────────────────────────────────

  function parseIncidencias(str: string) {
    if (!str) return []
    return str.split("; ").map(item => {
      const parts = item.split("|")
      return {
        jugador: parts[0] ?? "",
        minuto: parts[1] ?? "",
        cuarto: parts[2] ?? "",
        esAutogol: parts[3] === "true",
        tipoTarjeta: parts[4] ?? undefined,
      }
    })
  }

  function parsePlantilla(str: string) {
    if (!str) return []
    return str.split("; ").map(item => {
      const parts = item.split("|")
      return {
        nombreCompleto: `${parts[0]}, ${parts[1]}`,
        camiseta: (parts[2] === "" || parts[2] === "null") ? null : parts[2],
        rol: parts[3] || "JUGADOR",
        capitan: parts[4] === "true",
      }
    })
  }

  function agruparGoles(str: string) {
    const items = parseIncidencias(str)
    const map = new Map<string, { jugador: string; esAutogol: boolean; tiempos: { min: number; label: string }[] }>()
    items.forEach(g => {
      const key = `${g.jugador}|${g.esAutogol}`
      if (!map.has(key)) map.set(key, { jugador: g.jugador, esAutogol: g.esAutogol, tiempos: [] })
      map.get(key)!.tiempos.push({ min: Number(g.minuto), label: `${g.minuto}'(${g.cuarto}C)` })
    })
    return Array.from(map.values()).map(g => ({
      ...g,
      tiempos: g.tiempos.sort((a, b) => a.min - b.min).map(t => t.label),
    }))
  }

  function agruparTarjetas(str: string) {
    const items = parseIncidencias(str)
    const map = new Map<string, { jugador: string; tipoTarjeta?: string; tiempos: { min: number; label: string }[] }>()
    items.forEach(t => {
      const key = `${t.jugador}|${t.tipoTarjeta}`
      if (!map.has(key)) map.set(key, { jugador: t.jugador, tipoTarjeta: t.tipoTarjeta, tiempos: [] })
      map.get(key)!.tiempos.push({ min: Number(t.minuto), label: `${t.minuto}'(${t.cuarto}C)` })
    })
    return Array.from(map.values()).map(t => ({
      ...t,
      tiempos: t.tiempos.sort((a, b) => a.min - b.min).map(x => x.label),
    }))
  }

  function renderIconoTarjeta(tipo?: string) {
    switch (tipo) {
      case "VERDE":    return <span className={`${styles.cardIcon} ${styles.verde}`} />
      case "AMARILLA": return <span className={`${styles.cardIcon} ${styles.amarilla}`} />
      case "ROJA":     return <span className={`${styles.cardIcon} ${styles.roja}`} />
      default:         return null
    }
  }

  async function handleVerDetalle(p: FixturePartido) {
    if (!p.id_partido_real) return
    setCargandoDetalle(true)
    try {
      const detalle = await obtenerDetallePartido(p.id_partido_real)
      setDetallePartido(detalle)
      setDetalleModal(true)
    } catch {
      alert("No se pudo cargar el detalle del partido")
    } finally {
      setCargandoDetalle(false)
    }
  }

  function abrirOtorgarPuntosModal(p: FixturePartido) {
    setPartidoOtorgarPuntos(p)
    setOtorgarPuntosModal(true)
  }

  async function handleConfirmarOtorgarPuntos(golesLocal: number, golesVisitante: number) {
    if (!partidoOtorgarPuntos?.id_fixture_partido) return

    setOtorgandoPuntos(true)
    try {
      await otorgarPuntosPartido(partidoOtorgarPuntos.id_fixture_partido, golesLocal, golesVisitante)
      setOtorgarPuntosModal(false)
      setPartidoOtorgarPuntos(null)

      // Recargar partidos
      if (torneoId) {
        setLoadingPartidos(true)
        const fix = await listarFixturePorTorneoAdmin(torneoId)
        setPartidos(fix)
        setLoadingPartidos(false)
      }
    } catch (err: any) {
      alert(err.message || "Error al otorgar puntos")
    } finally {
      setOtorgandoPuntos(false)
    }
  }

  // ── Planilla PDF por partido ─────────────────────────────────────────────

  async function handlePlanillaPartido(p: FixturePartido) {
    setGenerandoPDF(true)
    try {
      if (p.estado === 'TERMINADO' && p.id_partido_real) {
        const detalle = await obtenerDetallePartido(p.id_partido_real)
        generarPlanillaCompletaPDF(detalle)
      } else {
        // Se pasa el torneo del partido: la planilla debe listar la nómina de
        // ese torneo, no la de cualquier otro que juegue el equipo.
        const obtenerDatosPlantel = async (idEquipo: number) => {
          const data = await getPlantelActivoPorEquipo(idEquipo, p.id_torneo)
          if (!data || data.length === 0) return { jugadores: [], cuerpoTecnico: [] }
          const conPersona = data.filter((i: any) => i.id_persona != null)
          const marcados = await marcarSuspendidos(conPersona)
          return {
            jugadores: marcados.filter((i: any) => i.rol_en_plantel === 'JUGADOR'),
            cuerpoTecnico: marcados.filter((i: any) => i.rol_en_plantel !== 'JUGADOR'),
          }
        }
        const [datosL, datosV] = await Promise.all([
          obtenerDatosPlantel(p.id_equipo_local),
          obtenerDatosPlantel(p.id_equipo_visitante),
        ])
        generarPlanillaPDF({
          torneo: torneoSeleccionado,
          local:     { nombre_equipo: p.nombre_equipo_local },
          visitante: { nombre_equipo: p.nombre_equipo_visitante },
          plantelLocal:           datosL.jugadores,
          plantelVisitante:       datosV.jugadores,
          cuerpoTecnicoLocal:     datosL.cuerpoTecnico,
          cuerpoTecnicoVisitante: datosV.cuerpoTecnico,
          fecha:        p.fecha_programada ?? undefined,
          numero_fecha: p.numero_fecha    ?? undefined,
          ubicacion:    p.ubicacion       ?? undefined,
          arbitro1:     p.nombre_arbitro1 ?? undefined,
          arbitro2:     p.nombre_arbitro2 ?? undefined,
        })
      }
    } catch {
      alert('Error al generar la planilla')
    } finally {
      setGenerandoPDF(false)
    }
  }

  // ── Datos derivados ──────────────────────────────────────────────────────

  const equiposPorId = Object.fromEntries(
    inscripciones.map(i => [i.id_equipo, i.nombre_equipo])
  )

  const torneoSeleccionado = torneo
  const esPlayoff = torneoSeleccionado.tipo === "PLAYOFF" || torneoSeleccionado.tipo === "COPA"

  // Agrupa partidos del preview por fecha para mostrarlos ordenados
  const fechasPreview = preview
    ? [...new Set(preview.partidos.map(p => p.numero_fecha))].sort((a, b) => a - b)
    : []

  const partidosPorFecha = (fecha: number) =>
    preview?.partidos.filter(p => p.numero_fecha === fecha) ?? []

  const partidosOrdenados = [...partidos].sort((a, b) => {
    const fa = a.numero_fecha ?? 99999
    const fb = b.numero_fecha ?? 99999
    return fa - fb
  })

  const fechasExistentes = [...new Set(partidosOrdenados.map(p => p.numero_fecha ?? 0))].sort((a, b) => a - b)

  return (
    <div className={styles.container}>
      {/* Barra de acciones del fixture (el torneo ya viene por prop) */}
      <div className={styles.selectorRow}>
        {!mostrarFormulario && !mostrarGenerador && !preview && (
          <>
            <Button onClick={abrirFormularioNuevo}>+ Programar partido</Button>
            <Button onClick={abrirGenerador}>⚡ Generar fixture</Button>
            {partidos.length > 0 && (
              <>
                <Button onClick={() => setModalPDF(true)}>Exportar PDF</Button>
                <button className={styles.btnEliminarFixture} onClick={handleEliminarFixtureCompleto}>
                  Eliminar fixture
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Panel de generación automática — solo visible al abrir */}
      {torneoId && mostrarGenerador && !preview && !previewPlayoff && (
        <div className={styles.generarPanel}>
          <div className={styles.generarPanelHeader}>
            <h3 className={styles.generarTitle}>
              {esPlayoff ? "Generar bracket de playoff" : "Generar fixture automático"}
            </h3>
            <button className={styles.btnCancelarPreview} onClick={cerrarGenerador}>Cancelar</button>
          </div>
          <p className={styles.generarSubtitle}>
            {esPlayoff
              ? "Eliminación directa con todos los equipos inscriptos. El número de equipos debe ser par."
              : `Round-robin con todos los equipos inscriptos.${inscripciones.length % 2 === 1 ? " Con número impar de equipos, uno descansa por fecha (al azar)." : ""}`
            }
          </p>
          {partidos.length > 0 && (
            <p className={styles.warningMsg}>
              ⚠️ Ya existe un fixture para este torneo. Si confirmás, los partidos pendientes serán eliminados.
              Los partidos ya jugados (TERMINADO) bloquean la generación.
            </p>
          )}

          <div className={styles.generarControles}>
            <div className={styles.tipoSelector}>
              <label className={styles.label}>{esPlayoff ? "Formato de partidos" : "Tipo de fixture"}</label>
              <div className={styles.radioGroup}>
                {esPlayoff ? (
                  <>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="formatoPlayoff" value="ida"
                        checked={formatoPlayoff === "ida"}
                        onChange={() => setFormatoPlayoff("ida")} />
                      Solo ida
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="formatoPlayoff" value="ida_y_vuelta"
                        checked={formatoPlayoff === "ida_y_vuelta"}
                        onChange={() => setFormatoPlayoff("ida_y_vuelta")} />
                      Ida y vuelta
                    </label>
                  </>
                ) : (
                  <>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="tipoFixture" value="simple"
                        checked={tipoFixture === "simple"}
                        onChange={() => { setTipoFixture("simple"); setPreview(null) }} />
                      Solo ida
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="tipoFixture" value="ida_y_vuelta"
                        checked={tipoFixture === "ida_y_vuelta"}
                        onChange={() => { setTipoFixture("ida_y_vuelta"); setPreview(null) }} />
                      Ida y vuelta (espejo)
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="tipoFixture" value="ida_y_vuelta_aleatorio"
                        checked={tipoFixture === "ida_y_vuelta_aleatorio"}
                        onChange={() => { setTipoFixture("ida_y_vuelta_aleatorio"); setPreview(null) }} />
                      Ida y vuelta (vuelta aleatoria)
                    </label>
                  </>
                )}
              </div>
            </div>

            {esPlayoff && (
              <div className={styles.tipoSelector}>
                <label className={styles.radioLabel}>
                  <input
                    type="checkbox"
                    checked={tercerPuesto}
                    onChange={() => { setTercerPuesto(v => !v); setPreviewPlayoff(null) }}
                  />
                  Agregar partido por el 3er puesto
                </label>
                <p className={styles.hint}>
                  Los perdedores de las semifinales juegan por el 3er y 4to puesto.
                  Solo aplica si el bracket tiene semifinal (4+ equipos).
                </p>
              </div>
            )}

            {esPlayoff && (
              <div className={styles.tipoSelector}>
                <label className={styles.label}>Asignación de duelos</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="asignacionPlayoff" value="automatico"
                      checked={asignacionPlayoff === "automatico"}
                      onChange={() => { setAsignacionPlayoff("automatico"); setPreviewPlayoff(null) }} />
                    Automático (por ranking/orden)
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="asignacionPlayoff" value="manual"
                      checked={asignacionPlayoff === "manual"}
                      onChange={() => { setAsignacionPlayoff("manual"); setPreviewPlayoff(null) }} />
                    Manual (elegir enfrentamientos)
                  </label>
                </div>

                {asignacionPlayoff === "automatico" && (
                  <div style={{ marginTop: 12 }}>
                    <label className={styles.label}>Ronda inicial</label>
                    <select
                      className={styles.select}
                      value={rondaInicialPlayoff}
                      onChange={e => { setRondaInicialPlayoff(e.target.value as TipoRondaInicial | ""); setPreviewPlayoff(null) }}
                    >
                      <option value="">Todos los inscriptos (automático)</option>
                      <option value="dieciseisavos">Dieciseisavos (32 equipos)</option>
                      <option value="octavos">Octavos (16 equipos)</option>
                      <option value="cuartos">Cuartos (8 equipos)</option>
                      <option value="semifinal">Semifinal (4 equipos)</option>
                      <option value="final">Final (2 equipos)</option>
                    </select>
                    <small className={styles.hint}>
                      {torneoSeleccionado?.torneo_base_id
                        ? "Clasifican los N mejores según la tabla del torneo base."
                        : "Se toman N equipos entre los inscriptos (sin torneo base, ej: ascenso/descenso)."}
                    </small>
                  </div>
                )}

                {asignacionPlayoff === "manual" && (
                  <div style={{ marginTop: 12 }}>
                    <label className={styles.label} style={{ marginBottom: 6 }}>
                      Primer ronda — enfrentamientos
                    </label>
                    {duelos.map((d, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", minWidth: 20 }}>{idx + 1}.</span>
                        <select
                          className={styles.select}
                          value={d.id_equipo_local || ""}
                          onChange={e => actualizarDuelo(idx, "id_equipo_local", Number(e.target.value))}
                          style={{ flex: 1 }}
                        >
                          <option value="">— Local —</option>
                          {inscripciones.map(i => (
                            <option key={i.id_equipo} value={i.id_equipo}>{i.nombre_equipo}</option>
                          ))}
                        </select>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>vs</span>
                        <select
                          className={styles.select}
                          value={d.id_equipo_visitante || ""}
                          onChange={e => actualizarDuelo(idx, "id_equipo_visitante", Number(e.target.value))}
                          style={{ flex: 1 }}
                        >
                          <option value="">— Visitante —</option>
                          {inscripciones
                            .filter(i => i.id_equipo !== d.id_equipo_local)
                            .map(i => (
                              <option key={i.id_equipo} value={i.id_equipo}>{i.nombre_equipo}</option>
                            ))}
                        </select>
                        {duelos.length > 1 && (
                          <button
                            type="button"
                            className={styles.btnEliminar}
                            onClick={() => quitarDuelo(idx)}
                            style={{ padding: "2px 8px" }}
                          >✕</button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className={styles.btnEditar}
                      onClick={agregarDuelo}
                      style={{ marginTop: 4 }}
                    >
                      + Agregar duelo
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className={styles.generarAcciones}>
              {esPlayoff ? (
                <Button onClick={handlePrevisualizarPlayoff} disabled={loadingPreviewPlayoff || inscripciones.length < 2}>
                  {loadingPreviewPlayoff ? "Calculando..." : "Previsualizar bracket"}
                </Button>
              ) : (
                <Button onClick={handlePrevisualizar} disabled={loadingPreview || inscripciones.length < 2}>
                  {loadingPreview ? "Calculando..." : "Previsualizar fixture"}
                </Button>
              )}
            </div>
          </div>

          {errorGenerar && <p className={styles.errorMsg}>{errorGenerar}</p>}
          {inscripciones.length < 2 && (
            <p className={styles.warningMsg}>Se necesitan al menos 2 equipos inscriptos.</p>
          )}
        </div>
      )}

      {/* Preview del fixture a generar */}
      {preview && (
        <div className={styles.previewPanel}>
          <div className={styles.previewHeader}>
            <div>
              <h3 className={styles.previewTitle}>
                Vista previa del fixture — {
                  preview.tipo === "simple" ? "Solo ida" :
                  preview.tipo === "ida_y_vuelta" ? "Ida y vuelta (espejo)" :
                  "Ida y vuelta (vuelta aleatoria)"
                }
              </h3>
              <p className={styles.previewStats}>
                {preview.total_partidos} partido{preview.total_partidos !== 1 ? "s" : ""} en {fechasPreview.length} fecha{fechasPreview.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className={styles.previewAcciones}>
              <Button onClick={handleGenerarFixture} disabled={generando}>
                {generando ? "Guardando..." : "Confirmar y guardar"}
              </Button>
              <button className={styles.btnCancelarPreview} onClick={() => setPreview(null)}>
                Volver a modificar
              </button>
            </div>
          </div>

          <div className={styles.previewFechas}>
            {fechasPreview.map(nf => {
              const ps = partidosPorFecha(nf)
              const rueda = ps[0]?.rueda ?? "ida"
              const descansa: FixtureDescansoPreview | undefined = preview.descansos.find(d => d.numero_fecha === nf)
              return (
                <div key={nf} className={styles.previewFechaBloque}>
                  <div className={styles.previewFechaHeader}>
                    <span className={styles.previewFechaNro}>Fecha {nf}</span>
                    {(preview.tipo === "ida_y_vuelta" || preview.tipo === "ida_y_vuelta_aleatorio") && (
                      <span className={`${styles.ruedaBadge} ${rueda === "vuelta" ? styles.ruedaVuelta : styles.ruedaIda}`}>
                        {rueda}
                      </span>
                    )}
                  </div>
                  <div className={styles.previewPartidos}>
                    {ps.map((p, idx) => (
                      <div key={idx} className={styles.previewPartidoRow}>
                        <span className={styles.previewEquipo}>{p.nombre_equipo_local}</span>
                        <span className={styles.previewVs}>vs</span>
                        <span className={styles.previewEquipo}>{p.nombre_equipo_visitante}</span>
                      </div>
                    ))}
                    {descansa && (
                      <div className={styles.previewDescansoRow}>
                        <span className={styles.previewDescansoIcono}>💤</span>
                        <span className={styles.previewDescansoNombre}>{descansa.nombre_equipo}</span>
                        <span className={styles.previewDescansoLabel}>descansa</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Preview del bracket de playoff */}
      {previewPlayoff && (
        <div className={styles.previewPanel}>
          <div className={styles.previewHeader}>
            <div>
              <h3 className={styles.previewTitle}>
                Vista previa del bracket — {previewPlayoff.formato === "ida" ? "Solo ida" : "Ida y vuelta"}
              </h3>
              <p className={styles.previewStats}>
                {previewPlayoff.total_partidos} partido{previewPlayoff.total_partidos !== 1 ? "s" : ""} en {previewPlayoff.total_rondas} ronda{previewPlayoff.total_rondas !== 1 ? "s" : ""}
              </p>
            </div>
            <div className={styles.previewAcciones}>
              <Button onClick={handleGenerarPlayoff} disabled={generandoPlayoff}>
                {generandoPlayoff ? "Guardando..." : "Confirmar y guardar"}
              </Button>
              <button className={styles.btnCancelarPreview} onClick={() => setPreviewPlayoff(null)}>
                Volver a modificar
              </button>
            </div>
          </div>

          <div className={styles.previewFechas}>
            {previewPlayoff.rondas.map(ronda => (
              <div key={ronda.orden} className={styles.previewFechaBloque}>
                <div className={styles.previewFechaHeader}>
                  <span className={styles.previewFechaNro}>{ronda.nombre}</span>
                  {ronda.ida_y_vuelta && (
                    <span className={`${styles.ruedaBadge} ${styles.ruedaIda}`}>ida y vuelta</span>
                  )}
                </div>
                <div className={styles.previewPartidos}>
                  {ronda.partidos.map((p, idx) => (
                    "bye" in p ? (
                      <div key={idx} className={styles.previewDescansoRow}>
                        <span className={styles.previewDescansoIcono}>⭐</span>
                        <span className={styles.previewDescansoNombre}>{p.bye}</span>
                        <span className={styles.previewDescansoLabel}>pasa directo</span>
                      </div>
                    ) : (
                      <div key={idx} className={styles.previewPartidoRow}>
                        <span className={styles.previewEquipo}>{p.local ?? p.placeholder_local}</span>
                        <span className={styles.previewVs}>vs</span>
                        <span className={styles.previewEquipo}>{p.visitante ?? p.placeholder_visitante}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario partido individual */}
      {mostrarFormulario && (
        <div className={styles.formCard} ref={formRef}>
          <h3 className={styles.formTitle}>
            {editando
              ? <>
                  Editar — {editando.nombre_equipo_local ?? equiposPorId[editando.id_equipo_local]} vs {editando.nombre_equipo_visitante ?? equiposPorId[editando.id_equipo_visitante]}
                  {editando.nombre_ronda_playoff && (
                    <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-muted)", marginLeft: 10 }}>
                      · {editando.nombre_ronda_playoff}
                    </span>
                  )}
                </>
              : "Programar partido"}
          </h3>

          <div className={styles.formGrid}>
            {!editando && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Estado</label>
                  <select
                    className={styles.select}
                    value={estadoEdicion}
                    onChange={e => setEstadoEdicion(e.target.value as EstadoPartido)}
                  >
                    <option value="BORRADOR">Borrador (sin fecha)</option>
                    <option value="PENDIENTE">Pendiente (con fecha)</option>
                    <option value="SUSPENDIDO">Suspendido</option>
                    <option value="REPROGRAMADO">Reprogramado</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Equipo local</label>
                  <select
                    className={styles.select}
                    value={form.id_equipo_local || ""}
                    onChange={e => setForm(f => ({ ...f, id_equipo_local: Number(e.target.value) }))}
                  >
                    <option value="">— Seleccioná —</option>
                    {inscripciones.map(i => (
                      <option key={i.id_equipo} value={i.id_equipo}>{i.nombre_equipo}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Equipo visitante</label>
                  <select
                    className={styles.select}
                    value={form.id_equipo_visitante || ""}
                    onChange={e => setForm(f => ({ ...f, id_equipo_visitante: Number(e.target.value) }))}
                  >
                    <option value="">— Seleccioná —</option>
                    {inscripciones
                      .filter(i => i.id_equipo !== form.id_equipo_local)
                      .map(i => (
                        <option key={i.id_equipo} value={i.id_equipo}>{i.nombre_equipo}</option>
                      ))}
                  </select>
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Fecha del partido</label>
              <input
                type="date"
                className={styles.input}
                value={form.fecha_programada ?? ""}
                onChange={e => setForm(f => ({ ...f, fecha_programada: e.target.value }))}
              />
            </div>

            {esPlayoff ? (
              <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                <label className={styles.label}>Ronda</label>
                {rondasPlayoff.length > 0 && (
                  <select
                    className={styles.select}
                    value={form.id_fixture_playoff_ronda ?? ""}
                    onChange={e => setForm(f => ({ ...f, id_fixture_playoff_ronda: e.target.value ? Number(e.target.value) : null }))}
                    style={{ marginBottom: 8 }}
                  >
                    <option value="">— Seleccioná ronda —</option>
                    {rondasPlayoff.map(r => (
                      <option key={r.id_fixture_playoff_ronda} value={r.id_fixture_playoff_ronda}>
                        {r.nombre}{r.ida_y_vuelta ? " (ida y vuelta)" : ""}
                      </option>
                    ))}
                  </select>
                )}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Nueva ronda (ej: Semifinal)"
                    value={nuevaRondaNombre}
                    onChange={e => setNuevaRondaNombre(e.target.value)}
                    style={{ flex: 1, minWidth: 160 }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                    <input
                      type="checkbox"
                      checked={nuevaRondaIdaVuelta}
                      onChange={e => setNuevaRondaIdaVuelta(e.target.checked)}
                    />
                    Ida y vuelta
                  </label>
                  <button
                    type="button"
                    className={styles.btnEditar}
                    onClick={handleCrearRonda}
                    disabled={creandoRonda || !nuevaRondaNombre.trim()}
                  >
                    {creandoRonda ? "Creando..." : "+ Crear ronda"}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.formGroup}>
                <label className={styles.label}>N° de fecha</label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="Ej: 1"
                  min={1}
                  value={form.numero_fecha ?? ""}
                  onChange={e => setForm(f => ({ ...f, numero_fecha: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Horario (opcional)</label>
              <input
                type="time"
                className={styles.input}
                value={form.horario ?? ""}
                onChange={e => setForm(f => ({ ...f, horario: e.target.value }))}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Ubicación (opcional)</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Ej: Cancha Municipal"
                value={form.ubicacion ?? ""}
                onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))}
              />
            </div>

            {editando && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Estado</label>
                <select
                  className={styles.select}
                  value={estadoEdicion}
                  onChange={e => setEstadoEdicion(e.target.value as EstadoPartido)}
                >
                  <option value="BORRADOR">Borrador (sin fecha)</option>
                  <option value="PENDIENTE">Pendiente (con fecha)</option>
                  <option value="SUSPENDIDO">Suspendido</option>
                  <option value="REPROGRAMADO">Reprogramado</option>
                  <option value="ANULADO">Anulado</option>
                  <option value="TERMINADO">Jugado</option>
                </select>
              </div>
            )}
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.formActions}>
            <Button onClick={handleGuardar} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
            <Button onClick={cerrarFormulario}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Lista de partidos existentes */}
      {torneoId && !preview && !previewPlayoff && (
        <section className={styles.lista}>
          {loadingPartidos ? (
            <p className={styles.infoMsg}>Cargando fixture...</p>
          ) : partidos.length === 0 ? (
            <p className={styles.infoMsg}>No hay partidos programados para este torneo.</p>
          ) : esPlayoff ? (
            // Agrupado por ronda de playoff
            [...new Set(partidosOrdenados.map(p => p.nombre_ronda_playoff ?? "Sin ronda"))].map(ronda => {
              const ps = partidosOrdenados.filter(p => (p.nombre_ronda_playoff ?? "Sin ronda") === ronda)
              return (
                <div key={ronda} className={styles.fechaBloque}>
                  <div className={styles.fechaBloqueHeader}>
                    <span className={styles.fechaNro}>{ronda}</span>
                    {ps[0]?.rueda && (
                      <span className={`${styles.ruedaBadge} ${styles.ruedaIda}`}>ida y vuelta</span>
                    )}
                  </div>
                  <div className={styles.tablaWrap}>
                    <table className={styles.tabla}>
                      <thead>
                        <tr>
                          <th>Local</th>
                          <th>Visitante</th>
                          <th>Resultado</th>
                          <th>Horario</th>
                          <th>Ubicación</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ps.map(p => (
                          <tr key={p.id_fixture_partido}>
                            <td>{p.nombre_equipo_local ?? p.placeholder_local ?? "—"}</td>
                            <td>{p.nombre_equipo_visitante ?? p.placeholder_visitante ?? "—"}</td>
                            <td>
                              {p.estado === "TERMINADO" && p.goles_local != null
                                ? <span className={styles.resScore}>{p.goles_local} - {p.goles_visitante}</span>
                                : "—"}
                            </td>
                            <td>{p.horario ? p.horario.slice(0, 5) : "—"}</td>
                            <td>{p.ubicacion ?? "—"}</td>
                            <td>
                              <span className={`${styles.badge} ${ESTADOS_BADGE[p.estado]}`}>
                                {ESTADOS_LABELS[p.estado]}
                              </span>
                            </td>
                            <td className={styles.acciones}>
                              <button className={styles.btnPDF} title={p.estado === 'TERMINADO' ? 'Planilla completa' : 'Planilla vacía'} disabled={generandoPDF} onClick={() => handlePlanillaPartido(p)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="9" y1="13" x2="15" y2="13"/>
                                <line x1="9" y1="17" x2="12" y2="17"/>
                              </svg>
                              <span>PDF</span>
                            </button>
                              {p.estado === "TERMINADO" ? (
                                <>
                                  {p.id_partido_real && (
                                    <button className={styles.btnDetalle} onClick={() => handleVerDetalle(p)} disabled={cargandoDetalle}>Detalle</button>
                                  )}
                                  {p.id_partido_real && (
                                    <button className={styles.btnEditar} onClick={() => navigate(`/admin/partidos/nueva-planilla?partido=${p.id_partido_real}`)}>Editar planilla</button>
                                  )}
                                  <button className={styles.btnEditar} onClick={() => abrirFormularioEdicion(p)}>Editar fixture</button>
                                </>
                              ) : (
                                <>
                                  {!p.placeholder_local && !p.placeholder_visitante && (
                                    <>
                                      <button className={styles.btnCargar} onClick={() => navigate(`/admin/partidos/nueva-planilla?fixture=${p.id_fixture_partido}`)}>Cargar resultado</button>
                                      <button className={styles.btnOtorgarPuntos} onClick={() => abrirOtorgarPuntosModal(p)}>Otorgar puntos</button>
                                    </>
                                  )}
                                  <button className={styles.btnEditar} onClick={() => abrirFormularioEdicion(p)}>Editar fixture</button>
                                </>
                              )}
                              <button className={styles.btnEliminar} onClick={() => handleEliminar(p)}>Eliminar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          ) : (
            fechasExistentes.map(nf => {
              const ps = partidosOrdenados.filter(p => (p.numero_fecha ?? 0) === nf)
              const rueda = ps[0]?.rueda ?? null
              const descansa = ps[0]?.nombre_equipo_descansa ?? null
              return (
                <div key={nf} className={styles.fechaBloque}>
                  <div className={styles.fechaBloqueHeader}>
                    <span className={styles.fechaNro}>Fecha {nf || "—"}</span>
                    {rueda && (
                      <span className={`${styles.ruedaBadge} ${rueda === "vuelta" ? styles.ruedaVuelta : styles.ruedaIda}`}>
                        {rueda}
                      </span>
                    )}
                    {descansa && (
                      <span className={styles.descansoChip}>💤 {descansa} descansa</span>
                    )}
                  </div>
                  <div className={styles.tablaWrap}>
                    <table className={styles.tabla}>
                      <thead>
                        <tr>
                          <th>Local</th>
                          <th>Visitante</th>
                          <th>Resultado</th>
                          <th>Horario</th>
                          <th>Ubicación</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ps.map(p => (
                          <tr key={p.id_fixture_partido}>
                            <td>{p.nombre_equipo_local ?? equiposPorId[p.id_equipo_local] ?? p.id_equipo_local}</td>
                            <td>{p.nombre_equipo_visitante ?? equiposPorId[p.id_equipo_visitante] ?? p.id_equipo_visitante}</td>
                            <td>
                              {p.estado === "TERMINADO" && p.goles_local != null
                                ? <span className={styles.resScore}>{p.goles_local} - {p.goles_visitante}</span>
                                : "—"}
                            </td>
                            <td>{p.horario ? p.horario.slice(0, 5) : "—"}</td>
                            <td>{p.ubicacion ?? "—"}</td>
                            <td>
                              <span className={`${styles.badge} ${ESTADOS_BADGE[p.estado]}`}>
                                {ESTADOS_LABELS[p.estado]}
                              </span>
                            </td>
                            <td className={styles.acciones}>
                              <button className={styles.btnPDF} title={p.estado === 'TERMINADO' ? 'Planilla completa' : 'Planilla vacía'} disabled={generandoPDF} onClick={() => handlePlanillaPartido(p)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="9" y1="13" x2="15" y2="13"/>
                                <line x1="9" y1="17" x2="12" y2="17"/>
                              </svg>
                              <span>PDF</span>
                            </button>
                              {p.estado === "TERMINADO" ? (
                                <>
                                  {p.id_partido_real && (
                                    <button className={styles.btnDetalle} onClick={() => handleVerDetalle(p)} disabled={cargandoDetalle}>Detalle</button>
                                  )}
                                  {p.id_partido_real && (
                                    <button className={styles.btnEditar} onClick={() => navigate(`/admin/partidos/nueva-planilla?partido=${p.id_partido_real}`)}>Editar planilla</button>
                                  )}
                                  <button className={styles.btnEditar} onClick={() => abrirFormularioEdicion(p)}>Editar fixture</button>
                                </>
                              ) : (
                                <>
                                  <button className={styles.btnCargar} onClick={() => navigate(`/admin/partidos/nueva-planilla?fixture=${p.id_fixture_partido}`)}>Cargar resultado</button>
                                  <button className={styles.btnOtorgarPuntos} onClick={() => abrirOtorgarPuntosModal(p)}>Otorgar puntos</button>
                                  <button className={styles.btnEditar} onClick={() => abrirFormularioEdicion(p)}>Editar fixture</button>
                                </>
                              )}
                              <button className={styles.btnEliminar} onClick={() => handleEliminar(p)}>Eliminar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          )}
        </section>
      )}

      {/* Modal detalle de partido jugado */}
      {detalleModal && detallePartido && (
        <div className={styles.modalOverlay} onClick={() => setDetalleModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{detallePartido.nombre_torneo}</h2>
                <p className={styles.modalSubHeader}>
                  Fecha {detallePartido.numero_fecha} | {new Date(detallePartido.fecha + "T00:00:00").toLocaleDateString()}
                </p>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setDetalleModal(false)}>×</button>
            </div>

            <div className={styles.mainScoreBanner}>
              <div className={styles.bigTeamName}>{detallePartido.equipo_local_nombre}</div>
              <div className={styles.bigScore}>{detallePartido.goles_local} - {detallePartido.goles_visitante}</div>
              <div className={styles.bigTeamName}>{detallePartido.equipo_visitante_nombre}</div>
            </div>

            <div className={styles.refereeRibbon}>
              <div className={styles.refereeItem}>
                <span>🏁</span>
                <span>Árbitros: <strong>{detallePartido.arbitros || "No designados"}</strong></span>
              </div>
              {(detallePartido.juez_mesa_local || detallePartido.juez_mesa_visitante) && (
                <div className={styles.refereeItem}>
                  <span>📋</span>
                  <span>Mesa: <strong>{[detallePartido.juez_mesa_local, detallePartido.juez_mesa_visitante].filter(Boolean).join(" / ")}</strong></span>
                </div>
              )}
            </div>

            <div className={styles.detailsBody}>
              {detallePartido.categoria_torneo === "SUB_12" ? (
                <div className={styles.sub12Grid}>
                  {[
                    { label: "🏠", equipo: detallePartido.equipo_local_nombre, lista: detallePartido.lista_jugadores_local },
                    { label: "🚩", equipo: detallePartido.equipo_visitante_nombre, lista: detallePartido.lista_jugadores_visitante },
                  ].map(({ label, equipo, lista }) => (
                    <div key={equipo} className={styles.teamSection}>
                      <h3>{label} {equipo}</h3>
                      <div className={styles.plantillaList}>
                        {parsePlantilla(lista).map((j, i) => (
                          <div key={i} className={styles.jugadorRow}>
                            <span className={styles.tshirt}>{j.rol === "JUGADOR" ? (j.camiseta || "-") : "📋"}</span>
                            <span>
                              {j.nombreCompleto}
                              {j.capitan && <small className={styles.capitanTag}> (C)</small>}
                              {j.rol !== "JUGADOR" && <small className={styles.rolTag}> ({j.rol})</small>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {[
                    {
                      label: "🏠", equipo: detallePartido.equipo_local_nombre,
                      lista: detallePartido.lista_jugadores_local,
                      goles: detallePartido.lista_goles_local,
                      tarjetas: detallePartido.lista_tarjetas_local,
                    },
                    {
                      label: "🚩", equipo: detallePartido.equipo_visitante_nombre,
                      lista: detallePartido.lista_jugadores_visitante,
                      goles: detallePartido.lista_goles_visitante,
                      tarjetas: detallePartido.lista_tarjetas_visitante,
                    },
                  ].map(({ label, equipo, lista, goles, tarjetas }, idx) => (
                    <div key={equipo}>
                      {idx > 0 && <hr className={styles.divider} />}
                      <div className={styles.teamSection}>
                        <h3>{label} {equipo}</h3>
                        <div className={styles.infoGrid}>
                          <div className={styles.infoCol}>
                            <label>📋 Plantilla</label>
                            <div className={styles.plantillaList}>
                              {parsePlantilla(lista).map((j, i) => (
                                <div key={i} className={styles.jugadorRow}>
                                  <span className={styles.tshirt}>{j.rol === "JUGADOR" ? (j.camiseta || "-") : "📋"}</span>
                                  <span>
                                    {j.nombreCompleto}
                                    {j.capitan && <small className={styles.capitanTag}> (C)</small>}
                                    {j.rol !== "JUGADOR" && <small className={styles.rolTag}> ({j.rol})</small>}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className={styles.infoCol}>
                            <label>🏑 Goles / 🎴 Sanciones</label>
                            {agruparGoles(goles).map((g, i) => (
                              <div key={i} className={styles.incidenciaItem}>
                                <div className={styles.incRow}>
                                  <span>🏑 {g.jugador} {g.esAutogol && <strong>(En contra)</strong>}</span>
                                  {g.tiempos.length > 1 && <span className={styles.incCount}>x{g.tiempos.length}</span>}
                                </div>
                                <small className={styles.incTiempos}>{g.tiempos.join("  ")}</small>
                              </div>
                            ))}
                            {agruparTarjetas(tarjetas).map((t, i) => (
                              <div key={i} className={styles.incidenciaItem}>
                                <div className={styles.incRow}>
                                  <span>{renderIconoTarjeta(t.tipoTarjeta)}{t.jugador}</span>
                                  {t.tiempos.length > 1 && <span className={styles.incCount}>x{t.tiempos.length}</span>}
                                </div>
                                <small className={styles.incTiempos}>{t.tiempos.join("  ")}</small>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className={styles.modalFooter}>
              <p>Ubicación: <strong>{detallePartido.ubicacion}</strong></p>
              <p className={styles.audit}>Cargado por: {detallePartido.creado_por}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal exportar PDF */}
      {modalPDF && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--bg-card, #1e1e2e)", borderRadius: 12, padding: "28px 32px", minWidth: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: "1.1rem", fontWeight: 700 }}>Exportar fixture a PDF</h3>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className={styles.btnEliminarFixture}
                onClick={() => setModalPDF(false)}
              >
                Cancelar
              </button>
              <Button onClick={() => {
                exportarFixturePDF(partidos, torneoSeleccionado!, esPlayoff)
                setModalPDF(false)
              }}>
                Descargar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Otorgar Puntos */}
      <OtorgarPuntosModal
        isOpen={otorgarPuntosModal}
        equipoLocal={partidoOtorgarPuntos?.nombre_equipo_local || "Local"}
        equipoVisitante={partidoOtorgarPuntos?.nombre_equipo_visitante || "Visitante"}
        onConfirm={handleConfirmarOtorgarPuntos}
        onCancel={() => {
          setOtorgarPuntosModal(false)
          setPartidoOtorgarPuntos(null)
        }}
        loading={otorgandoPuntos}
      />
    </div>
  )
}
