import { useEffect, useState } from 'react';

interface Column {
  id: string;
  title: string;
  position: number;
}

interface BoardData {
  columns: Column[];
  cards: any[];
  user_email?: string;
}

function App() {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Recuperamos el token JWT guardado tras el login
    const token = localStorage.getItem('token');

    // Si no hay token directamente, cortamos la carga y mostramos error de sesión
    if (!token) {
      setError('Debes iniciar sesión para ver tu tablero.');
      setLoading(false);
      return;
    }

    fetch('http://127.0.0.1:8000/boards/initial', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((res) => {
        // 2. Si el servidor rechaza la autenticación (401 o 403), limpiamos el token caducado (Punto 22)
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          throw new Error('Sesión expirada o token no válido');
        }
        if (!res.ok) {
          throw new Error('Error al conectar con el servidor');
        }
        return res.json();
      })
      .then((data) => {
        setBoard(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al conectar con la API:', err);
        setError('Debes iniciar sesión para ver tu tablero.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando tablero...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#e11d48' }}>
        <h2>{error}</h2>
        <p>Por favor, inicia sesión para continuar.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>NeoCare Health - Tablero Principal</h1>
          {board?.user_email && (
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Usuario: <strong>{board.user_email}</strong>
            </p>
          )}
        </div>
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            window.location.reload();
          }}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Cerrar Sesión
        </button>
      </header>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        {board?.columns.map((col) => (
          <div
            key={col.id}
            style={{
              flex: 1,
              background: '#f8fafc',
              borderRadius: '8px',
              padding: '1rem',
              minHeight: '350px',
              border: '1px solid #e2e8f0'
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>{col.title}</h3>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>
              Sin tarjetas por ahora
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;