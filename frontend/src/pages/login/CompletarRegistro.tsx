import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import AxiosPublic from '../../api/axiosPublic'; // Usa tu instancia configurada

const CompletarRegistro = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await AxiosPublic.post('/auth/confirmar-registro', {
        token,
        username,
        password
      });
      alert("¡Cuenta creada! Ahora puedes loguearte.");
    } catch (error) {
      console.error("Error al registrar:", error);
      alert("El link expiró o es inválido");
    }
  };

  return (
    <div className="p-8">
      <h2>Finalizar Registro</h2>
      <p>Configura tu cuenta para Hockey Bariloche</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
        <input 
          type="text" 
          placeholder="Nombre de usuario" 
          onChange={(e) => setUsername(e.target.value)} 
          className="border p-2"
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          onChange={(e) => setPassword(e.target.value)} 
          className="border p-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Crear mi cuenta
        </button>
      </form>
    </div>
  );
};

export default CompletarRegistro;