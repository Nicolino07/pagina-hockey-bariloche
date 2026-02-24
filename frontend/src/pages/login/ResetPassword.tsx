// src/pages/login/ResetPasswordForm.tsx
import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api/usuarios.api"; 
import styles from "./Login.module.css";
import Button from "../../components/ui/button/Button";


export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token"); // Extrae el token de la URL

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setMensaje({ texto: "Las contraseñas no coinciden", tipo: "error" });
    }

    if (!token) {
      return setMensaje({ texto: "Token de recuperación ausente o inválido", tipo: "error" });
    }

    setLoading(true);
    try {
      await authApi.confirmarReset(token, password);
      setMensaje({ texto: "Contraseña actualizada. Redirigiendo al login...", tipo: "success" });
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setMensaje({ 
        texto: err.response?.data?.detail || "Error al restablecer la contraseña", 
        tipo: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.error}>Link inválido. Por favor, solicita uno nuevo.</p>
          <Link to="/recuperar-password" className={styles.button}>Volver a intentar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      <Button 
        className={styles.backButton}
        onClick={() => navigate("/")}>
        ← Volver
      </Button>
      <div className={styles.card}>
        <h2 className={styles.title}>Nueva Contraseña</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <p className={styles.textHelp}>Ingresa tu nueva clave de acceso.</p>
          
          <input 
            type="password" 
            placeholder="Nueva contraseña" 
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          <input 
            type="password" 
            placeholder="Confirmar contraseña" 
            className={styles.input}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {mensaje.texto && (
            <p className={mensaje.tipo === "error" ? styles.error : styles.success}>
              {mensaje.texto}
            </p>
          )}

          <button disabled={loading} className={styles.button}>
            {loading ? "Actualizando..." : "Cambiar Contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}