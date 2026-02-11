import { useEffect, useState } from "react";
import { useTorneosActivos } from "../../../hooks/useTorneosActivos";
import { useInscripcionesTorneo } from "../../../hooks/useInscripcionesTorneo";
import { usePlantelActivo } from "../../../hooks/usePlantelActivo";
import { crearPlanillaPartido } from "../../../api/partidos.api";
import Button from "../../../components/ui/button/Button";
import styles from "./PartidoPlanilla.module.css";
import { getPersonasArbitro } from "../../../api/vistas/personas.api";
import type { PersonasArbitro } from "../../../types/vistas";
import { TIPOS_GOL, TIPOS_TARJETA } from "../../../constants/enums";

export default function PartidoPlanilla() {
  const { torneos } = useTorneosActivos();
  const [torneoId, setTorneoId] = useState<number | undefined>(undefined);
  const { inscripciones } = useInscripcionesTorneo(torneoId);

  const [inscripcionLocal, setInscripcionLocal] = useState<any>(null);
  const [inscripcionVisitante, setInscripcionVisitante] = useState<any>(null);

  // Obtenemos los integrantes de ambos equipos
  const { integrantes: plantelLocal } = usePlantelActivo(inscripcionLocal?.id_equipo);
  const { integrantes: plantelVisitante } = usePlantelActivo(inscripcionVisitante?.id_equipo);

  const [arbitrosList, setArbitrosList] = useState<PersonasArbitro[]>([]);
  const [loading, setLoading] = useState(false);

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
  const [goles, setGoles] = useState<any[]>([]);
  const [tarjetas, setTarjetas] = useState<any[]>([]);

  // Carga inicial de árbitros
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
        local: seleccionados.local,
        visitante: seleccionados.visitante
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
        observaciones: t.observaciones || ""
      }))
    };
    console.log("Enviando este payload:", payload);
    try {
      await crearPlanillaPartido(payload);
      alert("Planilla guardada con éxito.");
    } catch (error) {
      console.error(error);
      alert("Error al guardar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Nueva Planilla de Partido</h1>

      {/* CABECERA - DATOS DEL PARTIDO */}
      <section className={styles.section}>
        <div className={styles.gridForm}>
          <select onChange={(e) => handleTorneoChange(e.target.value)}>
            <option value="">Seleccionar Torneo</option>
            {torneos.map((t: any) => (
              <option key={t.id_torneo} value={t.id_torneo}>{t.nombre} - {t.genero} - {t.categoria}</option>
            ))}
          </select>
          <input type="date" value={partidoInfo.fecha} onChange={e => setPartidoInfo({...partidoInfo, fecha: e.target.value})} />
          <input type="time" value={partidoInfo.horario} onChange={e => setPartidoInfo({...partidoInfo, horario: e.target.value})} />
          <input type="number" placeholder="N° Fecha" value={partidoInfo.numero_fecha} onChange={e => setPartidoInfo({...partidoInfo, numero_fecha: e.target.value})} />
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

        <div className={styles.gridForm}>
          <input type="text" placeholder="Juez de Mesa Local" value={partidoInfo.juez_mesa_local} onChange={e => setPartidoInfo({...partidoInfo, juez_mesa_local: e.target.value})} />
          <input type="text" placeholder="Juez de Mesa Visitante" value={partidoInfo.juez_mesa_visitante} onChange={e => setPartidoInfo({...partidoInfo, juez_mesa_visitante: e.target.value})} />
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
          const listaIntegrantes = side === 'local' ? plantelLocal : plantelVisitante;
          const nombreEquipo = side === 'local' ? inscripcionLocal?.nombre_equipo : inscripcionVisitante?.nombre_equipo;

          return (
            <div key={side} className={styles.column}>
              <h3>{nombreEquipo || (side === 'local' ? 'Local' : 'Visitante')}</h3>
              <div className={styles.playerList}>
                {listaIntegrantes.length === 0 && <p className={styles.empty}>Selecciona un equipo</p>}
                {listaIntegrantes.map(p => (
                  <div key={p.id_plantel_integrante} className={styles.playerItem}>
                    <input 
                      type="checkbox" 
                      checked={seleccionados[side].includes(p.id_plantel_integrante)} 
                      onChange={(e) => {
                        const id = p.id_plantel_integrante;
                        setSeleccionados(prev => ({ 
                          ...prev, 
                          [side]: e.target.checked ? [...prev[side], id] : prev[side].filter(x => x !== id) 
                        }));
                      }} 
                    />
                    <span className={styles.playerText}>{p.apellido_persona}, {p.nombre_persona} - {p.documento} - {p.rol_en_plantel} </span>
                    <input 
                      type="radio" 
                      name={`capitan-${side}`} 
                      checked={capitanes[side] === p.id_plantel_integrante} 
                      onChange={() => setCapitanes(prev => ({ ...prev, [side]: p.id_plantel_integrante }))} 
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* SECCIÓN DE INCIDENCIAS (Goles y Tarjetas) */}
      <div className={styles.incidencias}>
        {/* GOLES */}
        <section className={styles.eventSection}>
          <div className={styles.headerRow}>
            <h3>Goles</h3>
            <Button 
              onClick={() => setGoles([...goles, { 
                id_plantel_integrante: "", 
                minuto: "", 
                cuarto: "", 
                referencia_gol: "GJ", 
                es_autogol: false 
              }])} 
              size="sm" 
              variant="outline"
            >
              + Gol
            </Button>
          </div>
          {goles.map((gol, index) => (
            <div key={index} className={styles.eventRow}>
              <select value={gol.id_plantel_integrante} onChange={e => { const n = [...goles]; n[index].id_plantel_integrante = e.target.value; setGoles(n); }}>
                <option value="">Autor</option>
                <optgroup label="Local">
                  {plantelLocal.filter(p => seleccionados.local.includes(p.id_plantel_integrante)).map(p => <option key={p.id_plantel_integrante} value={p.id_plantel_integrante}>{p.apellido_persona}, {p.nombre_persona}</option>)}
                </optgroup>
                <optgroup label="Visitante">
                  {plantelVisitante.filter(p => seleccionados.visitante.includes(p.id_plantel_integrante)).map(p => <option key={p.id_plantel_integrante} value={p.id_plantel_integrante}>{p.apellido_persona}, {p.nombre_persona}</option>)}
                </optgroup>
              </select>
              <select value={gol.referencia_gol} onChange={e => { const n = [...goles]; n[index].referencia_gol = e.target.value; setGoles(n); }}>
                {TIPOS_GOL.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" placeholder="Min" value={gol.minuto} onChange={e => { const n = [...goles]; n[index].minuto = e.target.value; setGoles(n); }} />
              <input type="number" placeholder="4°" value={gol.cuarto} onChange={e => { const n = [...goles]; n[index].cuarto = e.target.value; setGoles(n); }} />
              {/* CHECKBOX DE AUTOGOL */}
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={gol.es_autogol || false} // El || false evita errores si es undefined
                    onChange={e => {
                      const nuevosGoles = [...goles];
                      nuevosGoles[index] = { 
                        ...nuevosGoles[index], 
                        es_autogol: e.target.checked 
                      };
                      setGoles(nuevosGoles);
                    }} 
                  />
                  Autogol
                </label>
              <button className={styles.deleteBtn} onClick={() => eliminarFila(index, 'gol')}>✕</button>
            </div>
          ))}
        </section>

        {/* TARJETAS */}
        <section className={styles.eventSection}>
          <div className={styles.headerRow}>
            <h3>Tarjetas</h3>
            <Button onClick={() => setTarjetas([...tarjetas, { id_plantel_integrante: "", tipo: "AMARILLA", minuto: "", cuarto: "" }])} size="sm" variant="outline">+ Tarjeta</Button>
          </div>
          {tarjetas.map((t, index) => (
            <div key={index} className={styles.eventRow}>
              <select value={t.id_plantel_integrante} onChange={e => { const n = [...tarjetas]; n[index].id_plantel_integrante = e.target.value; setTarjetas(n); }}>
                <option value="">Sancionado</option>
                <optgroup label="Local">
                  {plantelLocal.filter(p => seleccionados.local.includes(p.id_plantel_integrante)).map(p => <option key={p.id_plantel_integrante} value={p.id_plantel_integrante}>{p.apellido_persona}, {p.nombre_persona}</option>)}
                </optgroup>
                <optgroup label="Visitante">
                  {plantelVisitante.filter(p => seleccionados.visitante.includes(p.id_plantel_integrante)).map(p => <option key={p.id_plantel_integrante} value={p.id_plantel_integrante}>{p.apellido_persona}, {p.nombre_persona}</option>)}
                </optgroup>
              </select>
              <select value={t.tipo} onChange={e => { const n = [...tarjetas]; n[index].tipo = e.target.value; setTarjetas(n); }}>
                {TIPOS_TARJETA.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
              <input type="number" placeholder="Min" value={t.minuto} onChange={e => { const n = [...tarjetas]; n[index].minuto = e.target.value; setTarjetas(n); }} />
              <input type="number" placeholder="4°" value={t.cuarto} onChange={e => { const n = [...tarjetas]; n[index].cuarto = e.target.value; setTarjetas(n); }} />
              <button className={styles.deleteBtn} onClick={() => eliminarFila(index, 'tarjeta')}>✕</button>
            </div>
           ))}
        </section>
      </div>

      <section className={styles.section}>
        <textarea 
          placeholder="Observaciones finales del partido..." 
          className={styles.textarea}
          value={partidoInfo.observaciones}
          onChange={e => setPartidoInfo({...partidoInfo, observaciones: e.target.value})}
        />
      </section>

      <footer className={styles.footer}>
        <Button variant="primary" size="md" onClick={enviarPlanilla} disabled={loading}>
          {loading ? "Guardando..." : "Guardar y Finalizar Partido"}
        </Button>
      </footer>
    </div>
  );
}