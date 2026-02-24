import styles from "./Home.module.css";

export default function Home() {
  // Datos de ejemplo (luego vendrán de tu API o Base de Datos)
  const noticias = [
    { id: 1, titulo: "Gran Final del Torneo Apertura", fecha: "20 Feb 2026" },
    { id: 2, titulo: "Convocatoria Selección Sub-16", fecha: "18 Feb 2026" },
  ];

  return (
    <div className={styles.home}>
      {/* 1. SECCIÓN HERO */}
      <header className={styles.hero}>
        <div className={styles.overlay}>
          <h1>Asociación de Hockey Bariloche y Lagos del Sur</h1>
          <p>Pasión por el hockey en la Patagonia</p>
          <button className={styles.btnPrimary}>Ver Fixture</button>
        </div>
      </header>

      {/* 2. SECCIÓN DE NOTICIAS */}
      <section className={styles.newsSection}>
        <h2>Últimas Noticias</h2>
        <div className={styles.newsGrid}>
          {noticias.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.imagePlaceholder}></div>
              <h3>{item.titulo}</h3>
              <span>{item.fecha}</span>
              <p>Breve descripción de lo que está pasando en el hockey local...</p>
            </article>
          ))}
        </div>
      </section>

      {/* 3. WIDGET DE PARTIDOS */}
      <section className={styles.nextGames}>
        <h3>Próximos Encuentros</h3>
        <div className={styles.gameStrip}>
          <p>Club Pehuenes vs Estudiantes - Sábado 14:00hs</p>
        </div>
      </section>
    </div>
  );
}