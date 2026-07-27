import React, { useState } from 'react';

export const WorkLogForm = ({ cardId, token, onLogAdded }: any) => {
  const [hours, setHours] = useState(0.5);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (hours < 0.25) {
      setError('El mínimo de horas a imputar es 0.25h');
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/worklogs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ card_id: cardId, hours: Number(hours), date, note })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Error al guardar horas');
      }

      setNote('');
      if (onLogAdded) onLogAdded();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg space-y-3 border">
      <h3 className="font-bold text-gray-700">Imputar Tiempo Trabalhado</h3>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <div className="flex gap-2">
        <input 
          type="number" 
          step="0.25" 
          min="0.25"
          value={hours} 
          onChange={(e) => setHours(Number(e.target.value))}
          className="p-2 border rounded w-1/3"
          required
        />
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          className="p-2 border rounded w-2/3"
          required
        />
      </div>

      <input 
        type="text" 
        placeholder="Nota corta (máx. 200 caracteres)" 
        maxLength={200}
        value={note} 
        onChange={(e) => setNote(e.target.value)}
        className="p-2 border rounded w-full"
      />

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
        Guardar Registro
      </button>
    </form>
  );
};