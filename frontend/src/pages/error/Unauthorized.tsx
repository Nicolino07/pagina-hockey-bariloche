import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>🚫 Acceso Denegado</h1>
      <p>No tienes permisos para ver esta sección.</p>
      <Link to="/admin" style={{ color: 'blue', textDecoration: 'underline' }}>
        Volver al Panel Principal
      </Link>
    </div>
  );
}