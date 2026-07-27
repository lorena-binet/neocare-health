import React, { useState, useEffect } from 'react';

// Interfaz para definir el tipo de dato de cada registro de horas
interface WorkLog {
  id: number;
  card_id: number;
  user_id: number;
  hours: number;
  date: string;
  note?: string;
}

interface MyHoursProps {
  token: string;
}

export const MyHours: React.FC<MyHoursProps> = ({ token }) => {
  // Estado para gestionar la fecha del lunes de la semana actual
  const [currentMonday, setCurrentMonday] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay();
    // Ajuste para obtener siempre la fecha del lunes de la semana en curso
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });

  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Efecto para consultar las horas semanales cada vez que cambia la semana o el token (Punto 15 y 16)
  useEffect(() => {
    const fetchWeeklyLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/worklogs/weekly?start_date=${currentMonday}`, {
          headers: { 
            'Authorization': `Bearer ${token}` 
          }
        });

        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        } else {
          console.error("Error al consultar las horas semanales");
        }
      } catch (error) {
        console.error("Error de conexión al obtener los worklogs:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchWeeklyLogs();
    }
  }, [currentMonday, token]);

  // Función para avanzar o retroceder de semana (+7 días o -7 días)
  const changeWeek = (days: number) => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + days);
    setCurrentMonday(d.toISOString().split('T')[0]);
  };

  // Cálculo del total de horas registradas en la semana actual
  const totalHours = logs.reduce((acc, item) => acc + item.hours, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Cabecera y Selector de Semana */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">⏱️ Mis Horas Semanales</h1>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
          <button 
            onClick={() => changeWeek(-7)} 
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-semibold transition"
          >
            &larr; Anterior
          </button>
          
          <span className="font-semibold text-sm text-gray-700 min-w-[150px] text-center">
            Semana del {currentMonday}
          </span>
          
          <button 
            onClick={() => changeWeek(7)} 
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-semibold transition"
          >
            Siguiente &rarr;
          </button>
        </div>
      </div>

      {/* Resumen de Totales */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Resumen de tiempo</p>
          <h2 className="text-xl font-bold text-gray-800">
            Total acumulado: <span className="text-blue-600">{totalHours} hrs</span>
          </h2>
        </div>
      </div>

      {/* Listado de Registros o Estado Vacío (Punto 16) */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg border text-gray-500">
          Cargando registros...
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
          <p className="text-lg font-medium text-gray-600 mb-1">📅 Sin registros de tiempo</p>
          <p className="text-sm">No hay datos imputados para esta semana seleccionada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div 
              key={log.id} 
              className="p-4 bg-white rounded-lg shadow-sm border hover:border-gray-300 transition flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded">
                  {log.date}
                </span>
                <span className="text-sm text-gray-700 font-medium">
                  {log.note || <span className="italic text-gray-400">Sin nota de trabajo</span>}
                </span>
              </div>
              <span className="font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded border text-sm">
                {log.hours} hrs
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};