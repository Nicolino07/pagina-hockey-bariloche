import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTorneosActivos } from "../../../hooks/useTorneosActivos";
import { useInscripcionesTorneo } from "../../../hooks/useInscripcionesTorneo";
import { usePlantelActivo } from "../../../hooks/usePlantelActivo";
import { crearPlanillaPartido } from "../../../api/partidos.api";
import Button from "../../../components/ui/button/Button";
import styles from "./PartidoPlanilla.module.css";
import { getPersonasArbitro } from "../../../api/vistas/personas.api";
import type { PersonasArbitro, PlantelActivoIntegrante } from "../../../types/vistas";
import { TIPOS_GOL, TIPOS_TARJETA } from "../../../constants/enums";

// Tipado para evitar el "rojo" en las incidencias
interface Gol {
  id_plantel_integrante: string | number;
  minuto: string | number;
  cuarto: string | number;
  referencia_gol: string;
  es_autogol: boolean;
}

interface Tarjeta {
  id_plantel_integrante: string | number;
  tipo: string;
  minuto: string | number;
  cuarto: string | number;
}

export default function PartidoPlanilla() {
  const navigate = useNavigate();
  const { torneos } = useTorneosActivos();
  const [torneoId, setTorneoId] = useState<number | undefined>(undefined);
  const { inscripciones } = useInscripcionesTorneo(torneoId);

  const [inscripcionLocal, setInscripcionLocal] = useState<any>(null);
  const [inscripcionVisitante, setInscripcionVisitante] = useState<any>(null);

  // Casting de los integrantes para asegurar que id_plantel_integrante sea reconocido
  const { integrantes: rawLocal } = usePlantelActivo(inscripcionLocal?.id_equipo);
  const { integrantes: rawVisitante } = usePlantelActivo(inscripcionVisitante?.id_equipo);
  
  const plantelLocal = (rawLocal || []) as PlantelActivoIntegrante[];
  const plantelVisitante = (rawVisitante || []) as PlantelActivoIntegrante[];

  const [arbitrosList, setArbitrosList] = useState<PersonasArbitro[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [partidoInfo, setPartidoInfo] = useState({
    fecha: new Date().toISOString().split("T")[0],
    horario: "17:00",
    ubicacion: "",
    numero_fecha: "",
    id_arbitro1: "",
    id_arbitro2: "",
    juez_mesa_local: "",
    juez_mesa_visitante: "",
    observaciones: ""
  });

  const [seleccionados, setSeleccionados] = useState<{ local: number[], visitante: number[] }>({
    local: [], visitante: []
  });

  const [capitanes, setCapitanes] = useState({ local: 0, visitante: 0 });
  const [goles, setGoles] = useState<Gol[]>([]);
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [camisetas, setCamisetas] = useState<Record<number, string>>({});

  useEffect(() => {
    const cargarArbitros = async () => {
      try {
        const data = await getPersonasArbitro();
        setArbitrosList(data);
      } catch (error) {
        console.error("Error al cargar árbitros:", error);
      }
    };
    cargarArbitros();
  }, []);

  // --- HANDLERS (Iguales a tu lógica original) ---

  const handleTorneoChange = (id: string) => {
    setTorneoId(id ? Number(id) : undefined);
    setInscripcionLocal(null);
    setInscripcionVisitante(null);
    setSeleccionados({ local: [], visitante: [] });
    setGoles([]);
    setTarjetas([]);
  };

  const handleEquipoChange = (idInscripcion: string, side: 'local' | 'visitante') => {
    const idNum = Number(idInscripcion);
    const opuesto = side === 'local' ? inscripcionVisitante : inscripcionLocal;
    if (opuesto && opuesto.id_inscripcion === idNum) {
      alert("¡Error! Un equipo no puede enfrentarse a sí mismo.");
      return;
    }
    const insc = inscripciones.find(i => i.id_inscripcion === idNum);
    if (side === 'local') {
      setInscripcionLocal(insc);
      setSeleccionados(prev => ({ ...prev, local: [] }));
      setCapitanes(prev => ({ ...prev, local: 0 }));
    } else {
      setInscripcionVisitante(insc);
      setSeleccionados(prev => ({ ...prev, visitante: [] }));
      setCapitanes(prev => ({ ...prev, visitante: 0 }));
    }
  };

  const eliminarFila = (index: number, tipo: 'gol' | 'tarjeta') => {
    if (tipo === 'gol') setGoles(goles.filter((_, i) => i !== index));
    else setTarjetas(tarjetas.filter((_, i) => i !== index));
  };

  const enviarPlanilla = async () => {
    if (!torneoId || !inscripcionLocal || !inscripcionVisitante) {
      alert("Faltan datos básicos del partido");
      return;
    }
    setLoading(true);
    const numFechaVal = Number(partidoInfo.numero_fecha);
    const payload = {
      partido: {
        id_torneo: torneoId,
        id_fase: null,
        fecha: partidoInfo.fecha,
        horario: `${partidoInfo.horario}:00`,
        id_inscripcion_local: inscripcionLocal.id_inscripcion,
        id_inscripcion_visitante: inscripcionVisitante.id_inscripcion,
        id_arbitro1: Number(partidoInfo.id_arbitro1) || null,
        id_arbitro2: Number(partidoInfo.id_arbitro2) || null,
        id_capitan_local: capitanes.local || null,
        id_capitan_visitante: capitanes.visitante || null,
        juez_mesa_local: partidoInfo.juez_mesa_local || null,
        juez_mesa_visitante: partidoInfo.juez_mesa_visitante || null,
        ubicacion: partidoInfo.ubicacion,
        observaciones: partidoInfo.observaciones,
        numero_fecha: numFechaVal > 0 ? numFechaVal : null
      },
      participantes: {
        local: seleccionados.local.map(id => ({ id_plantel_integrante: id, numero_camiseta: camisetas[id] || null })),
        visitante: seleccionados.visitante.map(id => ({ id_plantel_integrante: id, numero_camiseta: camisetas[id] || null }))
      },
      goles: goles.filter(g => g.id_plantel_integrante !== "").map(g => ({
        id_plantel_integrante: Number(g.id_plantel_integrante),
        minuto: Number(g.minuto) || 0,
        cuarto: Number(g.cuarto) || null,
        referencia_gol: g.referencia_gol,
        es_autogol: Boolean(g.es_autogol)
      })),
      tarjetas: tarjetas.filter(t => t.id_plantel_integrante !== "").map(t => ({
        id_plantel_integrante: Number(t.id_plantel_integrante),
        tipo: t.tipo,
        minuto: Number(t.minuto) || 0,
        cuarto: Number(t.cuarto) || null,
        observaciones: ""
      }))
    };
    try {
      await crearPlanillaPartido(payload);
      alert("Planilla guardada con éxito.");
      navigate(-1);
    } catch (error) {
      console.error(error);
      alert("Error al guardar.");
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const getPlayerName = (id: any) => {
    const p = [...plantelLocal, ...plantelVisitante].find(x => x.id_plantel_integrante === Number(id));
    return p ? `${p.apellido_persona}, ${p.nombre_persona}` : "Desconocido";
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerPage}>
        <Button variant="primary" size="sm" onClick={() => navigate(-1)}>← Volver</Button>
        <h1>Nueva Planilla de Partido</h1>
      </div>

      {/* DATOS DEL PARTIDO */}
      <section className={styles.section}>
        <div className={styles.gridForm}>
          <select onChange={(e) => handleTorneoChange(e.target.value)}>
            <option value="">Torneo</option>
            {torneos.map((t: any) => (
              <option key={t.id_torneo} value={t.id_torneo}>{t.nombre} - {t.genero} - {t.categoria}</option>
            ))}
          </select>
          <input type="number" placeholder="N° Fecha" value={partidoInfo.numero_fecha} onChange={e => setPartidoInfo({...partidoInfo, numero_fecha: e.target.value})} />
        </div>
        <div className={styles.gridForm}>
          <input type="date" value={partidoInfo.fecha} onChange={e => setPartidoInfo({...partidoInfo, fecha: e.target.value})} />
          <input type="time" value={partidoInfo.horario} onChange={e => setPartidoInfo({...partidoInfo, horario: e.target.value})} />
        </div>
        <div className={styles.gridForm}>
          <select value={partidoInfo.id_arbitro1} onChange={e => setPartidoInfo({...partidoInfo, id_arbitro1: e.target.value})}>
            <option value="">Árbitro 1</option>
            {arbitrosList.map(a => <option key={a.id_persona_rol} value={a.id_persona_rol}>{a.apellido}, {a.nombre}</option>)}
          </select>
          <select value={partidoInfo.id_arbitro2} onChange={e => setPartidoInfo({...partidoInfo, id_arbitro2: e.target.value})}>
            <option value="">Árbitro 2</option>
            {arbitrosList.map(a => <option key={a.id_persona_rol} value={a.id_persona_rol}>{a.apellido}, {a.nombre}</option>)}
          </select>
          <input type="text" placeholder="Ubicación" value={partidoInfo.ubicacion} onChange={e => setPartidoInfo({...partidoInfo, ubicacion: e.target.value})} />
        </div>
        {/* Jueces de mesa */}
        <div className={styles.gridForm}>
          <input 
            type="text" 
            placeholder="Juez de Mesa Local" 
            value={partidoInfo.juez_mesa_local} 
            onChange={e => setPartidoInfo({...partidoInfo, juez_mesa_local: e.target.value})} 
          />
          <input 
            type="text" 
            placeholder="Juez de Mesa Visitante" 
            value={partidoInfo.juez_mesa_visitante} 
            onChange={e => setPartidoInfo({...partidoInfo, juez_mesa_visitante: e.target.value})} 
          />
        </div>

        <div className={styles.gridForm}>
          <select disabled={!torneoId} value={inscripcionLocal?.id_inscripcion || ""} onChange={(e) => handleEquipoChange(e.target.value, 'local')}>
            <option value="">Equipo Local</option>
            {inscripciones.map(i => <option key={i.id_inscripcion} value={i.id_inscripcion}>{i.nombre_equipo}</option>)}
          </select>
          <div className={styles.vs}>VS</div>
          <select disabled={!torneoId} value={inscripcionVisitante?.id_inscripcion || ""} onChange={(e) => handleEquipoChange(e.target.value, 'visitante')}>
            <option value="">Equipo Visitante</option>
            {inscripciones.map(i => <option key={i.id_inscripcion} value={i.id_inscripcion}>{i.nombre_equipo}</option>)}
          </select>
        </div>
      </section>

      {/* COLUMNAS DE JUGADORES */}
      <div className={styles.columns}>
        {(['local', 'visitante'] as const).map(side => {
          const lista = side === 'local' ? plantelLocal : plantelVisitante;
          const equipo = side === 'local' ? inscripcionLocal?.nombre_equipo : inscripcionVisitante?.nombre_equipo;
          return (
            <div key={side} className={styles.column}>
              <h3>{equipo || (side === 'local' ? 'Local' : 'Visitante')}</h3>

              <div className={styles.playerHeader}>
                <span className={styles.colAsistencia}>Asist.</span>
                <span className={styles.colNumero}>#</span>
                <span className={styles.colNombre}>Jugador</span>
                <span className={styles.colCapitan}>Cap</span>
              </div>
              <div className={styles.playerList}>
                {lista.map(p => {
                  const pid = p.id_plantel_integrante as number;
                  // Verificamos si es Jugador (asumiendo que el string es "JUGADOR")
                  const esJugador = p.rol_en_plantel === "JUGADOR"; 

                  return (
                    <div key={pid} className={styles.playerItem}>
                      <input 
                        type="checkbox" 
                        checked={seleccionados[side].includes(pid)} 
                        onChange={(e) => setSeleccionados(prev => ({ 
                          ...prev, 
                          [side]: e.target.checked ? [...prev[side], pid] : prev[side].filter(x => x !== pid) 
                        }))} 
                      />
                      
                      {/* Renderizado condicional del campo camiseta */}
                      {esJugador ? (
                        <input 
                          type="number" 
                          placeholder="#" 
                          className={styles.inputCamiseta} 
                          value={camisetas[pid] || ""} 
                          onChange={(e) => setCamisetas({ ...camisetas, [pid]: e.target.value })} 
                          disabled={!seleccionados[side].includes(pid)} 
                        />
                      ) : (
                        <div className={styles.inputCamisetaPlaceholder} /> // Un div vacío para mantener la alineación
                      )}

                      <span className={styles.playerText}>
                        {p.apellido_persona}, {p.nombre_persona}
                        <span className={styles.playerRole}>
                          {p.rol_en_plantel}
                        </span>
                      </span>

                      {/* El capitán también suele ser solo para jugadores, podrías ocultarlo igual si quisieras */}
                      <input
                        type="radio"
                        name={`capitan-${side}`}
                        checked={capitanes[side] === pid}
                        disabled={!seleccionados[side].includes(pid) || !esJugador} // Bloqueado si no es jugador
                        onChange={() => setCapitanes(prev => ({ ...prev, [side]: pid }))}
                      />
                    </div>
                  );
                })}
              </div>
                            
              
            </div>
          );
        })}
      </div>

      {/* INCIDENCIAS */}
      <div className={styles.incidencias}>
        <section className={styles.eventSection}>
          <div className={styles.headerRow}>
            <h3>Goles</h3>
            <Button onClick={() => setGoles([...goles, { id_plantel_integrante: "", minuto: "", cuarto: "", referencia_gol: "GJ", es_autogol: false }])} size="sm" variant="secondary">+ Gol</Button>
          </div>
          {goles.map((gol, index) => (
            <div key={index} className={styles.eventRow}>
              <select value={String(gol.id_plantel_integrante)} onChange={e => { const n = [...goles]; n[index].id_plantel_integrante = e.target.value; setGoles(n); }}>
                <option value="">Autor</option>
                <optgroup label={inscripcionLocal?.nombre_equipo || "Local"}>
                  {plantelLocal
                  .filter(p => 
                    seleccionados.local.includes(p.id_plantel_integrante as number) &&
                    p.rol_en_plantel === "JUGADOR").map(p => (
                    <option key={p.id_plantel_integrante} value={String(p.id_plantel_integrante)}>
                      {camisetas[p.id_plantel_integrante as number] ? `#${camisetas[p.id_plantel_integrante as number]} - ` : ''}{p.apellido_persona}, {p.nombre_persona}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={inscripcionVisitante?.nombre_equipo || "Visitante"}>
                  {plantelVisitante.filter(p => 
                    seleccionados.visitante.includes(p.id_plantel_integrante as number) &&
                    p.rol_en_plantel === "JUGADOR").map(p => (
                    <option key={p.id_plantel_integrante} value={String(p.id_plantel_integrante)}>
                      {camisetas[p.id_plantel_integrante as number] ? `#${camisetas[p.id_plantel_integrante as number]} - ` : ''}{p.apellido_persona}, {p.nombre_persona}
                    </option>
                  ))}
                </optgroup>
              </select>
              <select value={gol.referencia_gol} onChange={e => { const n = [...goles]; n[index].referencia_gol = e.target.value; setGoles(n); }}>{TIPOS_GOL.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <input type="number" placeholder="Min" value={gol.minuto} onChange={e => { const n = [...goles]; n[index].minuto = e.target.value; setGoles(n); }} />
              <input type="number" placeholder="4°" value={gol.cuarto} onChange={e => { const n = [...goles]; n[index].cuarto = e.target.value; setGoles(n); }} />
              <label className={styles.checkboxLabel}><input type="checkbox" checked={gol.es_autogol} onChange={e => { const n = [...goles]; n[index].es_autogol = e.target.checked; setGoles(n); }} /> Autogol</label>
              <button className={styles.deleteBtn} onClick={() => eliminarFila(index, 'gol')}>✕</button>
            </div>
          ))}
        </section>

        <section className={styles.eventSection}>
          <div className={styles.headerRow}>
            <h3>Tarjetas</h3>
            <Button onClick={() => setTarjetas([...tarjetas, { id_plantel_integrante: "", tipo: "VERDE", minuto: "", cuarto: "" }])} size="sm" variant="secondary">+ Tarjeta</Button>
          </div>
          {tarjetas.map((t, index) => (
            <div key={index} className={styles.eventRow}>
              <select value={String(t.id_plantel_integrante)} onChange={e => { const n = [...tarjetas]; n[index].id_plantel_integrante = e.target.value; setTarjetas(n); }}>
                <option value="">Sancionado</option>
                <optgroup label={inscripcionLocal?.nombre_equipo || "Local"}>
                  {plantelLocal.filter(p => seleccionados.local.includes(p.id_plantel_integrante as number)).map(p => (
                    <option key={p.id_plantel_integrante} value={String(p.id_plantel_integrante)}>
                      {camisetas[p.id_plantel_integrante as number] ? `#${camisetas[p.id_plantel_integrante as number]} - ` : ''}{p.apellido_persona}, {p.nombre_persona}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={inscripcionVisitante?.nombre_equipo || "Visitante"}>
                  {plantelVisitante.filter(p => seleccionados.visitante.includes(p.id_plantel_integrante as number)).map(p => (
                    <option key={p.id_plantel_integrante} value={String(p.id_plantel_integrante)}>
                      {camisetas[p.id_plantel_integrante as number] ? `#${camisetas[p.id_plantel_integrante as number]} - ` : ''}{p.apellido_persona}, {p.nombre_persona}
                    </option>
                  ))}
                </optgroup>
              </select>
              <select value={t.tipo} onChange={e => { const n = [...tarjetas]; n[index].tipo = e.target.value; setTarjetas(n); }}>{TIPOS_TARJETA.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}</select>
              <input type="number" placeholder="Min" value={t.minuto} onChange={e => { const n = [...tarjetas]; n[index].minuto = e.target.value; setTarjetas(n); }} />
              <input type="number" placeholder="4°" value={t.cuarto} onChange={e => { const n = [...tarjetas]; n[index].cuarto = e.target.value; setTarjetas(n); }} />
              <button className={styles.deleteBtn} onClick={() => eliminarFila(index, 'tarjeta')}>✕</button>
            </div>
          ))}
        </section>
      </div>

      <footer className={styles.footer}>
        <Button variant="primary" size="md" onClick={() => setShowModal(true)}>Revisar y Guardar Partido</Button>
      </footer>

     
    {/* MODAL DE RESUMEN */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Resumen de Planilla</h2>
            
            <div className={styles.resumenGrid}>
              {/* DATOS GENERALES */}
              <div className={styles.resumenHeader}>
                <p><strong>Torneo:</strong> {torneos.find((t: any) => t.id_torneo === torneoId)?.nombre}</p>
                <p><strong>Partido:</strong> {inscripcionLocal?.nombre_equipo} vs {inscripcionVisitante?.nombre_equipo}</p>
                <p><strong>Fecha/Hora:</strong> {partidoInfo.fecha} - {partidoInfo.horario} (Fecha {partidoInfo.numero_fecha})</p>
                <p><strong>Ubicación:</strong> {partidoInfo.ubicacion || 'No definida'}</p>
              </div>

              <hr className={styles.divider} />

              {/* AUTORIDADES DEL PARTIDO */}
              <div className={styles.resumenAutoridades}>
                <h4>Autoridades</h4>
                <div className={styles.autoridadesGrid}>
                  <div>
                    <p><strong>Árbitro 1:</strong> {arbitrosList.find(a => a.id_persona_rol === Number(partidoInfo.id_arbitro1))?.apellido || 'No asignado'}</p>
                    <p><strong>Árbitro 2:</strong> {arbitrosList.find(a => a.id_persona_rol === Number(partidoInfo.id_arbitro2))?.apellido || 'No asignado'}</p>
                    {partidoInfo.id_arbitro1 && partidoInfo.id_arbitro1 === partidoInfo.id_arbitro2 && (
                      <span className={styles.errorText}>⚠️ Los árbitros no pueden ser iguales</span>
                    )}
                  </div>
                  <div>
                    <p><strong>Mesa Local:</strong> {partidoInfo.juez_mesa_local || 'N/A'}</p>
                    <p><strong>Mesa Visitante:</strong> {partidoInfo.juez_mesa_visitante || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <hr className={styles.divider} />

              {/* JUGADORES QUE ASISTIERON */}
              <div className={styles.resumenAsistencia}>
                <h4>Asistencia de Jugadores</h4>
                <div className={styles.asistenciaGrid}>
                  <div>
                    <h5>{inscripcionLocal?.nombre_equipo} ({seleccionados.local.length})</h5>
                    <ul>
                      {seleccionados.local.map(id => (
                        <li key={id}>
                          <strong>#{camisetas[id] || '--'}</strong> {getPlayerName(id)} {capitanes.local === id ? ' (C)' : ''}
                        </li>
                      ))}
                    </ul>
                    {capitanes.local === 0 && <span className={styles.errorText}>⚠️ Falta capitán local</span>}
                  </div>
                  <div>
                    <h5>{inscripcionVisitante?.nombre_equipo} ({seleccionados.visitante.length})</h5>
                    <ul>
                      {seleccionados.visitante.map(id => (
                        <li key={id}>
                          <strong>#{camisetas[id] || '--'}</strong> {getPlayerName(id)} {capitanes.visitante === id ? ' (C)' : ''}
                        </li>
                      ))}
                    </ul>
                    {capitanes.visitante === 0 && <span className={styles.errorText}>⚠️ Falta capitán visitante</span>}
                  </div>
                </div>
              </div>

              <hr className={styles.divider} />

              {/* INCIDENCIAS (Goles y Tarjetas) */}
              <div className={styles.resumenListas}>
                <div>
                  <h4>Goles</h4>
                  {goles.length === 0 ? <p className={styles.emptyResumen}>Sin goles registrados</p> : goles.map((g, i) => (
                    <p key={i}>• Min {g.minuto}: {getPlayerName(g.id_plantel_integrante)} {g.es_autogol ? '(Autogol)' : ''}</p>
                  ))}
                </div>
                <div>
                  <h4>Tarjetas</h4>
                  {tarjetas.length === 0 ? <p className={styles.emptyResumen}>Sin tarjetas registradas</p> : tarjetas.map((t, i) => (
                    <p key={i}>• {t.tipo} - {getPlayerName(t.id_plantel_integrante)} (Min {t.minuto})</p>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Seguir editando
              </Button>
              <Button 
                variant="primary" 
                onClick={enviarPlanilla} 
                disabled={loading || (partidoInfo.id_arbitro1 === partidoInfo.id_arbitro2 && partidoInfo.id_arbitro1 !== "")}
              >
                {loading ? "Confirmando..." : "Confirmar y Finalizar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}