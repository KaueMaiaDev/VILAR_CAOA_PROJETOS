import React, { useState } from "react";
import { Projeto, Atividade } from "../types";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Briefcase, CheckSquare, Clock } from "lucide-react";

interface CalendarViewProps {
  atividades: Atividade[];
  projetos: Projeto[];
  darkMode: boolean;
}

export default function CalendarView({
  atividades,
  projetos,
  darkMode
}: CalendarViewProps) {
  // We can lock base display on Year 2026, month June as current local time is 2026-06-19. Or dynamic monthly selection.
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Number of days in currentMonth
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // First day of month (0-6 representation)
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Selected date status inspector
  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate());

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  // Helper date matching
  const getFormattedDateString = (day: number) => {
    const yyyy = currentYear;
    const mm = String(currentMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Days calculations
  const calendarCells = [];
  // Fill preceding empty cells
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Fill days cells
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Find all items on selected day
  const selectedDateStr = selectedDay ? getFormattedDateString(selectedDay) : "";
  const selectedDayActivities = atividades.filter(a => a.dataLimite === selectedDateStr);
  const selectedDayProjects = projetos.filter(p => p.dataInicio === selectedDateStr || p.dataPrevistaConclusao === selectedDateStr);

  return (
    <div id="calendar-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-500" />
            Calendário de Compromissos e Marcos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhamento de cronogramas integrados, prazos de tarefas e entregas de projetos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Monthly Calendar Board (8 col) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          {/* Header Month controller */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-805 mb-4">
            <h2 className="font-sans font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                id="btn-calendar-prev"
                onClick={handlePrevMonth}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 text-slate-650 dark:text-slate-300"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                id="btn-calendar-next"
                onClick={handleNextMonth}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 text-slate-650 dark:text-slate-300"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 text-center font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider pb-2 gap-1">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Cells grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-16 bg-slate-50/40 dark:bg-slate-950/20 rounded-lg" />;
              }

              const cellDateStr = getFormattedDateString(day);
              const dayTasks = atividades.filter(a => a.dataLimite === cellDateStr);
              const dayProjs = projetos.filter(p => p.dataInicio === cellDateStr || p.dataPrevistaConclusao === cellDateStr);
              
              const isSelected = selectedDay === day;
              // June 19, 2026 representation is current day, let's mark it as highlighted
              const isToday = currentYear === 2026 && currentMonth === 5 && day === 19;

              return (
                <div 
                  id={`calendar-day-${day}`}
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`h-16 p-1.5 rounded-lg border text-left cursor-pointer flex flex-col justify-between transition-all ${
                    isSelected 
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10" 
                      : isToday 
                        ? "border-blue-600 bg-slate-100 ring-1 dark:bg-slate-800 font-bold text-blue-600 dark:text-blue-300" 
                        : "border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 hover:border-slate-200 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <span className="text-[11px] font-mono font-medium">{day}</span>

                  {/* Bullet decorators */}
                  <div className="flex flex-wrap gap-1">
                    {dayProjs.map((p, pIdx) => (
                      <span 
                        key={pIdx} 
                        className="w-2 h-2 rounded-full bg-indigo-500" 
                        title={`De: ${p.nome}`}
                      />
                    ))}
                    {dayTasks.map((t, tIdx) => (
                      <span 
                        key={tIdx} 
                        className="w-1.5 h-1.5 rounded-full bg-amber-500" 
                        title={`Tarefa: ${t.nome}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Activity Details Side Card (4 col) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col h-[400px]">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Linha do Tempo</span>
            <h2 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-200">
              {selectedDay ? `Eventos de ${selectedDateStr}` : "Selecione uma data no calendário"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {!selectedDay ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono text-center">
                Clique em qualquer dia do mês para analisar tarefas ativas e entregas.
              </div>
            ) : selectedDayActivities.length === 0 && selectedDayProjects.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-405 font-mono text-center">
                Nenhum projeto ou atividade agendado para este dia específico.
              </div>
            ) : (
              <>
                {/* Projects Start or End */}
                {selectedDayProjects.map((p) => {
                  const isEnd = p.dataPrevistaConclusao === selectedDateStr;
                  return (
                    <div key={p.id} className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-1.5">
                      <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-indigo-650 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded">
                        {isEnd ? "Encerramento do Projeto" : "Abertura do Projeto"}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{p.nome}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Área: {p.area}</p>
                    </div>
                  );
                })}

                {/* Tasks Deadlines */}
                {selectedDayActivities.map((a) => (
                  <div key={a.id} className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl space-y-1.5 animate-fade-in">
                    <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-amber-750 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                      Prazo Limite da Atividade
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{a.nome}</h4>
                    <p className="text-[10px] text-slate-400">Prioridade: {a.prioridade} | Status: {a.status}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
