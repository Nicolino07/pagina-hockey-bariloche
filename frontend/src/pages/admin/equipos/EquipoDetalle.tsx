import { useParams, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"

import { usePlantelActivo } from "../../../hooks/usePlantelActivo"

import { getPersonasConRol } from "../../../api/vistas/personas.api"
import { agregarIntegrantePlantel, bajaIntegrantePlantel } from "../../../api/planteles.api"

import type { PersonaConRol } from "../../../types/vistas"
import type { TipoRolPersona, TipoGenero} from "../../../types/enums"

import PlantelLista from "./PlantelLista"
import Button from "../../../components/ui/button/Button"
import Modal from "../../../components/ui/modal/Modal"

import styles from "./EquipoDetalle.module.css"

export default function EquipoDetalle() {

  // URL params
  const { id_equipo } =
    useParams<{ id_equipo: string, nombreEquipo: string }>()

  const equipoId = id_equipo
    ? Number(id_equipo)
    : undefined

  // modal
  const [modalType, setModalType] =
    useState<"agregar" | "eliminar" | null>(null)

  // rol
  const [rol, setRol] =
    useState<TipoRolPersona>("JUGADOR")

  // personas
  const [personas, setPersonas] =
    useState<PersonaConRol[]>([])

  const [loadingPersonas, setLoadingPersonas] =
    useState(false)

  const [mostrarCrear, setMostrarCrear] =
    useState(false)

  const [integranteAEliminar, setIntegranteAEliminar] =
    useState<{
      id_integrante: number
      nombre: string
    } | null>(null)


  // 🔍 filtros
  const [busqueda, setBusqueda] =
    useState("")

  const [genero, setGenero] =
    useState<"TODOS" | TipoGenero>("TODOS")
  

  const location = useLocation()
  const {
  clubNombre,
  equipoNombre,
  categoria,
  generoEquipo,
} = (location.state || {}) as {
  clubNombre?: string
  equipoNombre?: string
  categoria?: string
  generoEquipo?: string
}

  // plantel activo
  const {
    integrantes,
    id_plantel,
    loading,
    error,
    hasData,
    refetch,
  } = usePlantelActivo(equipoId)

  useEffect(() => {
    if (personas.length > 0) {
      console.log("👀 genero real:", personas[0].genero)
    }
  }, [personas])

  // 🔄 cargar personas por rol
  useEffect(() => {
    if (modalType !== "agregar") return

    setLoadingPersonas(true)
    getPersonasConRol(rol)
      .then(setPersonas)
      .finally(() => setLoadingPersonas(false))
  }, [rol, modalType])

  // 🧠 filtrado frontend
  const personasFiltradas = personas.filter(p => {
    const texto =
      `${p.nombre} ${p.apellido}`.toLowerCase()

    const matchBusqueda =
      texto.includes(busqueda.toLowerCase())

    const matchGenero =
    genero === "TODOS" || p.genero === genero


    return matchBusqueda && matchGenero
  })

  if (loading) return <p>Cargando plantel…</p>
  if (error) return <p>{error}</p>

  return (
    <section>
      <header className={styles.header}>

        <h1 className={styles.club}>
          {clubNombre ?? "Club"}
        </h1>

        <h2 className={styles.equipo}>
          {equipoNombre ?? "Equipo"}
          {" · "}
          {generoEquipo ?? "Género"}
          {" · "}
          {categoria ?? "Categoría"}
        </h2>


        <div className={styles.actions}>
          <Button onClick={() => setModalType("agregar")}>
            Agregar Persona
          </Button>

        </div>
      </header>

      {hasData ? (
        <PlantelLista
          integrantes={integrantes}
          onEliminar={(i) => {
            setIntegranteAEliminar({
              id_integrante: i.id_plantel_integrante,
              nombre: `${i.apellido}, ${i.nombre}`,
            })
            setModalType("eliminar")
          }}
        />
      ) : (
        <p>Este equipo no tiene integrantes</p>
      )}

      {/* ================= MODAL AGREGAR ================= */}
      <Modal
        open={modalType === "agregar"}
        title="Agregar Persona"
        onClose={() => {
          setModalType(null)
          setMostrarCrear(false)
          setBusqueda("")
          setGenero("TODOS")
        }}
      >
        {/* rol */}
        <label className={styles.rolSelector}>
          Rol:
          <select
            value={rol}
            onChange={e =>
              setRol(e.target.value as TipoRolPersona)
            }
          >
            <option value="JUGADOR">Jugador</option>
            <option value="ENTRENADOR">Entrenador</option>
          </select>
        </label>

        {/* 🔍 filtros */}
        <div className={styles.filtros}>
          <input
            type="text"
            placeholder="Buscar por nombre o apellido"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />

          <select
            value={genero}
            onChange={e =>
              setGenero(
                e.target.value as "TODOS" | TipoGenero
              )
            }
          >
            <option value="TODOS">Todos</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
          </select>

        </div>

        <h4>Personas existentes</h4>

        {loadingPersonas && <p>Cargando…</p>}

        {!loadingPersonas &&
          personasFiltradas.length === 0 && (
            <p>
              No hay personas que coincidan con el
              filtro
            </p>
          )}

        {/* 👇 lista scrolleable */}
        <div className={styles.personasList}>
          {personasFiltradas.map(p => (
            <div
              key={p.id_persona}
              className={styles.personaItem}
            >
              <span>
                {p.apellido}, {p.nombre}
              </span>

              <Button
                disabled={!id_plantel}
                onClick={async () => {
                  if (!id_plantel) return

                  try {
                    await agregarIntegrantePlantel(
                      id_plantel,
                      p.id_persona,
                      rol
                    )

                    await refetch()
                    setModalType(null)

                  } catch (err: any) {
                    console.log(
                      "🔥 ERROR BACKEND:",
                      err?.response?.data
                    )

                    if (err.status === 409) {
                      alert(
                        "Esta persona no puede agregarse a este plantel (regla del sistema)"
                      )
                      return
                    }

                    alert(
                      "Error inesperado al agregar persona"
                    )
                    console.error(err)
                  }
                }}
              >
                Agregar
              </Button>
            </div>
          ))}
        </div>

        <hr />

        {!mostrarCrear ? (
          <Button
            variant="secondary"
            onClick={() => setMostrarCrear(true)}
          >
            + Crear nueva persona
          </Button>
        ) : (
          <p>⚠️ Crear persona se implementa luego</p>
        )}
      </Modal>


      {/* ================= MODAL Eliminar ================= */}

      <Modal
        open={modalType === "eliminar" && !!integranteAEliminar}
        title="Eliminar integrante"
        onClose={() => {
          setModalType(null)
          setIntegranteAEliminar(null)
        }}
      >
        <p>
          ¿Seguro que querés dar de baja a{" "}
          <strong>
            {integranteAEliminar?.nombre}
          </strong>
          ?
        </p>

        <div className={styles.modalActions}>
          <Button
            variant="secondary"
            onClick={() => {
              setModalType(null)
              setIntegranteAEliminar(null)
            }}
          >
            Cancelar
          </Button>

          <Button
            variant="danger"
            onClick={async () => {
              if (!integranteAEliminar) return

              try {
                await bajaIntegrantePlantel(
                  integranteAEliminar.id_integrante
                )

                await refetch()   // 🔄 recargar plantel
                setModalType(null)
                setIntegranteAEliminar(null)

              } catch (err: any) {
                console.error("🔥 Error baja integrante", err)

                alert(
                  err?.response?.data?.detail ||
                    "Error al eliminar integrante"
                )
              }
            }}
          >
            Confirmar baja
          </Button>
        </div>
      </Modal>

    </section>
  )
}
