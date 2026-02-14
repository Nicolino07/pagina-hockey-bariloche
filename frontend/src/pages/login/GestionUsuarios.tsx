import { useState } from "react";
import axiosAdmin from "../../api/axiosAdmin"; // Tu instancia con el token

export default function GestionUsuarios() {
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState("EDITOR");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  const handleInvitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ texto: "", tipo: "" });

    try {
      await axiosAdmin.post("/auth/invitar", { email, tipo });
      setMensaje({ texto: `¡Invitación enviada a ${email}!`, tipo: "success" });
      setEmail("");
    } catch (error: any) {
      setMensaje({ 
        texto: error.response?.data?.detail || "Error al enviar invitación", 
        tipo: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Administración de Usuarios</h1>

      {/* Tarjeta de Invitación */}
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
        <h2 className="text-lg font-semibold mb-4">Enviar Nueva Invitación</h2>
        <form onSubmit={handleInvitar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email del Invitado</label>
            <input
              type="email"
              required
              className="mt-1 block w-full border rounded-md p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rol Asignado</label>
            <select 
              className="mt-1 block w-full border rounded-md p-2"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="EDITOR">Editor (Goles, Partidos)</option>
              <option value="ADMIN">Admin (Clubes, Torneos)</option>
              <option value="SUPERUSUARIO">Superusuario (Todo)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Enviando..." : "Enviar Invitación"}
          </button>
        </form>
        {mensaje.texto && (
          <p className={`mt-4 text-sm ${mensaje.tipo === "success" ? "text-green-600" : "text-red-600"}`}>
            {mensaje.texto}
          </p>
        )}
      </div>
    </div>
  );
}