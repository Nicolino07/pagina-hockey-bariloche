import { useState, useEffect } from "react";
import styles from "./PersonaDetalle.module.css"; 
import type { PersonaFormData } from "../../../types/persona";
import type { TipoGenero } from "../../../constants/enums";

interface Props {
  initialData?: PersonaFormData;
  onSubmit: (data: PersonaFormData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  disabled?: boolean;
}

export default function PersonaForm({ initialData, onSubmit, onCancel, isSaving, disabled }: Props) {
  const [formData, setFormData] = useState<PersonaFormData>({
    nombre: "",
    apellido: "",
    documento: null,
    fecha_nacimiento: "",
    genero: "" as TipoGenero,
    email: "",
    direccion: "",
    telefono: "",
  });

  // Sincronizar el estado interno cuando llegan los datos del padre
  // Este useEffect es vital. Asegúrate de que tenga la dependencia [initialData]
  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || "",
        apellido: initialData.apellido || "",
        documento: initialData.documento || null,
        fecha_nacimiento: initialData.fecha_nacimiento || "",
        genero: initialData.genero || "" as TipoGenero,
        email: initialData.email || "",
        direccion: initialData.direccion || "",
        telefono: initialData.telefono || "",
      });
    }
  }, [initialData]); // <--- Si esto falta, el form nunca se llena


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.formGrid}>
      <div className={styles.formGroup}>
        <label>Nombre</label>
        <input name="nombre" disabled={disabled} value={formData.nombre} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label>Apellido</label>
        <input name="apellido" disabled={disabled} value={formData.apellido} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label>DNI</label>
        <input
          name="documento"
          type="number"
          disabled={disabled}
          value={formData.documento ?? ""}
          onChange={e => setFormData({ ...formData, documento: Number(e.target.value) || null })}
        />
      </div>
      <div className={styles.formGroup}>
        <label>Fecha de Nacimiento</label>
        <input type="date" name="fecha_nacimiento" disabled={disabled} value={formData.fecha_nacimiento ?? ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label>Género</label>
        <select name="genero" disabled={disabled} value={formData.genero} onChange={handleChange}>
          <option value="">Seleccionar...</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
      </div>
      <div className={styles.formGroup}>
        <label>Email</label>
        <input type="email" name="email" disabled={disabled} value={formData.email ?? ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label>Teléfono</label>
        <input name="telefono" disabled={disabled} value={formData.telefono ?? ""} onChange={handleChange} />
      </div>
      <div className={styles.formGroup}>
        <label>Dirección</label>
        <input name="direccion" disabled={disabled} value={formData.direccion ?? ""} onChange={handleChange} />
      </div>

      {!disabled && (
        <div className={styles.buttonGroup} style={{ gridColumn: "1 / -1", justifyContent: "flex-end", display: "flex", gap: "10px", marginTop: "15px" }}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>Cancelar</button>
          <button type="button" className={styles.saveButton} onClick={() => onSubmit(formData)} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      )}
    </div>
  );
}