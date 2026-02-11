import { useState } from "react";
import { useTorneosActivos } from "../../../hooks/useTorneosActivos";
import { useInscripcionesTorneo } from "../../../hooks/useInscripcionesTorneo";
import { usePlantelActivo } from "../../../hooks/usePlantelActivo";
import {crearPlanillaPartido } from "../../../api/partidos.api"; // Asumiendo esta ruta
import Button from "../../../components/ui/button/Button";
import styles from "./PartidoPlanilla.module.css";

import { TIPOS_GOL, TIPOS_TARJETA } from "../../../constants/enums"; 



export default function PartidoPlanilla() {
  const { torneos } = useTorneosActivos();
  const [torneoId, setTorneoId] = useState<number | undefined>(undefined);
  const { inscripciones } = useInscripcionesTorneo(torneoId);

  const [inscripcionLocal, setInscripcionLocal] = useState<any>(null);
  const [inscripcionVisitante, setInscripcionVisitante] = useState<any>(null);

  const { integrantes: plantelLocal } = usePlantelActivo(inscripcionLocal?.id_equipo);
  const { integrantes: plantelVisitante } = usePlantelActivo(inscripcionVisitante?.id_equipo);

  const [loading, setLoading] = useState(false);
  const [partidoInfo, setPartidoInfo] = useState({
    fecha: new Date().toISOString().split("T")[0],
    horario: "17:00", // Valor por defecto para el tipo 'time'
    ubicacion: "",
    numero_fecha: "",
  });

  const eliminarFila = (index: number, tipo: 'gol' | 'tarjeta') => {
    if (tipo === 'gol') {
      setGoles(goles.filter((_, i) => i !== index));
    } else {
      setTarjetas(tarjetas.filter((_, i) => i !== index));
    }
  };

  const [seleccionados, setSeleccionados] = useState<{ local: number[], visitante: number[] }>({
    local: [], visitante: []
  });

  const [capitanes, setCapitanes] = useState({ local: 0, visitante: 0 });
  const [goles, setGoles] = useState<any[]>([]);
  const [tarjetas, setTarjetas] = useState<any[]>([]);

  // --- HANDLERS ---

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
    } else {
      setInscripcionVisitante(insc);
      setSeleccionados(prev => ({ ...prev, visitante: [] }));
    }
  };

  const enviarPlanilla = async () => {
    if (!torneoId || !inscripcionLocal || !inscripcionVisitante) {
      alert("Faltan datos básicos del partido");
      return;
    }

    setLoading(true);

    // Convertimos a null si es 0 o está vacío
    const numFechaVal = Number(partidoInfo.numero_fecha);
    const numero_fecha = numFechaVal > 0 ? numFechaVal : null;

    const payload = {
      partido: {
        id_torneo: torneoId,
        id_fase: null,
        fecha: partidoInfo.fecha,
        horario: `${partidoInfo.horario}:00`,
        id_inscripcion_local: inscripcionLocal.id_inscripcion,
        id_inscripcion_visitante: inscripcionVisitante.id_inscripcion,
        id_arbitro1: null,
        id_arbitro2: null,
        id_capitan_local: capitanes.local || null,
        id_capitan_visitante: capitanes.visitante || null,
        ubicacion: partidoInfo.ubicacion,
        observaciones: "",
        numero_fecha: numero_fecha // Enviará el número o null
      },
      participantes: {
        local: seleccionados.local,
        visitante: seleccionados.visitante
      },
      // Filtramos para no enviar filas que el usuario dejó a medias
      goles: goles
        .filter(g => g.id_plantel_integrante !== "") 
        .map(g => ({
          id_plantel_integrante: Number(g.id_plantel_integrante),
          minuto: Number(g.minuto) || 0,
          cuarto: null,
          referencia_gol: g.referencia_gol,
          es_autogol: false
        })),
      tarjetas: tarjetas
        .filter(t => t.id_plantel_integrante !== "")
        .map(t => ({
          id_plantel_integrante: Number(t.id_plantel_integrante),
          tipo: t.tipo,
          minuto: Number(t.minuto) || 0,
          cuarto: null,
          observaciones: t.observaciones || ""
        }))
    };

    try {
      await crearPlanillaPartido(payload);
      alert("Planilla guardada con éxito.");
    } catch (error) {
      console.error(error);
      alert("Error al guardar. Verifica los logs del servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Nueva Planilla de Partido</h1>

      {/* CABECERA */}
      <section className={styles.section}>
        <div className={styles.gridForm}>
          <select onChange={(e) => handleTorneoChange(e.target.value)}>
            <option value="">Seleccionar Torneo</option>
            {torneos.map((t: any) => (
              <option key={t.id_torneo} value={t.id_torneo}>{t.nombre}</option>
            ))}
          </select>
          <input type="date" value={partidoInfo.fecha} onChange={e => setPartidoInfo({...partidoInfo, fecha: e.target.value})} />
          <input type="time" value={partidoInfo.horario} onChange={e => setPartidoInfo({...partidoInfo, horario: e.target.value})} />
          <input type="number" placeholder="N° Fecha" value={partidoInfo.numero_fecha} onChange={e => setPartidoInfo({...partidoInfo, numero_fecha: e.target.value})} />
          <input type="text" placeholder="Cancha/Ubicación" value={partidoInfo.ubicacion} onChange={e => setPartidoInfo({...partidoInfo, ubicacion: e.target.value})} />
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

      {/* JUGADORES Y CAPITANES */}
      <div className={styles.columns}>
        {(['local', 'visitante'] as const).map(side => {
          const lista = side === 'local' ? plantelLocal : plantelVisitante;
          const insc = side === 'local' ? inscripcionLocal : inscripcionVisitante;
          return (
            <div key={side} className={styles.column}>
              <h3>{insc?.nombre_equipo || (side === 'local' ? 'Locales' : 'Visitantes')}</h3>
              <p className={styles.subtitle}>Juega | Cap</p>
              <div className={styles.playerList}>
                {lista.map(p => (
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
                    <span className={styles.playerText}>
                      {p.numero_camiseta} {p.apellido_persona}
                    </span>
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

      {/* INCIDENCIAS */}
      <div className={styles.incidencias}>
        
        {/* SECCIÓN GOLES */}
        <section className={styles.eventSection}>
          <div className={styles.headerRow}>
            <h3>Goles</h3>
            <Button 
              onClick={() => setGoles([...goles, { id_plantel_integrante: "", minuto: "", referencia_gol: "GJ" }])} 
              size="sm" 
              variant="outline"
            >
              + Gol
            </Button>
          </div>
          {goles.map((gol, index) => (
            <div key={index} className={styles.eventRow}>
              {/* SELECT DEL JUGADOR (AUTOR) */}
              <select 
                value={gol.id_plantel_integrante} 
                onChange={e => {
                  const newGoles = [...goles];
                  newGoles[index].id_plantel_integrante = e.target.value;
                  setGoles(newGoles);
                }}
              >
                <option value="">Seleccionar Autor</option>
                <optgroup label={inscripcionLocal?.nombre_equipo || "Local"}>
                  {plantelLocal
                    .filter(p => seleccionados.local.includes(p.id_plantel_integrante))
                    .map(p => <option key={p.id_plantel_integrante} value={p.id_plantel_integrante}>{p.apellido_persona}</option>)
                  }
                </optgroup>
                <optgroup label={inscripcionVisitante?.nombre_equipo || "Visitante"}>
                  {plantelVisitante
                    .filter(p => seleccionados.visitante.includes(p.id_plantel_integrante))
                    .map(p => <option key={p.id_plantel_integrante} value={p.id_plantel_integrante}>{p.apellido_persona}</option>)
                  }
                </optgroup>
              </select>

              {/* SELECT DEL TIPO DE GOL (ENUM) */}
              <select 
                value={gol.referencia_gol} 
                onChange={e => {
                  const newGoles = [...goles];
                  newGoles[index].referencia_gol = e.target.value;
                  setGoles(newGoles);
                }}
              >
                {TIPOS_GOL.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>

              <input 
                type="number" 
                placeholder="Min" 
                value={gol.minuto} 
                onChange={e => {
                  const newGoles = [...goles];
                  newGoles[index].minuto = e.target.value;
                  setGoles(newGoles);
                }} 
              />
              <button 
                className={styles.deleteBtn} 
                onClick={() => eliminarFila(index, 'gol')}
              >
                ✕
              </button>
            </div>
          ))}
        </section>

        {/* SECCIÓN TARJETAS */}
        <section className={styles.eventSection}>
          <div className={styles.headerRow}>
            <h3>Tarjetas</h3>
            <Button 
              onClick={() => setTarjetas([...tarjetas, { id_plantel_integrante: "", tipo: "AMARILLA", minuto: "" }])} 
              size="sm" 
              variant="outline"
            >
              + Tarjeta
            </Button>
          </div>
          {tarjetas.map((t, index) => (
            <div key={index} className={styles.eventRow}>
              {/* SELECT DEL JUGADOR (SANCIONADO) */}
              <select 
                value={t.id_plantel_integrante} 
                onChange={e => {
                  const newT = [...tarjetas];
                  newT[index].id_plantel_integrante = e.target.value;
                  setTarjetas(newT);
                }}
              >
                <option value="">Seleccionar Jugador</option>
                <optgroup label={inscripcionLocal?.nombre_equipo || "Local"}>
                  {plantelLocal
                    .filter(p => seleccionados.local.includes(p.id_plantel_integrante))
                    .map(p => <option key={p.id_plantel_integrante} value={p.id_plantel_integrante}>{p.apellido_persona}</option>)
                  }
                </optgroup>
                <optgroup label={inscripcionVisitante?.nombre_equipo || "Visitante"}>
                  {plantelVisitante
                    .filter(p => seleccionados.visitante.includes(p.id_plantel_integrante))
                    .map(p => <option key={p.id_plantel_integrante} value={p.id_plantel_integrante}>{p.apellido_persona}</option>)
                  }
                </optgroup>
              </select>

              {/* SELECT DEL TIPO DE TARJETA (ENUM) */}
              <select 
                value={t.tipo} 
                onChange={e => {
                  const newT = [...tarjetas];
                  newT[index].tipo = e.target.value;
                  setTarjetas(newT);
                }}
              >
                {TIPOS_TARJETA.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo === 'AMARILLA' ? '🟨 AMARILLA' : tipo === 'ROJA' ? '🟥 ROJA' : '🟩 VERDE'}
                  </option>
                ))}
              </select>

              <input 
                type="number" 
                placeholder="Min" 
                value={t.minuto} 
                onChange={e => {
                  const newT = [...tarjetas];
                  newT[index].minuto = e.target.value;
                  setTarjetas(newT);
                }} 
              />

              <button 
                className={styles.deleteBtn} 
                onClick={() => eliminarFila(index, 'gol')}
              >
                ✕
              </button>
            </div>
           ))}
        </section>
      </div>

      <footer className={styles.footer}>
        <Button 
          variant="primary" 
          size="md" 
          onClick={enviarPlanilla}
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar y Finalizar Partido"}
        </Button>
      </footer>
    </div>
  );
}