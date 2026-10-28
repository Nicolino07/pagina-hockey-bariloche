// src/pages/login/ConfirmarCambioEmail.tsx
import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api/usuarios.api";
import styles from "./Login.module.css";
import Button from "../../components/ui/button/Button";

/**
 * Página de confirmación de cambio de email.
 * Lee el token del link enviado al email nuevo y, al confirmar, aplica
 * el cambio en el backend. Hasta que esto pasa, el login sigue funcionando
 * con el email anterior.
 */
export default function ConfirmarCambioEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [confirmado, setConfirmado] = useState(false);

  const handleConfirmar = async () => {
    if (!token) return;

    setLoading(true);
    setMensaje({ texto: "", tipo: "" });
    try {
      const data = await authApi.confirmarCambioEmail(token);
      setMensaje({ texto: data.message || "Email actualizado correctamente.", tipo: "success" });
      setConfirmado(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setMensaje({
        texto: err.response?.data?.detail || "No se pudo confirmar el cambio de email",
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
          <p className={styles.error}>Link inválido. Volvé a solicitar el cambio de email desde Mi Perfil.</p>
          <Link to="/login" className={styles.button}>Ir al login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Button className={styles.backButton} onClick={() => navigate("/")}>
        ← Volver
      </Button>
      <div className={styles.card}>
        <h2 className={styles.title}>Confirmar nuevo email</h2>

        {!confirmado && (
          <p className={styles.textHelp}>
            Confirmá que querés usar esta dirección como tu nuevo email de acceso.
          </p>
        )}

        {mensaje.texto && (
          <p className={mensaje.tipo === "error" ? styles.error : styles.success}>
            {mensaje.texto}
          </p>
        )}

        {!confirmado && (
          <button onClick={handleConfirmar} disabled={loading} className={styles.button}>
            {loading ? "Confirmando..." : "Confirmar cambio de email"}
          </button>
        )}
      </div>
    </div>
  );
}
