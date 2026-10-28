import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { authApi } from "../../../api/usuarios.api";
import { getCurrentUser } from "../../../api/auth.api";
import styles from "./MiPerfil.module.css";

export default function MiPerfil() {
  const { user, updateUser, logout } = useAuth();

  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [apellido, setApellido] = useState(user?.apellido || "");
  const [email, setEmail] = useState(user?.email || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [guardando, setGuardando] = useState(false);
  const [mensajeDatos, setMensajeDatos] = useState({ texto: "", tipo: "" });

  // El login normal (sin recarga de página) solo trae id/email/rol del JWT;
  // nombre/apellido/telefono llegan recién en el próximo refresh de sesión.
  // Pedimos el perfil real al backend al entrar para no mostrar datos vacíos
  // o desactualizados.
  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        updateUser({
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono,
          email: data.email,
        });
      })
      .catch(() => {
        // Si falla, seguimos mostrando lo que ya haya en el contexto.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [cambiandoPasswordVisible, setCambiandoPasswordVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [mensajePassword, setMensajePassword] = useState({ texto: "", tipo: "" });

  const [cerrandoCuenta, setCerrandoCuenta] = useState(false);

  const handleEditar = () => {
    setNombre(user?.nombre || "");
    setApellido(user?.apellido || "");
    setEmail(user?.email || "");
    setTelefono(user?.telefono || "");
    setMensajeDatos({ texto: "", tipo: "" });
    setEditando(true);
  };

  const handleCancelarEdicion = () => {
    setEditando(false);
    setMensajeDatos({ texto: "", tipo: "" });
  };

  const handleGuardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensajeDatos({ texto: "", tipo: "" });

    try {
      const data = await authApi.actualizarPerfil({ nombre, apellido, telefono, email });
      updateUser({
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono,
        email: data.email,
      });
      // El email no cambia al instante: si se pidió un email nuevo, el backend
      // manda un link de confirmación y devuelve `email_pendiente` en vez de
      // aplicarlo. `data.email` sigue siendo el actual (el que sirve para loguearse).
      if (data.email_pendiente) {
        setEmail(data.email);
        setMensajeDatos({
          texto: `Datos actualizados. Te enviamos un email a ${data.email_pendiente} para confirmar el cambio; hasta que lo confirmes seguís entrando con ${data.email}.`,
          tipo: "success",
        });
      } else {
        setMensajeDatos({ texto: "Datos actualizados correctamente", tipo: "success" });
      }
      setEditando(false);
    } catch (error: any) {
      const errorServer = error.response?.data?.detail || "No se pudieron guardar los cambios";
      setMensajeDatos({ texto: errorServer, tipo: "error" });
    } finally {
      setGuardando(false);
    }
  };

  const handleMostrarCambioPassword = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMensajePassword({ texto: "", tipo: "" });
    setCambiandoPasswordVisible(true);
  };

  const handleCancelarCambioPassword = () => {
    setCambiandoPasswordVisible(false);
    setMensajePassword({ texto: "", tipo: "" });
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajePassword({ texto: "", tipo: "" });

    if (newPassword !== confirmPassword) {
      setMensajePassword({ texto: "Las contraseñas nuevas no coinciden", tipo: "error" });
      return;
    }

    setCambiandoPassword(true);
    try {
      await authApi.cambiarPassword(oldPassword, newPassword);
      setMensajePassword({ texto: "Contraseña actualizada con éxito", tipo: "success" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCambiandoPasswordVisible(false);
    } catch (error: any) {
      const errorServer = error.response?.data?.detail || "No se pudo cambiar la contraseña";
      setMensajePassword({ texto: errorServer, tipo: "error" });
    } finally {
      setCambiandoPassword(false);
    }
  };

  const handleCerrarCuenta = async () => {
    if (!window.confirm("¿Seguro que querés cerrar tu cuenta? Esta acción no se puede deshacer.")) {
      return;
    }

    setCerrandoCuenta(true);
    try {
      await authApi.cerrarCuenta();
      await logout();
    } catch (error: any) {
      alert(error.response?.data?.detail || "No se pudo cerrar la cuenta");
      setCerrandoCuenta(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Mi Perfil</h1>
        <p className={styles.subtitle}>Gestioná tus datos personales y tu cuenta</p>
      </header>

      {/* Mis datos */}
      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Mis datos</h2>
          {!editando && (
            <button type="button" className={styles.btnLink} onClick={handleEditar}>
              Editar
            </button>
          )}
        </div>

        {!editando ? (
          <dl className={styles.readonlyList}>
            <div className={styles.readonlyRow}>
              <dt className={styles.label}>Nombre</dt>
              <dd>{user?.nombre || "—"}</dd>
            </div>
            <div className={styles.readonlyRow}>
              <dt className={styles.label}>Apellido</dt>
              <dd>{user?.apellido || "—"}</dd>
            </div>
            <div className={styles.readonlyRow}>
              <dt className={styles.label}>Email</dt>
              <dd>{user?.email || "—"}</dd>
            </div>
            <div className={styles.readonlyRow}>
              <dt className={styles.label}>Teléfono</dt>
              <dd>{user?.telefono || "—"}</dd>
            </div>
          </dl>
        ) : (
          <form onSubmit={handleGuardarDatos} className={styles.form}>
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre</label>
                <input
                  type="text"
                  className={styles.input}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Apellido</label>
                <input
                  type="text"
                  className={styles.input}
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  required
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Teléfono</label>
                <input
                  type="tel"
                  className={styles.input}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.row}>
              <button disabled={guardando} className={styles.btnSubmit}>
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleCancelarEdicion}
                disabled={guardando}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {mensajeDatos.texto && (
          <div className={`${styles.alert} ${mensajeDatos.tipo === 'success' ? styles.alertSuccess : styles.alertError}`}>
            {mensajeDatos.tipo === 'error' ? '⚠️' : '✅'} {mensajeDatos.texto}
          </div>
        )}
      </section>

      {/* Cambiar contraseña */}
      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Contraseña</h2>
          {!cambiandoPasswordVisible && (
            <button type="button" className={styles.btnLink} onClick={handleMostrarCambioPassword}>
              Cambiar contraseña
            </button>
          )}
        </div>

        {cambiandoPasswordVisible && (
          <form onSubmit={handleCambiarPassword} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Contraseña actual</label>
              <input
                type="password"
                required
                className={styles.input}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nueva contraseña</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className={styles.input}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Confirmar contraseña</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.row}>
              <button disabled={cambiandoPassword} className={styles.btnSubmit}>
                {cambiandoPassword ? "Cambiando..." : "Cambiar contraseña"}
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleCancelarCambioPassword}
                disabled={cambiandoPassword}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {mensajePassword.texto && (
          <div className={`${styles.alert} ${mensajePassword.tipo === 'success' ? styles.alertSuccess : styles.alertError}`}>
            {mensajePassword.tipo === 'error' ? '⚠️' : '✅'} {mensajePassword.texto}
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section className={styles.dangerCard}>
        <h2 className={styles.dangerTitle}>Zona de peligro</h2>
        <p className={styles.dangerText}>
          Cerrar tu cuenta la desactiva y no vas a poder volver a iniciar sesión. Esta acción no se puede deshacer.
        </p>
        <button
          onClick={handleCerrarCuenta}
          disabled={cerrandoCuenta}
          className={styles.btnDanger}
        >
          {cerrandoCuenta ? "Cerrando..." : "Cerrar cuenta"}
        </button>
      </section>
    </div>
  );
}
