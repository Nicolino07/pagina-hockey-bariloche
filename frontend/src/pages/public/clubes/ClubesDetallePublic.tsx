import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getClubById } from "../../../api/clubes.api";
import { getEquiposByClub } from "../../../api/equipos.api";
import { obtenerPosiciones } from "../../../api/vistas/posiciones.api";
import { getHistorialPorEquipo } from "../../../api/partidos.api";
import type { Club } from "../../../types/club";
import type { Equipo } from "../../../types/equipo";
import type { FilaPosiciones } from "../../../types/vistas";
import { getPlantelActivoByEquipo, getIntegrantesByPlantel } from "../../../api/planteles.api";
import type { PlantelIntegrante } from "../../../types/plantelIntegrante";

import styles from "./ClubesDetallePublic.module.css";


export default function ClubesDetallePublic() {
  const { id_club } = useParams<{ id_club: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Equipo | null>(null);
  const [posiciones, setPosiciones] = useState<FilaPosiciones[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [integrantes, setIntegrantes] = useState<PlantelIntegrante[]>([]);

  useEffect(() => {
    if (!equipoSeleccionado) return;

    // Cargar Partidos
    getHistorialPorEquipo(equipoSeleccionado.id_equipo)
      .then(data => setPartidos(data))
      .catch(() => setPartidos([]));

    // Cargar Plantel Activo e Integrantes
    getPlantelActivoByEquipo(equipoSeleccionado.id_equipo)
      .then(plantel => {
        if (plantel) {
          return getIntegrantesByPlantel(plantel.id_plantel);
        }
        return [];
      })
      .then(data => setIntegrantes(data))
      .catch(() => setIntegrantes([]));
  }, [equipoSeleccionado]);



  // Utilidad para parsear los strings de la vista SQL
  const parsearGoleadores = (listaStr: string) => {
    if (!listaStr) return [];
    return listaStr.split('; ').map(item => {
      const [apellido, nombre, min, cuarto] = item.split('|');
      return { apellido, nombre: nombre[0], min, cuarto }; // Retorna inicial del nombre
    });
  };

  useEffect(() => {
    if (!id_club) return;
    setLoading(true);
    Promise.all([getClubById(Number(id_club)), getEquiposByClub(Number(id_club))])
      .then(([dataClub, dataEquipos]) => {
        setClub(dataClub);
        setEquipos(dataEquipos);
        if (dataEquipos.length > 0) setEquipoSeleccionado(dataEquipos[0]);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id_club]);

  useEffect(() => {
      if (partidos.length > 0) {
          obtenerPosiciones(partidos[0].id_torneo).then(setPosiciones);
      }
  }, [partidos]);

  if (loading) return <div className={styles.loader}>Cargando...</div>;
  if (!club) return <div className={styles.error}>Club no encontrado</div>;

  return (
    <div className={styles.mainWrapper}>
      <div className={styles.container}>
        
        {/* 1. SELECTOR DE CATEGORÍAS */}
        <div className={styles.categorySelector}>
          {equipos.map((eq) => (
            <button 
              key={eq.id_equipo}
              className={equipoSeleccionado?.id_equipo === eq.id_equipo ? styles.catBtnActive : styles.catBtn}
              onClick={() => setEquipoSeleccionado(eq)}
            >
              {eq.nombre}
            </button>
          ))}
        </div>

        {/* 2. HEADER DEL CLUB */}
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.clubLogo}>{club.nombre.substring(0,2).toUpperCase()}</div>
            <div>
              <h1>{club.nombre}</h1>
              <p>{equipoSeleccionado?.categoria} - {equipoSeleccionado?.genero}</p>
            </div>
          </div>
        </header>

        {/* 3. GRID SUPERIOR (PARTIDOS Y POSICIONES) */}
        <div className={styles.gridTop}>
          
          {/* COLUMNA IZQUIERDA: PARTIDOS */}
          <section className={styles.column}>
            <div className={styles.sectionHeader}>
              <h3>Partidos recientes</h3>
            </div>
            {partidos.map((p) => {
              const golesL = parsearGoleadores(p.lista_goles_local);
              const golesV = parsearGoleadores(p.lista_goles_visitante);
              return (
                <div key={p.id_partido} className={styles.matchCard}>
                  <div className={styles.matchDate}>{p.nombre_torneo} • Jornada {p.numero_fecha}</div>
                  <div className={styles.matchMain}>
                    <div className={styles.teamLine}>
                      <span className={p.goles_local > p.goles_visitante ? styles.winner : ""}>{p.equipo_local_nombre}</span>
                      <span className={styles.score}>{p.goles_local}</span>
                    </div>
                    <div className={styles.goalList}>
                      {golesL.map((g, i) => <span key={i}>{g.apellido}, {g.nombre} {g.min}' ({g.cuarto}C)</span>)}
                    </div>
                    <div className={styles.teamLine}>
                      <span className={p.goles_visitante > p.goles_local ? styles.winner : ""}>{p.equipo_visitante_nombre}</span>
                      <span className={styles.score}>{p.goles_visitante}</span>
                    </div>
                    <div className={styles.goalList}>
                      {golesV.map((g, i) => <span key={i}>{g.apellido}, {g.nombre} {g.min}' ({g.cuarto}C)</span>)}
                    </div>
                  </div>
                  <div className={styles.matchFooter}>Finalizado</div>
                </div>
              );
            })}
          </section>

          {/* COLUMNA DERECHA: POSICIONES */}
          <section className={styles.column}>
            <div className={styles.sectionHeader}>
              <h3>Clasificación</h3>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Equipo</th>
                    <th>PJ</th>
                    <th>DG</th>
                    <th>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {posiciones.map((pos, idx) => (
                    <tr key={pos.id_equipo} className={pos.id_equipo === equipoSeleccionado?.id_equipo ? styles.rowActive : ""}>
                      <td>{idx + 1}</td>
                      <td className={styles.teamNameCell}>{pos.equipo}</td>
                      <td>{pos.partidos_jugados}</td>
                      <td>{pos.diferencia_gol}</td>
                      <td className={styles.pts}>{pos.puntos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* SECCIÓN PLANTEL ACTIVO */}
        <section className={styles.plantelSection}>
          <div className={styles.sectionHeader}>
            <h3>Cuerpo Técnico</h3>
          </div>
          <div className={styles.plantelGrid}>
            {integrantes
              .filter(i => i.rol_en_plantel !== "JUGADOR")
              .map((staff) => (
                <div key={staff.id_plantel_integrante} className={styles.playerCard}>
                  <div className={styles.playerInfo}>
                    <span className={styles.playerName}>
                      {staff.persona?.apellido}, {staff.persona?.nombre}
                    </span>
                    <span className={styles.playerRole}>{staff.rol_en_plantel}</span>
                  </div>
                </div>
              ))}
          </div>

          <div className={styles.sectionHeader} style={{ marginTop: '30px' }}>
            <h3>Jugadores</h3>
          </div>
          <div className={styles.plantelGrid}>
            {integrantes
              .filter(i => i.rol_en_plantel === "JUGADOR")
              .map((jugador) => (
                <div key={jugador.id_plantel_integrante} className={styles.playerCard}>
                  <div className={styles.playerNumber}>{jugador.numero_camiseta || '—'}</div>
                  <div className={styles.playerInfo}>
                    <span className={styles.playerName}>
                      {jugador.persona?.apellido}, {jugador.persona?.nombre}
                    </span>
                    <span className={styles.playerRole}>Jugador</span>
                  </div>
                </div>
              ))}
          </div>
        </section>

      </div>
    </div>
  );
}