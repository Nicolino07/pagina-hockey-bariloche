import { useState } from "react"
import Button from "../../../components/ui/button/Button"
import { crearTorneo } from "../../../api/torneos.api"
import type { TipoGenero, TipoCategoria } from  "../../../constants/enums"
import { GENEROS, CATEGORIAS } from "../../../constants/enums"

import styles from "./CrearTorneoForm.module.css"

interface Props {
  onCancel: () => void
  onSuccess: () => void
}

export default function CrearTorneoForm({ onCancel, onSuccess }: Props) {
  const [form, setForm] = useState<{
    nombre: string
    categoria: TipoCategoria
    genero: TipoGenero
    fecha_inicio: string
  }>({
    nombre: "",
    categoria: "A",
    genero: "FEMENINO",
    fecha_inicio: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await crearTorneo(form)
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Error al crear torneo")
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
              {cat.replace("_", " ")}
            </option>
          ))}
        </select>
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
              {gen === "MASCULINO" ? "Masculino" : "Femenino"}
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
          {loading ? "Creando…" : "Crear torneo"}
        </Button>
      </div>
    </form>
  )
}
