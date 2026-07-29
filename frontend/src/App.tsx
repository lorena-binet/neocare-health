import { useEffect, useState } from 'react';

// Definición de la URL base de la API usando la variable de entorno de Vite o fallback a local
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface Card {
  id: number;
  title: string;
  description?: string;
  list_id: number;
  position: number;
  due_date?: string;
}

interface Column {
  id: number | string;
  title: string;
  position: number;
}

interface BoardData {
  columns: Column[];
  cards: Card[];
  user_email?: string;
}

interface HourEntry {
  id: number;
  hours: number;
  description: string;
  date: string;
}

const COLUMN_MAP: Record<string, number> = {
  'backlog': 1,
  'in_progress': 2,
  'review': 3,
  'done': 4
};

// Componente interactivo integrado para registrar y visualizar horas con persistencia local
function MyHoursView({ _token }: { _token: string }) {
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Estado para almacenar y listar las horas guardadas localmente
  const [entries, setEntries] = useState<HourEntry[]>(() => {
    const saved = localStorage.getItem('neo_care_hours');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('neo_care_hours', JSON.stringify(entries));
  }, [entries]);

  const handleSubmitHours = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedHours = parseFloat(hours);
    if (isNaN(parsedHours) || parsedHours <= 0 || !description.trim()) return;

    const newEntry: HourEntry = {
      id: Date.now(),
      hours: parsedHours,
      description: description.trim(),
      date: new Date().toLocaleDateString()
    };

    setEntries([newEntry, ...entries]);
    setSuccessMsg('¡Horas registradas con éxito!');
    setHours('');
    setDescription('');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeleteEntry = (id: number) => {
    setEntries(entries.filter(item => item.id !== id));
  };

  const totalHours = entries.reduce((acc, item) => acc + item.hours, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: '#0f172a', marginTop: 0 }}>Registro de Horas</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Aquí puedes registrar y llevar un control de las horas dedicadas a las tareas del proyecto.</p>
        
        {successMsg && (
          <div style={{ color: '#16a34a', background: '#f0fdf4', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmitHours} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '0.25rem', fontWeight: 'bold' }}>Horas dedicadas</label>
            <input 
              type="number" 
              step="0.5" 
              min="0.5" 
              value={hours} 
              onChange={(e) => setHours(e.target.value)} 
              placeholder="Ej: 2.5" 
              required 
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '0.25rem', fontWeight: 'bold' }}>Descripción / Tarea</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="¿En qué has invertido este tiempo?" 
              rows={3}
              required 
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          <button type="submit" style={{ padding: '0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Guardar Horas
          </button>
        </form>
      </div>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#0f172a', margin: 0 }}>Historial de Registros</h3>
          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.3rem 0.8rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>
            Total acumulado: {totalHours} horas
          </span>
        </div>

        {entries.length === 0 ? (
          <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', margin: '2rem 0' }}>No hay registros de horas todavía.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {entries.map((entry) => (
              <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ background: '#2563eb', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {entry.hours}h
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{entry.date}</span>
                  </div>
                  <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>{entry.description}</p>
                </div>
                <button 
                  onClick={() => handleDeleteEntry(entry.id)} 
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'board' | 'hours'>('board');

  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const [addingCardColumnId, setAddingCardColumnId] = useState<number | string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [draggedCardId, setDraggedCardId] = useState<number | null>(null);

  const resolveNumericListId = (rawId: number | string): number => {
    if (typeof rawId === 'number') return rawId;
    if (COLUMN_MAP[rawId]) return COLUMN_MAP[rawId];
    const parsed = parseInt(String(rawId), 10);
    return isNaN(parsed) ? 1 : parsed;
  };

  const fetchBoard = () => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/boards/initial`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          setToken(null);
          throw new Error('Sesión expirada');
        }
        if (!res.ok) throw new Error('Error al conectar con la API');
        return res.json();
      })
      .then((data) => {
        setBoard(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener tablero:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBoard();
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (!res.ok) throw new Error('Credenciales incorrectas');

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
    } catch (err: any) {
      setAuthError(err.message || 'Error al iniciar sesión');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Error al registrar el usuario');
      }

      setAuthSuccess('¡Cuenta creada con éxito! Puedes iniciar sesión.');
      setIsRegistering(false);
    } catch (err: any) {
      setAuthError(err.message || 'Error al registrarse');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setBoard(null);
  };

  const handleCreateCard = async (e: React.FormEvent, listId: number | string) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    const numericListId = resolveNumericListId(listId);
    const titleToSubmit = newCardTitle;
    
    setNewCardTitle('');
    setAddingCardColumnId(null);

    try {
      const res = await fetch(`${API_URL}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: titleToSubmit,
          list_id: numericListId,
          position: 1
        })
      });

      if (res.ok) {
        fetchBoard();
      }
    } catch (err) {
      console.error("Error de red al crear la tarjeta:", err);
    }
  };

  const startEditing = (card: Card) => {
    setEditingCardId(card.id);
    setEditTitle(card.title);
  };

  const handleUpdateCardTitle = async (e: React.FormEvent, cardId: number) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    try {
      const res = await fetch(`${API_URL}/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle })
      });

      if (res.ok) {
        setEditingCardId(null);
        fetchBoard();
      }
    } catch (err) {
      console.error("Error al actualizar la tarjeta:", err);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    try {
      const res = await fetch(`${API_URL}/cards/${cardId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok || res.status === 204) {
        fetchBoard();
      }
    } catch (err) {
      console.error('Error al eliminar la tarjeta:', err);
    }
  };

  const handleDragStart = (cardId: number) => {
    setDraggedCardId(cardId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetListId: number | string) => {
    if (!draggedCardId || !board) return;

    const numericTargetId = resolveNumericListId(targetListId);

    const updatedCards = board.cards.map(card => {
      if (card.id === draggedCardId) {
        return { ...card, list_id: numericTargetId };
      }
      return card;
    });

    setBoard({ ...board, cards: updatedCards });

    try {
      await fetch(`${API_URL}/cards/${draggedCardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ list_id: numericTargetId })
      });
    } catch (err) {
      console.error("Error al desplazar tarjeta, recargando tablero...", err);
      fetchBoard();
    } finally {
      setDraggedCardId(null);
    }
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '360px' }}>
          <h2 style={{ marginTop: 0, color: '#0f172a', textAlign: 'center' }}>NeoCare Health</h2>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
            <button
              onClick={() => { setIsRegistering(false); setAuthError(null); }}
              style={{
                flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px',
                background: !isRegistering ? 'white' : 'transparent',
                fontWeight: !isRegistering ? 'bold' : 'normal', cursor: 'pointer',
                boxShadow: !isRegistering ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setIsRegistering(true); setAuthError(null); }}
              style={{
                flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px',
                background: isRegistering ? 'white' : 'transparent',
                fontWeight: isRegistering ? 'bold' : 'normal', cursor: 'pointer',
                boxShadow: isRegistering ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Registrarse
            </button>
          </div>

          {authError && <div style={{ color: '#ef4444', background: '#fef2f2', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>{authError}</div>}
          {authSuccess && <div style={{ color: '#16a34a', background: '#f0fdf4', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>{authSuccess}</div>}

          <form onSubmit={isRegistering ? handleRegister : handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '0.25rem' }}>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="ejemplo@correo.com"
                required 
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '0.25rem' }}>Contraseña</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <button type="submit" style={{ width: '100%', padding: '0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {isRegistering ? 'Crear Cuenta' : 'Entrar al Tablero'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && !board) {
    return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>Cargando aplicación...</div>;
  }

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'white', padding: '1rem 1.5rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>NeoCare Health</h1>
          {board?.user_email && (
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              Usuario conectado: <strong>{board.user_email}</strong>
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px', gap: '0.25rem' }}>
            <button
              onClick={() => setCurrentView('board')}
              style={{
                padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px',
                background: currentView === 'board' ? 'white' : 'transparent',
                fontWeight: currentView === 'board' ? 'bold' : 'normal',
                color: currentView === 'board' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                boxShadow: currentView === 'board' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                fontSize: '0.9rem'
              }}
            >
              📋 Tablero
            </button>
            <button
              onClick={() => setCurrentView('hours')}
              style={{
                padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px',
                background: currentView === 'hours' ? 'white' : 'transparent',
                fontWeight: currentView === 'hours' ? 'bold' : 'normal',
                color: currentView === 'hours' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                boxShadow: currentView === 'hours' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                fontSize: '0.9rem'
              }}
            >
              ⏱️ Mis Horas
            </button>
          </div>

          <button 
            onClick={handleLogout}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {currentView === 'hours' ? (
        <MyHoursView _token={token} />
      ) : (
        <div style={{ display: 'flex', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
          {board?.columns?.map((col) => {
            const colNumericId = resolveNumericListId(col.id);

            const columnCards = board.cards?.filter((card: any) => {
              const cardList = card.list_id ?? card.column_id ?? card.listId;
              return String(cardList) === String(col.id) || resolveNumericListId(cardList) === colNumericId;
            }) || [];

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
                style={{
                  flex: '1 1 0', minWidth: 0, background: '#e2e8f0', borderRadius: '12px',
                  padding: '1rem', minHeight: '75vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box'
                }}
              >
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{col.title}</span>
                  <span style={{ fontSize: '0.85rem', background: '#cbd5e1', color: '#334155', padding: '0.1rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                    {columnCards.length}
                  </span>
                </h3>

                {addingCardColumnId === col.id ? (
                  <form 
                    onSubmit={(e) => handleCreateCard(e, col.id)}
                    style={{ marginBottom: '1rem', background: 'white', padding: '0.75rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  >
                    <input
                      type="text"
                      placeholder="Título de la tarjeta..."
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      autoFocus
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" style={{ padding: '0.4rem 0.8rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Añadir
                      </button>
                      <button type="button" onClick={() => { setAddingCardColumnId(null); setNewCardTitle(''); }} style={{ padding: '0.4rem 0.8rem', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingCardColumnId(col.id)}
                    style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', background: 'white', border: '1px dashed #94a3b8', borderRadius: '8px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}
                  >
                    + Nueva Tarjeta
                  </button>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {columnCards.length > 0 ? (
                    columnCards.map((card: Card) => (
                      <div 
                        key={card.id}
                        draggable={editingCardId !== card.id}
                        onDragStart={() => handleDragStart(card.id)}
                        style={{ 
                          background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          cursor: editingCardId === card.id ? 'default' : 'grab',
                          opacity: draggedCardId === card.id ? 0.5 : 1,
                          transition: 'opacity 0.2s'
                        }}
                      >
                        {editingCardId === card.id ? (
                          <form onSubmit={(e) => handleUpdateCardTitle(e, card.id)} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', boxSizing: 'border-box' }}>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              autoFocus
                              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                              required
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button type="submit" style={{ padding: '0.3rem 0.6rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>Guardar</button>
                              <button type="button" style={{ padding: '0.3rem 0.6rem', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }} onClick={() => setEditingCardId(null)}>Cancelar</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <strong style={{ display: 'block', color: '#0f172a', marginBottom: '0.25rem' }}>{card.title}</strong>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem' }}>
                              <button onClick={() => startEditing(card)} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}>
                                ✏️ Editar
                              </button>
                              <button onClick={() => handleDeleteCard(card.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}>
                                🗑️ Borrar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>
                      Arrastra una tarjeta aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;