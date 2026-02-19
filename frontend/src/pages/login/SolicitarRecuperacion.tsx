// src/pages/usuarios/SolicitarRecuperacion.tsx
import { useState } from "react";
import { authApi } from "../../api/usuarios.api"; // Donde definiste llamar al back
import styles from "./Login.module.css"; 
import { Link } from "react-router-dom"

export default function SolicitarRecuperacion() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.solicitarRecuperacion(email);
      setEnviado(true);
    } catch (error) {
      // Incluso si falla, a veces es mejor mostrar éxito por seguridad
      setEnviado(true); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Recuperar Clave</h2>
        
        {!enviado ? (
          <form onSubmit={handleRequest} className={styles.form}>
            <p className={styles.textHelp}>Ingresa tu email y te enviaremos un link de acceso.</p>
            <input 
              type="email" 
              className={styles.input} 
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button disabled={loading} className={styles.button}>
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        ) : (
          <div className={styles.successMsg}>
            <p>Si el correo existe, recibirás instrucciones en los próximos minutos.</p>
            <Link to="/login" className={styles.button}>Volver al Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}