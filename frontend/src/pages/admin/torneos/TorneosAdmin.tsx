import { useTorneosActivos } from "../../../hooks/useTorneosActivos"
import { useNavigate } from "react-router-dom"
import Button from "../../../components/ui/button/Button"
import Modal from "../../../components/ui/modal/Modal"

export default function TorneosAdmin() {
  const { torneos, loading, error } = useTorneosActivos()
  const navigate = useNavigate()

  if (loading) return <p>Cargando torneos…</p>
  if (error) return <p>{error}</p>

  return (
    <section>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Torneos activos</h2>
        <Button onClick={() => navigate("/admin/torneos/nuevo")}>
        ➕ Crear torneo
        </Button>
      </header>

      {torneos.length === 0 ? (
        <p>No hay torneos activos</p>
      ) : (
        <ul>
          {torneos.map(t => (
            <li
                key={t.id_torneo}
                onClick={() => navigate(`/admin/torneos/${t.id_torneo}`)}
                style={{ cursor: "pointer", padding: "8px" }}
                >
                <strong>{t.nombre}</strong>
                <div>
                    {t.categoria} – {t.genero}
                </div>
            </li>

          ))}
        </ul>
      )}
    </section>
  )
}
