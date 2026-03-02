import { useEffect, useState } from "react"
import type { Club, ClubCreate } from "../../types/club"

type Props = {
  open: boolean
  club: Club | null
  onClose: () => void
  onSave: (data: ClubCreate) => void
}

export default function ClubModal({ open, club, onClose, onSave }: Props) {
  const [form, setForm] = useState<ClubCreate>({
    nombre: "", provincia: "", ciudad: "", direccion: "", telefono: "", email: "",
  })

  useEffect(() => {
    if (open && club) {
      setForm({
        nombre: club.nombre,
        provincia: club.provincia,
        ciudad: club.ciudad,
        direccion: club.direccion ?? "",
        telefono: club.telefono ?? "",
        email: club.email ?? "",
      })
    }
  }, [club, open])

  // SI NO ESTÁ ABIERTO, NO RENDERIZA
  if (!open) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(255, 0, 0, 0.5)', // FONDO ROJO SEMITRANSPARENTE PARA PROBAR
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999, // MUY ALTO
    }} onClick={onClose}>
      
      <div style={{
        backgroundColor: '#1e1e1e',
        color: 'white',
        padding: '40px',
        borderRadius: '10px',
        border: '5px solid yellow', // BORDE AMARILLO PARA VERLO
        width: '400px',
      }} onClick={e => e.stopPropagation()}>
        
        <h2 style={{ color: 'white' }}>PROBANDO MODAL</h2>
        
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
          <input 
            style={{ width: '100%', padding: '10px', marginBottom: '10px', color: 'black' }}
            value={form.nombre}
            onChange={e => setForm({...form, nombre: e.target.value})}
            placeholder="Nombre"
          />
          <button type="submit" style={{ padding: '10px', background: 'white', color: 'black' }}>
            GUARDAR
          </button>
          <button type="button" onClick={onClose} style={{ marginLeft: '10px', color: 'white' }}>
            CERRAR
          </button>
        </form>
      </div>
    </div>
  )
}