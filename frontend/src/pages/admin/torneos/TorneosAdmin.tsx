// frontend/src/pages/admin/torneos/TorneosAdmin.tsx
import { useNavigate, useSearchParams } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import Button from "../../../components/ui/button/Button"
import CrearTorneoForm from "./CrearTorneoForm"
import BotonPlanillaEnBlanco from "../../../components/ui/button/BotonPlanillaEnBlanco"
import TablaAnual from "../../../components/temporada/TablaAnual"
import SelectorTorneosAnual from "../../../components/temporada/SelectorTorneosAnual"
import PlayoffAnualLauncher from "../../../components/temporada/PlayoffAnualLauncher"
import { listarTorneos } from "../../../api/torneos.api"
import {
  listarTemporadas,
  obtenerTablaAnual,
  obtenerSelectorTablaAnual,
  definirTorneosComputables,
} from "../../../api/temporadas.api"
import type { Torneo } from "../../../types/torneo"
import type { Temporada, FilaTablaAnual, SelectorTablaAnual } from "../../../types/temporada"
import {
  agruparPorCategoria,
  GENERO_ICON,
  type GrupoCategoria,
} from "../../../utils/categorias"

import styles from "./TorneosAdmin.module.css"

/**
 * Página administrativa de gestión de torneos.
 *
 * La navegación es por categoría (categoría + género + división, la tupla que
 * identifica a una liga): se elige una y debajo aparece la tabla anual de su
 * temporada, con una pestaña por cada torneo activo al lado.
 *
 * Las pestañas de torneo son accesos directos a `/admin/torneos/:id`, no
 * contenido embebido: el detalle ya tiene sus propias solapas de
 * resumen/fixture/configuración, y repetir la tarjeta del torneo dentro de su
 * propia pestaña era una caja adentro de otra.
 *
 * Los torneos finalizados siguen en la vista aparte del botón «Ver finalizados».
 */
export default function TorneosAdmin() {
  const navigate = useNavigate()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [verFinalizados, setVerFinalizados] = useState(false)
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(true)

  const [searchParams, setSearchParams] = useSearchParams()
  const categoriaSel = searchParams.get("cat")

  const [temporadas, setTemporadas] = useState<Temporada[]>([])
  // Colapsado una vez que hay categoría elegida; se despliega para cambiarla.
  const [listaAbierta, setListaAbierta] = useState(false)
  const [tab, setTab] = useState<"anual" | "historicos">("anual")
  const [tablaAnual, setTablaAnual] = useState<FilaTablaAnual[]>([])
  const [loadingAnual, setLoadingAnual] = useState(false)
  const [selector, setSelector] = useState<SelectorTablaAnual | null>(null)
  // Cuántos equipos entran al playoff anual con la configuración que el admin
  // está tocando abajo. La tabla lo usa para dibujar la línea de corte.
  const [cuposPlayoff, setCuposPlayoff] = useState<number | null>(null)

  // Se traen activos y finalizados juntos: cada categoría necesita los dos, los
  // activos para sus pestañas y los terminados para la de históricos.
  const cargarTorneos = useCallback(async () => {
    setLoading(true)
    try {
      setTorneos(await listarTorneos(false))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargarTorneos() }, [cargarTorneos])

  // Las temporadas solo hacen falta en la vista de activos. Si la llamada falla
  // (permisos, sesión) la página sigue andando sin la pestaña anual.
  useEffect(() => {
    if (verFinalizados) return
    listarTemporadas().then(setTemporadas).catch(() => setTemporadas([]))
  }, [verFinalizados])

  const grupos = agruparPorCategoria(torneos, temporadas)
  const finalizados = torneos.filter(t => !t.activo)
  const grupoActivo = grupos.find(g => g.clave === categoriaSel) ?? null

  // Año de la liga: el de su temporada si ya existe, y si no el del torneo más
  // reciente de la categoría (que es el que el admin está mirando).
  const anioGrupo =
    grupoActivo?.temporada?.anio ??
    (grupoActivo?.torneos.length
      ? Math.max(...grupoActivo.torneos.map(t => new Date(t.fecha_inicio).getFullYear()))
      : new Date().getFullYear())

  useEffect(() => {
    if (!grupoActivo) {
      setSelector(null)
      setTablaAnual([])
      return
    }
    setLoadingAnual(true)
    const filtro = {
      anio: anioGrupo,
      categoria: grupoActivo.categoria,
      genero: grupoActivo.genero,
      division: grupoActivo.division,
    }
    Promise.all([
      obtenerSelectorTablaAnual(filtro),
      grupoActivo.temporada
        ? obtenerTablaAnual(grupoActivo.temporada.id_temporada)
        : Promise.resolve([] as FilaTablaAnual[]),
    ])
      .then(([sel, filas]) => { setSelector(sel); setTablaAnual(filas) })
      .catch(() => { setSelector(null); setTablaAnual([]) })
      .finally(() => setLoadingAnual(false))
    // `id_temporada` va en las dependencias, no solo la categoría: torneos y
    // temporadas se piden en paralelo y no hay orden garantizado. Si los
    // torneos llegan primero, este efecto corre con `temporada` todavía en
    // null, se salta el pedido de la tabla y la deja vacía; cuando después
    // llegan las temporadas el grupo ya tiene la suya, pero la clave y el año
    // no cambiaron, así que sin esta dependencia el efecto no vuelve a
    // correr. Resultado: el encabezado dice de qué torneos suma y abajo no
    // hay ninguna fila.
  }, [grupoActivo?.clave, anioGrupo, grupoActivo?.temporada?.id_temporada])

  /** Aplica la selección y refresca tabla, selector y grupos con lo que vuelve. */
  async function regenerarTablaAnual(idTorneos: number[]) {
    if (!grupoActivo) return
    const filtro = {
      anio: anioGrupo,
      categoria: grupoActivo.categoria,
      genero: grupoActivo.genero,
      division: grupoActivo.division,
    }
    const filas = await definirTorneosComputables({ ...filtro, id_torneos: idTorneos })
    setTablaAnual(filas)
    setSelector(await obtenerSelectorTablaAnual(filtro))
    // La temporada puede haberse creado recién: hay que releerlas para que el
    // grupo la tome y la tabla deje de decir que no hay ninguna.
    listarTemporadas().then(setTemporadas).catch(() => {})
  }

  function elegirCategoria(grupo: GrupoCategoria) {
    setSearchParams({ cat: grupo.clave }, { replace: true })
    setListaAbierta(false)
    setMostrarForm(false)
    setTab("anual")
  }

  // ── Vista de finalizados: la lista plana de siempre ───────────────────────
  if (verFinalizados) {
    return (
      <section className={styles.section}>
        <header className={styles.header}>
          <h2 className={styles.title}>Torneos finalizados</h2>
          <div className={styles.botones}>
            <BotonPlanillaEnBlanco>🖨️ Planilla en blanco</BotonPlanillaEnBlanco>
            <Button variant="secondary" onClick={() => setVerFinalizados(false)}>
              Ver activos
            </Button>
            <Button onClick={() => navigate("/admin")}>← Volver</Button>
          </div>
        </header>

        {loading ? (
          <p>Cargando torneos…</p>
        ) : finalizados.length === 0 ? (
          <p>No hay torneos finalizados.</p>
        ) : (
          <ul className={styles.list}>
            {finalizados.map(t => (
              <li
                key={t.id_torneo}
                className={`${styles.item} ${styles.itemFinalizado}`}
                onClick={() => navigate(`/admin/torneos/${t.id_torneo}`)}
              >
                <div>
                  <div className={styles.nombre}>{t.nombre}</div>
                  <div className={styles.meta}>
                    <span className={styles.tagCategoria}>{t.categoria.replace(/_/g, " ")}</span>
                    {t.division && <span className={styles.tagDivision}>{t.division}</span>}
                    <span className={styles.tagGenero}>{t.genero}</span>
                  </div>
                  {t.fecha_fin && (
                    <div className={styles.fechaFin}>Finalizado: {t.fecha_fin}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    )
  }

  // ── Vista de activos: categorías → pestañas ──────────────────────────────
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>Torneos</h2>
        <div className={styles.botones}>
          <Button onClick={() => setMostrarForm(true)}>➕ Crear torneo</Button>
          <BotonPlanillaEnBlanco>🖨️ Planilla en blanco</BotonPlanillaEnBlanco>
          <Button
            variant="secondary"
            onClick={() => { setVerFinalizados(true); setMostrarForm(false) }}
          >
            Ver finalizados
          </Button>
          <Button onClick={() => navigate("/admin")}>← Volver</Button>
        </div>
      </header>

      {mostrarForm && (
        <CrearTorneoForm
          onCancel={() => setMostrarForm(false)}
          onSuccess={() => { setMostrarForm(false); cargarTorneos() }}
        />
      )}

      {loading ? (
        <p>Cargando torneos…</p>
      ) : grupos.length === 0 ? (
        <p>No hay torneos cargados.</p>
      ) : (
        <>
          {/* Paso 1: elegir la categoría. Con una elegida la lista se comprime
              a una línea, que funciona de resumen y de botón para volver a
              desplegarla. */}
          {grupoActivo && !listaAbierta ? (
            <button
              type="button"
              className={styles.categoriaResumen}
              onClick={() => setListaAbierta(true)}
              aria-expanded={false}
            >
              <span className={styles.categoriaNombre}>
                <span className={styles.categoriaGenero} aria-hidden="true">
                  {GENERO_ICON[grupoActivo.genero]}
                </span>
                {grupoActivo.etiqueta}
              </span>
              <span className={styles.categoriaCambiar}>Cambiar ▾</span>
            </button>
          ) : (
            <div className={styles.categorias}>
              {grupos.map(g => (
                <button
                  key={g.clave}
                  className={`${styles.categoria} ${categoriaSel === g.clave ? styles.categoriaActiva : ""}`}
                  onClick={() => elegirCategoria(g)}
                >
                  {/* El género va en el nombre, no solo como ícono: Mayores A
                      masculino y Mayores A femenino son ligas distintas y con
                      un símbolo chico como única diferencia se confunden. */}
                  <span className={styles.categoriaNombre}>
                    <span className={styles.categoriaGenero} aria-hidden="true">
                      {GENERO_ICON[g.genero]}
                    </span>
                    {g.etiqueta}
                  </span>
                  <span className={styles.categoriaMeta}>
                    {g.torneos.length}{" "}
                    {g.torneos.length === 1 ? "torneo" : "torneos"}
                    {g.temporada ? " · con tabla anual" : ""}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Paso 2: pestañas de la categoría elegida */}
          {!grupoActivo ? (
            <p className={styles.hint}>
              Elegí una categoría para ver su tabla anual y sus torneos.
            </p>
          ) : (
            <>
              {/* La pestaña de la tabla anual está siempre: si la liga todavía
                  no tiene temporada, el selector de abajo es justamente lo que
                  permite armarla. Las demás pestañas son accesos al detalle. */}
              <nav className={styles.tabs}>
                <button
                  className={`${styles.tab} ${tab === "anual" ? styles.tabActivo : ""}`}
                  onClick={() => setTab("anual")}
                >
                  📊 Tabla anual {anioGrupo}
                </button>

                {/* Las de torneo en curso son accesos al detalle, no contenido. */}
                {grupoActivo.torneos.map(t => (
                  <button
                    key={t.id_torneo}
                    className={styles.tab}
                    onClick={() => navigate(`/admin/torneos/${t.id_torneo}`)}
                  >
                    {t.nombre}
                  </button>
                ))}

                {grupoActivo.historicos.length > 0 && (
                  <button
                    className={`${styles.tab} ${tab === "historicos" ? styles.tabActivo : ""}`}
                    onClick={() => setTab("historicos")}
                  >
                    🗄 Históricos ({grupoActivo.historicos.length})
                  </button>
                )}
              </nav>

              {tab === "historicos" ? (
                <ul className={styles.list}>
                  {grupoActivo.historicos.map(t => (
                    <li
                      key={t.id_torneo}
                      className={`${styles.item} ${styles.itemFinalizado}`}
                      onClick={() => navigate(`/admin/torneos/${t.id_torneo}`)}
                    >
                      <div>
                        <div className={styles.nombre}>{t.nombre}</div>
                        <div className={styles.meta}>
                          <span className={styles.tagCategoria}>
                            {t.categoria.replace(/_/g, " ")}
                          </span>
                          {t.division && (
                            <span className={styles.tagDivision}>{t.division}</span>
                          )}
                          <span className={styles.tagGenero}>{t.genero}</span>
                        </div>
                        {t.fecha_fin && (
                          <div className={styles.fechaFin}>Finalizado: {t.fecha_fin}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  {/* Primero con qué se arma la tabla, después la tabla. */}
                  {selector && (
                    <SelectorTorneosAnual
                      datos={selector}
                      onRegenerar={regenerarTablaAnual}
                      disabled={loadingAnual}
                    />
                  )}

                  {grupoActivo.temporada ? (
                    <TablaAnual
                      temporada={grupoActivo.temporada}
                      filas={tablaAnual}
                      loading={loadingAnual}
                      cupos={cuposPlayoff}
                      acciones={
                        <PlayoffAnualLauncher
                          temporada={grupoActivo.temporada}
                          filas={tablaAnual}
                          onCuposChange={setCuposPlayoff}
                          onCreado={() => {
                            // El playoff recién creado es un torneo más de la
                            // temporada: hay que releer las dos cosas para que
                            // aparezca en su pestaña y el lanzador se apague.
                            listarTemporadas().then(setTemporadas).catch(() => {})
                            cargarTorneos()
                          }}
                        />
                      }
                    />
                  ) : (
                    <p className={styles.hint}>
                      Esta categoría todavía no tiene tabla anual. Elegí arriba
                      qué torneos suman y regenerala.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}
