import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AxiosPublic from '../../../api/axiosPublic';
import styles from "../../login/Login.module.css"; // Reutilizamos tus estilos de login

const CompletarRegistro = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados para visibilidad y validación
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden");
      return;
    }

    // Validar longitud mínima (opcional pero recomendado)
    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await AxiosPublic.post('/auth/confirmar-registro', {
        token,
        username,
        password
      });
      
      alert("¡Cuenta creada exitosamente!");
      navigate('/login');
      
    } catch (error: any) {
      const mensajeServidor = error.response?.data?.detail || "Ocurrió un error inesperado";
      setErrorMsg(mensajeServidor);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div className={styles.container}><p className={styles.error}>Token de invitación faltante o inválido.</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Finalizar Registro</h2>
        <p className={styles.forgotLink} style={{textAlign: 'center', marginBottom: '1.5rem'}}>
          Configura tu cuenta para Hockey Bariloche
        </p>
        
        {errorMsg && (
          <div className={styles.error} style={{marginBottom: '1rem'}}>
            <p>{errorMsg}</p>
            {errorMsg.includes("ya completó") && (
               <button 
                 onClick={() => navigate('/login')}
                 className={styles.forgotLink}
                 style={{display: 'block', marginTop: '5px', fontWeight: 'bold'}}
               >
                 Ir al Login
               </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label className={styles.forgotLink}>Nombre de usuario</label>
            <input 
              type="text" 
              required
              value={username}
              placeholder="Ej: nico_hc" 
              onChange={(e) => setUsername(e.target.value)} 
              className={styles.input}
              style={{width: '100%'}}
            />
          </div>

          {/* Campo Contraseña 1 */}
          <div style={{position: 'relative'}}>
            <label className={styles.forgotLink}>Contraseña</label>
            <input 
              type={showPassword ? "text" : "password"} 
              required
              value={password}
              placeholder="Mínimo 8 caracteres" 
              onChange={(e) => setPassword(e.target.value)} 
              className={styles.input}
              style={{width: '100%'}}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '35px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Campo Confirmar Contraseña */}
          <div>
            <label className={styles.forgotLink}>Confirmar Contraseña</label>
            <input 
              type={showPassword ? "text" : "password"} 
              required
              value={confirmPassword}
              placeholder="Repite tu contraseña" 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className={styles.input}
              style={{
                width: '100%',
                borderColor: confirmPassword && password !== confirmPassword ? '#ff8a65' : ''
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={styles.button}
          >
            {loading ? "Procesando..." : "Crear mi cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompletarRegistro;