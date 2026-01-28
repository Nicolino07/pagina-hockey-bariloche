type Props = {
  inscripciones: any[]
  onBaja: (idEquipo: number) => void
}

export default function InscripcionesTorneoLista({
  inscripciones,
  onBaja,
}: Props) {
  return (
    <ul>
      {inscripciones.map((i) => (
        <li key={i.id_inscripcion}>
          <strong>{i.nombre_equipo}</strong>
          <div>{i.nombre_club}</div>
          <small>
            {i.genero_equipo} – {i.categoria_equipo}
          </small>
          <br />
          <button onClick={() => onBaja(i.id_equipo)}>
            Dar de baja
          </button>
        </li>
      ))}
    </ul>
  ) 
}
