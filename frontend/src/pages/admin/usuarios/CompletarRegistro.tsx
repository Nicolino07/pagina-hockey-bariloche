import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AxiosPublic from '../../../api/axiosPublic';

const CompletarRegistro = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await AxiosPublic.post('/auth/confirmar-registro', {
        token,
        username,
        password
      });
      
      alert("¡Cuenta creada exitosamente!");
      navigate('/login'); // Redirigir al login
      
    } catch (error: any) {
      console.error("Error al registrar:", error);
      
      // Capturamos el mensaje específico del backend: "Este usuario ya completó su registro"
      const mensajeServidor = error.response?.data?.detail || "Ocurrió un error inesperado";
      setErrorMsg(mensajeServidor);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div className="p-8 text-red-500">Token de invitación faltante.</div>;
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-2">Finalizar Registro</h2>
      <p className="text-gray-600 mb-6">Configura tu cuenta para Hockey Bariloche</p>
      
      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{errorMsg}</p>
          {errorMsg.includes("ya completó") && (
             <button 
               onClick={() => navigate('/login')}
               className="text-sm underline font-bold mt-1 block"
             >
               Ir al Login
             </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre de usuario</label>
          <input 
            type="text" 
            required
            value={username}
            placeholder="Ej: nico_hc" 
            onChange={(e) => setUsername(e.target.value)} 
            className="border p-2 w-full rounded mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contraseña</label>
          <input 
            type="password" 
            required
            value={password}
            placeholder="Mínimo 8 caracteres" 
            onChange={(e) => setPassword(e.target.value)} 
            className="border p-2 w-full rounded mt-1"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className={`p-2 rounded text-white font-bold ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? "Procesando..." : "Crear mi cuenta"}
        </button>
      </form>
    </div>
  );
};

export default CompletarRegistro;