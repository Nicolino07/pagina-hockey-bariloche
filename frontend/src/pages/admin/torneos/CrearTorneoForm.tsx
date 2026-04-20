import { useState } from "react"
import Button from "../../../components/ui/button/Button"
import { crearTorneo, actualizarTorneo } from "../../../api/torneos.api"
import type { TipoGenero, TipoCategoria } from  "../../../constants/enums"
import { GENEROS, CATEGORIAS } from "../../../constants/enums"
import type { Torneo } from "../../../types/torneo"

import styles from "./CrearTorneoForm.module.css"

interface Props {
  onCancel: () => void
  onSuccess: () => void
  torneoEditar?: Torneo
}

/**
 * Formulario inline para crear un nuevo torneo.
 * @param onCancel - Callback invocado al cancelar sin guardar.
 * @param onSuccess - Callback invocado tras crear el torneo exitosamente.
 */
export default function CrearTorneoForm({ onCancel, onSuccess, torneoEditar }: Props) {
  const modoEdicion = !!torneoEditar

  const [form, setForm] = useState<{
    nombre: string
    categoria: TipoCategoria
    division: string | null
    genero: TipoGenero
    fecha_inicio: string
  }>({
    nombre: torneoEditar?.nombre ?? "",
    categoria: torneoEditar?.categoria ?? "MAYORES",
    division: torneoEditar?.division ?? null,
    genero: torneoEditar?.genero ?? "FEMENINO",
    fecha_inicio: torneoEditar?.fecha_inicio ?? "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === "division" ? (value || null) : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (modoEdicion && torneoEditar) {
        await actualizarTorneo(torneoEditar.id_torneo, {
          ...form,
          activo: torneoEditar.activo,
        })
      } else {
        await crearTorneo(form)
      }
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message ?? (modoEdicion ? "Error al actualizar torneo" : "Error al crear torneo"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label}>Nombre</label>
        <input
          className={styles.input}
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Categoría</label>
        <select
          className={styles.select}
          name="categoria"
          value={form.categoria}
          onChange={handleChange}
        >
          {CATEGORIAS.map(cat => (
            <option key={cat} value={cat}>
              {cat.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>División <span className={styles.optional}>(opcional)</span></label>
        <input
          className={styles.input}
          name="division"
          value={form.division ?? ""}
          onChange={handleChange}
          placeholder="Ej: A, B, Desarrollo..."
          maxLength={30}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Género</label>
        <select
          className={styles.select}
          name="genero"
          value={form.genero}
          onChange={handleChange}
        >
          {GENEROS.map(gen => (
            <option key={gen} value={gen}>
              {gen === "MASCULINO" ? "Masculino" : gen === "FEMENINO" ? "Femenino" : "Mixto"}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Fecha inicio</label>
        <input
          className={styles.input}
          type="date"
          name="fecha_inicio"
          value={form.fecha_inicio}
          onChange={handleChange}
          required
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (modoEdicion ? "Guardando…" : "Creando…") : (modoEdicion ? "Guardar cambios" : "Crear torneo")}
        </Button>
      </div>
    </form>
  )
}
