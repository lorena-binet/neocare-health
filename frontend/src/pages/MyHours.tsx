import React, { useState, useEffect } from 'react';

export const MyHours = ({ token }: { token: string }) => {
  const [currentMonday, setCurrentMonday] = useState(() => {
    const d = new Date();
    const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });

  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchWeeklyLogs = async () => {
      const res = await fetch(`http://localhost:8000/worklogs/weekly?start_date=${currentMonday}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    };
    fetchWeeklyLogs();
  }, [currentMonday, token]);

  const changeWeek = (days: number) => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + days);
    setCurrentMonday(d.toISOString().split('T')[0]);
  };

  const totalHours = logs.reduce((acc, item) => acc + item.hours, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Horas Semanales</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => changeWeek(-7)} className="p-2 bg-gray-200 rounded">&larr; Semana Anterior</button>
          <span className="font-semibold">Semana del {currentMonday}</span>
          <button onClick={() => changeWeek(7)} className="p-2 bg-gray-200 rounded">Semana Siguiente &rarr;</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6 border">
        <h2 className="text-lg font-semibold text-gray-700">Total Semanal: <span className="text-blue-600">{totalHours} hrs</span></h2>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded border text-gray-500">
          No hay registros de tiempo imputados en esta semana.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="p-4 bg-white rounded shadow border flex justify-between items-center">
              <div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">{log.date}</span>
                <span className="text-gray-700">{log.note || 'Sin nota'}</span>
              </div>
              <span className="font-bold text-gray-800">{log.hours} hrs</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};