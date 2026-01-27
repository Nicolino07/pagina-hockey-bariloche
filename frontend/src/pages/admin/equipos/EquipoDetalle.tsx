import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"

import { usePlantelActivo } from "../../../hooks/usePlantelActivo"
import { getPersonasConRol } from "../../../api/vistas/personas.api"
import { agregarIntegrantePlantel } from "../../../api/planteles.api"

import type { PersonaConRol } from "../../../types/vistas"
import type { TipoRolPersona } from "../../../types/enums"

import PlantelLista from "./PlantelLista"
import Button from "../../../components/ui/button/Button"
import Modal from "../../../components/ui/modal/Modal"

export default function EquipoDetalle() {
  const { idEquipo } = useParams<{ idEquipo: string }>()
  const equipoId = idEquipo ? Number(idEquipo) : undefined

  const [modalType, setModalType] =
    useState<"agregar" | "eliminar" | null>(null)

  const [rol, setRol] =
    useState<TipoRolPersona>("JUGADOR")

  const [personas, setPersonas] =
    useState<PersonaConRol[]>([])

  const [loadingPersonas, setLoadingPersonas] =
    useState(false)

  const [mostrarCrear, setMostrarCrear] =
    useState(false)

  const {
    integrantes,
    plantelId,
    loading,
    error,
    hasData,
    refetch,
  } = usePlantelActivo(equipoId)

  // 🔄 cargar personas por rol
  useEffect(() => {
    if (modalType !== "agregar") return

    setLoadingPersonas(true)
    getPersonasConRol(rol)
      .then(setPersonas)
      .finally(() => setLoadingPersonas(false))
  }, [rol, modalType])

  if (loading) return <p>Cargando plantel…</p>
  if (error) return <p>{error}</p>

  return (
    <section>
      <header>
        <h2>Plantel</h2>

        <Button onClick={() => setModalType("agregar")}>
          Agregar Persona
        </Button>

        <Button
          variant="danger"
          onClick={() => setModalType("eliminar")}
        >
          Eliminar Persona
        </Button>
      </header>

      {hasData ? (
        <PlantelLista integrantes={integrantes} />
      ) : (
        <p>Este equipo no tiene integrantes</p>
      )}

      {/* MODAL AGREGAR */}
      <Modal
        open={modalType === "agregar"}
        title="Agregar Persona"
        onClose={() => {
          setModalType(null)
          setMostrarCrear(false)
        }}
      >
        <label>
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

        <h4>Personas existentes</h4>

        {loadingPersonas && <p>Cargando…</p>}

        {!loadingPersonas && personas.length === 0 && (
          <p>No hay personas con este rol</p>
        )}

        {personas.map(p => (
          <div key={p.id_persona}>
            {p.apellido}, {p.nombre}

            <Button
              disabled={!plantelId}
              onClick={async () => {
                if (!plantelId) return

                try {
                  await agregarIntegrantePlantel(
                    plantelId,
                    p.id_persona,
                    rol
                  )

                  await refetch()
                  setModalType(null)

                } catch (err: any) {
                  if (err.status === 409) {
                    alert(
                      "Esta persona no puede agregarse a este plantel (regla del sistema)"
                    )
                    return
                  }

                  alert("Error inesperado al agregar persona")
                  console.error(err)
                }
              }}
            >
              Agregar
            </Button>
          </div>
        ))}

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
    </section>
  )
}
