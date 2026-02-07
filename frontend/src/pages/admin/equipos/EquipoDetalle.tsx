import { useParams, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { usePlantelActivo } from "../../../hooks/usePlantelActivo"
// Cambiamos la API a una que filtre por club
import { getFichajesByClub} from "../../../api/fichajes.api" 
import { bajaIntegrantePlantel } from "../../../api/planteles.api"
import { agregarIntegrante } from "../../../api/plantelIntegrantes.api"
import type { TipoRolPersona, TipoGenero } from "../../../constants/enums"
import PlantelLista from "./PlantelLista"
import Button from "../../../components/ui/button/Button"
import Modal from "../../../components/ui/modal/Modal"
import styles from "./EquipoDetalle.module.css"

export default function EquipoDetalle() {
  const navigate = useNavigate()
  const { id_equipo } = useParams<{ id_equipo: string }>()
  const equipoId = id_equipo ? Number(id_equipo) : undefined

  const location = useLocation()
  // 1. Extraemos id_club del state enviado desde ClubDetalle
  const {
    id_club,
    clubNombre,
    equipoNombre,
    categoria,
    generoEquipo,
  } = (location.state || {}) as {
    id_club?: number
    clubNombre?: string
    equipoNombre?: string
    categoria?: string
    generoEquipo?: string
  }

  const {
    integrantes,
    id_plantel,
    loading,
    error,
    refetch,
  } = usePlantelActivo(equipoId)

  const [modalType, setModalType] = useState<"agregar" | "eliminar" | null>(null)
  const [integranteAEliminar, setIntegranteAEliminar] = useState<{id_integrante: number, nombre: string} | null>(null)

  // ESTADOS PARA EL MODAL DE AGREGAR
  const [rol, setRol] = useState<TipoRolPersona>("JUGADOR")
  const [fichados, setFichados] = useState<any[]>([]) // Personas fichadas en el club
  const [loadingFichados, setLoadingFichados] = useState(false)
  const [busqueda, setBusqueda] = useState("")


  // 2. CARGAR SOLO PERSONAS FICHADAS EN ESTE CLUB
  useEffect(() => {
    if (modalType !== "agregar" || !id_club) return

    setLoadingFichados(true)
    getFichajesByClub(Number(id_club))
      .then(setFichados)
      .catch(err => console.error("Error cargando fichados:", err))
      .finally(() => setLoadingFichados(false))
  }, [id_club, modalType])

  // 3. FILTRADO LOCAL (Busqueda y Género)
  const fichadosFiltrados = fichados.filter(f => {
    // IMPORTANTE: Adaptar según los nombres de campos que devuelva tu vista de fichajes
    const nombreCompleto = `${f.persona_nombre} ${f.persona_apellido}`.toLowerCase()
    const matchBusqueda = nombreCompleto.includes(busqueda.toLowerCase())
  
    const matchRol = f.rol === rol // Solo mostrar los que están fichados con el rol seleccionado
    return matchBusqueda  && matchRol
  })

  if (loading) return <p>Cargando plantel…</p>
  if (error) return <p>{error}</p>

  return (
    <section>
      <header className={styles.header}>
        <Button variant="secondary" onClick={() => navigate(-1)}>← Volver</Button>
        <h1 className={styles.club}>{clubNombre ?? "Club"}</h1>
        <h2 className={styles.equipo}>
          {equipoNombre ?? "Equipo"} · {generoEquipo} · {categoria}
        </h2>
        <div className={styles.actions}>
          <Button onClick={() => setModalType("agregar")}>Agregar Persona</Button>
        </div>
      </header>

      {integrantes.length > 0 ? (
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
        <p className={styles.emptyMsg}>Este equipo no tiene integrantes todavía.</p>
      )}

      {/* MODAL AGREGAR */}
      <Modal
        open={modalType === "agregar"}
        title="Agregar al Plantel"
        onClose={() => { setModalType(null); setBusqueda(""); }}
      >
        <div className={styles.modalFilters}>
          <label>
            Rol en plantel:
            <select value={rol} onChange={e => setRol(e.target.value as TipoRolPersona)}>
              <option value="JUGADOR">Jugador</option>
              <option value="ENTRENADOR">Entrenador</option>
              <option value="DT">DT</option>
              <option value="PREPARADOR_FISICO">Preparador Físico</option>
            </select>
          </label>
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            value={busqueda} 
            onChange={e => setBusqueda(e.target.value)} 
          />
        </div>

        {loadingFichados ? <p>Cargando personas del club...</p> : (
          <div className={styles.personasList}>
            {fichadosFiltrados.map(f => (
              <div key={f.id_fichaje_rol} className={styles.personaItem}>
                <span>{f.persona_apellido}, {f.persona_nombre} <small>({f.rol})</small></span>

                  <Button
                    onClick={async () => {
                        try {
                          const payload = {
                            // Forzamos que sean números para evitar el error de validación
                            id_plantel: Number(id_plantel),
                            id_fichaje_rol: Number(f.id_fichaje_rol),
                            id_persona: Number(f.id_persona),
                            rol_en_plantel: rol, // Este es el string "JUGADOR" o "ENTRENADOR"
                            creado_por: "admin"
                          };

                          console.log("📤 Enviando datos finales:", payload);
                          
                          const response = await agregarIntegrante(payload);
                          console.log("✅ Respuesta servidor:", response);

                          await refetch();
                          setModalType(null);
                        } catch (err: any) {
                          // Si el error es 400 o 500, el backend suele enviar el motivo real aquí
                          console.error("❌ Error Detallado:", err.response?.data);
                          
                          const msg = err.response?.data?.error?.message || "Error al agregar";
                          alert(msg);
                        }
                      }
                    
                  >
                    Agregar
                  </Button>
              </div>
            ))}
            {fichadosFiltrados.length === 0 && <p>No se encontraron personas fichadas con este rol.</p>}
          </div>
        )}
      </Modal>

      {/* MODAL ELIMINAR (Se mantiene igual) */}
    </section>
  )
}