import { useParams, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"

import { usePlantelActivo } from "../../../hooks/usePlantelActivo"

import {
  getPersonasConRol,
} from "../../../api/vistas/personas.api"
import {
  bajaIntegrantePlantel,
} from "../../../api/planteles.api"

import type { PersonaConRol } from "../../../types/vistas"
import type { TipoRolPersona, TipoGenero } from "../../../constants/enums"

import PlantelLista from "./PlantelLista"
import Button from "../../../components/ui/button/Button"
import Modal from "../../../components/ui/modal/Modal"

import styles from "./EquipoDetalle.module.css"
import { agregarIntegrante } from "../../../api/plantelIntegrantes.api"

export default function EquipoDetalle() {
  const navigate = useNavigate()

  // =====================
  // URL
  // =====================
  const { id_equipo } = useParams<{ id_equipo: string }>()
  const equipoId = id_equipo ? Number(id_equipo) : undefined

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

  // =====================
  // Plantel activo
  // =====================
  const {
    integrantes,
    id_plantel,
    loading,
    error,
    hasData,
    refetch,
  } = usePlantelActivo(equipoId)

  // =====================
  // Modales
  // =====================
  const [modalType, setModalType] =
    useState<"agregar" | "eliminar" | null>(null)

  const [integranteAEliminar, setIntegranteAEliminar] =
    useState<{
      id_integrante: number
      nombre: string
    } | null>(null)

  // =====================
  // Personas
  // =====================
  const [rol, setRol] =
    useState<TipoRolPersona>("JUGADOR")

  const [personas, setPersonas] =
    useState<PersonaConRol[]>([])

  const [loadingPersonas, setLoadingPersonas] =
    useState(false)

  // filtros
  const [busqueda, setBusqueda] = useState("")
  const [genero, setGenero] =
    useState<"TODOS" | TipoGenero>("TODOS")

  // =====================
  // Cargar personas
  // =====================
  useEffect(() => {
    if (modalType !== "agregar") return

    setLoadingPersonas(true)
    getPersonasConRol(rol)
      .then(setPersonas)
      .finally(() => setLoadingPersonas(false))
  }, [rol, modalType])

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
      {/* ================= HEADER ================= */}
      <header className={styles.header}>
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
        >
          ← Volver
        </Button>

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

      {/* ================= PLANTEL ================= */}
      {hasData ? (
        <PlantelLista
          integrantes={integrantes}
          editable={true}
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
          setBusqueda("")
          setGenero("TODOS")
        }}
      >
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
              setGenero(e.target.value as any)
            }
          >
            <option value="TODOS">Todos</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
          </select>
        </div>

        {loadingPersonas && <p>Cargando…</p>}

        {!loadingPersonas &&
          personasFiltradas.length === 0 && (
            <p>No hay personas que coincidan</p>
          )}

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
                    await agregarIntegrante({
                      id_plantel,
                      id_persona: p.id_persona,
                      rol_en_plantel: rol,
                    })

                    await refetch()
                    setModalType(null)

                  } catch (err: any) {
                    console.error("❌ Error completo:", err)
                    console.error("❌ Response data:", err?.response?.data)

                    const backendError = err?.response?.data?.error

                    if (backendError?.message) {
                      alert(backendError.message)
                      return
                    }

                    alert("Error al agregar la persona")
                  }


                }}
              >
                Agregar
              </Button>
            </div>
          ))}
        </div>
      </Modal>

      {/* ================= MODAL ELIMINAR ================= */}
      <Modal
        open={modalType === "eliminar"}
        title="Eliminar integrante"
        onClose={() => {
          setModalType(null)
          setIntegranteAEliminar(null)
        }}
      >
        <p>
          ¿Dar de baja a{" "}
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

              await bajaIntegrantePlantel(
                integranteAEliminar.id_integrante
              )

              await refetch()
              setModalType(null)
              setIntegranteAEliminar(null)
            }}
          >
            Confirmar baja
          </Button>
        </div>
      </Modal>
    </section>
  )
}
