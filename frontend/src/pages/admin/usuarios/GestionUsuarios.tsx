import { useState, useEffect } from "react";
import axiosAdmin from "../../../api/axiosAdmin";
import { usuariosApi } from "../../../api/usuarios.api"; 
import styles from "./GestionUsuarios.module.css"; // Importamos el module

interface Usuario {
  id_usuario: number;
  username: string;
  email: string;
  tipo: string;
  activo: boolean;
  ultimo_login: string | null;
}

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState("EDITOR");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const data = await usuariosApi.getAll();
      setUsuarios(data);
    } catch (err) {
      setMensaje({ texto: "Error al cargar la lista de usuarios", tipo: "error" });
    }
  };

  const handleInvitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ texto: "", tipo: "" });

    try {
      const res = await usuariosApi.invitar(email, tipo);
      setMensaje({ texto: res.message, tipo: "success" });
      setEmail("");
      cargarUsuarios();
    } catch (error: any) {
      const errorServer = error.response?.data?.detail || "Error al enviar la invitación";
      setMensaje({ texto: errorServer, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarRol = async (id: number, nuevoTipo: string) => {
    try {
      await usuariosApi.updateRol(id, nuevoTipo);
      setUsuarios(prev => prev.map(u => u.id_usuario === id ? { ...u, tipo: nuevoTipo } : u));
    } catch (err) {
      alert("No se pudo cambiar el rol");
    }
  };

  const handleToggleActivo = async (id: number, estadoActual: boolean) => {
    try {
      const nuevoEstado = !estadoActual;
      await usuariosApi.toggleEstado(id, nuevoEstado);
      setUsuarios(prev => prev.map(u => u.id_usuario === id ? { ...u, activo: nuevoEstado } : u));
    } catch (err) {
      alert("Error al cambiar estado");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Administración de Usuarios</h1>
        <p className={styles.subtitle}>Gestiona los permisos y accesos al sistema</p>
      </header>

      {/* Tarjeta de Invitación */}
      <section className={styles.inviteCard}>
        <h2 className={styles.sectionTitle}>Invitar Nuevo Usuario</h2>
        <form onSubmit={handleInvitar} className={styles.inviteForm}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Institucional</label>
            <input 
              type="email" 
              required 
              className={styles.input} 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="ejemplo@hockeybariloche.com"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Asignar Rol</label>
            <select 
              className={styles.select} 
              value={tipo} 
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="EDITOR">EDITOR</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPERUSUARIO">SUPERUSUARIO</option>
            </select>
          </div>
          <button disabled={loading} className={styles.btnSubmit}>
            {loading ? "Enviando..." : "Enviar Invitación"}
          </button>
        </form>

        {mensaje.texto && (
          <div className={`${styles.alert} ${mensaje.tipo === 'success' ? styles.alertSuccess : styles.alertError}`}>
            {mensaje.tipo === 'error' ? '⚠️' : '✅'} {mensaje.texto}
          </div>
        )}
      </section>

      {/* Tabla de Usuarios */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user) => (
              <tr key={user.id_usuario} className={!user.activo ? styles.rowInactive : ""}>
                <td>
                  <div className={styles.userMainInfo}>
                    <span className={styles.username}>{user.username || "Pendiente"}</span>
                    <span className={styles.email}>{user.email}</span>
                  </div>
                </td>
                <td>
                  <select 
                    value={user.tipo}
                    onChange={(e) => handleCambiarRol(user.id_usuario, e.target.value)}
                    className={styles.select}
                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                  >
                    <option value="EDITOR">EDITOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPERUSUARIO">SUPERUSUARIO</option>
                  </select>
                </td>
                <td>
                  <span className={`${styles.badge} ${user.activo ? styles.activeBadge : styles.inactiveBadge}`}>
                    {user.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleToggleActivo(user.id_usuario, user.activo)}
                    className={`${styles.btnToggle} ${user.activo ? styles.btnDeactivate : styles.btnActivate}`}
                  >
                    {user.activo ? "Dar de Baja" : "Reactivar Cuenta"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}