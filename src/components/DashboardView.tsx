import React, { useEffect, useState } from "react";
import { 
  Projeto, 
  Atividade, 
  Demanda, 
  DashboardMetrics 
} from "../types";
import { 
  Briefcase, 
  CheckSquare, 
  Clock, 
  PauseCircle, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";

interface DashboardViewProps {
  projetos: Projeto[];
  atividades: Atividade[];
  demandas: Demanda[];
  responsables: any[];
  onNavigateToTab: (tab: string) => void;
  onSelectProject: (projId: string) => void;
  darkMode: boolean;
}

export default function DashboardView({
  projetos,
  atividades,
  demandas,
  responsables,
  onNavigateToTab,
  onSelectProject,
  darkMode
}: DashboardViewProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProjetos: 0,
    projetosAtivos: 0,
    projetosPausados: 0,
    projetosConcluidos: 0,
    totalAtividades: 0,
    atividadesPendentes: 0,
    atividadesEmAndamento: 0,
    atividadesConcluidas: 0,
    atividadesAtrasadas: 0,
  });

  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);

  useEffect(() => {
    // Calculate metrics locally on load & updates
    const totalP = projetos.length;
    const ativosP = projetos.filter(p => p.status === "Em andamento" || p.status === "Planejamento").length;
    const pausadosP = projetos.filter(p => p.status === "Pausado").length;
    const concluidosP = projetos.filter(p => p.status === "Concluido").length;

    const totalA = atividades.length;
    const pendentesA = atividades.filter(a => a.status === "Pendente").length;
    const emAndamentoA = atividades.filter(a => a.status === "Em andamento" || a.status === "Em validacao").length;
    const concluidasA = atividades.filter(a => a.status === "Concluido").length;

    const hoje = new Date().toLocaleDateString("sv-SE");
    const atrasadasA = atividades.filter(a => {
      return a.status !== "Concluido" && a.status !== "Cancelado" && a.dataLimite && a.dataLimite < hoje;
    }).length;

    setMetrics({
      totalProjetos: totalP,
      projetosAtivos: ativosP,
      projetosPausados: pausadosP,
      projetosConcluidos: concluidosP,
      totalAtividades: totalA,
      atividadesPendentes: pendentesA,
      atividadesEmAndamento: emAndamentoA,
      atividadesConcluidas: concluidasA,
      atividadesAtrasadas: atrasadasA
    });
  }, [projetos, atividades]);

  // Calculations for charts
  // 1. Status distribution (Pendente, Em Andamento, Em Validação, Pausado, Concluido, Cancelado)
  const statusCounts = {
    Pendente: atividades.filter(a => a.status === "Pendente").length,
    Andamento: atividades.filter(a => a.status === "Em andamento").length,
    Validacao: atividades.filter(a => a.status === "Em validacao").length,
    Pausado: atividades.filter(a => a.status === "Pausado").length,
    Concluido: atividades.filter(a => a.status === "Concluido").length,
  };

  const totalChartTasks = statusCounts.Pendente + statusCounts.Andamento + statusCounts.Validacao + statusCounts.Pausado + statusCounts.Concluido || 1;

  const pieData = [
    { label: "Pendente", value: statusCounts.Pendente, color: "stroke-amber-500 fill-amber-500", bg: "bg-amber-500", text: "text-amber-500" },
    { label: "Em andamento", value: statusCounts.Andamento, color: "stroke-blue-500 fill-blue-500", bg: "bg-blue-500", text: "text-blue-500" },
    { label: "Em validação", value: statusCounts.Validacao, color: "stroke-indigo-500 fill-indigo-500", bg: "bg-indigo-500", text: "text-indigo-500" },
    { label: "Pausado", value: statusCounts.Pausado, color: "stroke-cyan-500 fill-cyan-500", bg: "bg-cyan-500", text: "text-cyan-500" },
    { label: "Concluído", value: statusCounts.Concluido, color: "stroke-emerald-500 fill-emerald-500", bg: "bg-emerald-500", text: "text-emerald-500" },
  ];

  // Donut chart path generation
  let accumulatedPercent = 0;
  const donutSlices = pieData.map((slice) => {
    const percent = slice.value / totalChartTasks;
    const startPercent = accumulatedPercent;
    accumulatedPercent += percent;
    return {
      ...slice,
      percent,
      startPercent,
    };
  });

  // 2. Activities per project
  const projectBars = projetos.map((proj) => {
    const count = atividades.filter(a => a.projetoId === proj.id).length;
    return {
      id: proj.id,
      name: proj.nome,
      count
    };
  });

  const maxTaskCountInProject = Math.max(...projectBars.map(p => p.count), 1);

  // 3. Timeline / Next Deliveries
  const hojeStr = new Date().toLocaleDateString("sv-SE");
  const hojeDisplay = new Date().toLocaleDateString("pt-BR");
  const proximasEntregas = [...atividades]
    .filter(a => a.status !== "Concluido" && a.status !== "Cancelado" && a.dataLimite)
    .sort((a, b) => a.dataLimite.localeCompare(b.dataLimite))
    .slice(0, 5);

  // Warnings / Notifications
  const alertasVencimento = atividades.filter(a => {
    const isLate = a.status !== "Concluido" && a.status !== "Cancelado" && a.dataLimite && a.dataLimite < hojeStr;
    const isClose = !isLate && a.status !== "Concluido" && a.status !== "Cancelado" && a.dataLimite && (
      new Date(a.dataLimite).getTime() - new Date(hojeStr).getTime() < 3 * 24 * 60 * 60 * 1000
    );
    return isLate || isClose;
  });

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Painel Executivo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhamento de objetivos corporativos, entregas e eficiência.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          <Calendar size={14} className="text-blue-500" />
          Fuso Local: {hojeDisplay} (Hoje)
        </div>
      </div>

      {/* Primary KPI Tiles Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Projetos */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase font-mono tracking-wider">Projetos</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-950 dark:text-slate-50">{metrics.totalProjetos}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">cadastrados</span>
            </div>
            <div className="flex gap-2 mt-1 text-[10px] text-slate-500 font-mono">
              <span className="text-blue-600">Ativos: {metrics.projetosAtivos}</span>
              <span>•</span>
              <span className="text-emerald-600">Fin: {metrics.projetosConcluidos}</span>
            </div>
          </div>
        </div>

        {/* KPI: Atividades */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
            <CheckSquare size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase font-mono tracking-wider">Atividades</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-950 dark:text-slate-50">{metrics.totalAtividades}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">tarefas</span>
            </div>
            <div className="flex gap-2 mt-1 text-[10px] text-slate-500 font-mono">
              <span className="text-amber-600 font-medium">Pend: {metrics.atividadesPendentes}</span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">Concl: {metrics.atividadesConcluidas}</span>
            </div>
          </div>
        </div>

        {/* KPI: Andamento */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase font-mono tracking-wider">Em Execução</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-950 dark:text-slate-50">{metrics.atividadesEmAndamento}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">atividades</span>
            </div>
            <p className="text-[10px] text-indigo-500 font-mono mt-1">Foco de entrega ativa</p>
          </div>
        </div>

        {/* KPI: Atrasos críticos */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className={`p-3 rounded-lg ${metrics.atividadesAtrasadas > 0 ? 'bg-red-100 dark:bg-red-900/35 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase font-mono tracking-wider">Atrasadas</p>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold ${metrics.atividadesAtrasadas > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-200"}`}>{metrics.atividadesAtrasadas}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">fora do prazo</span>
            </div>
            <p className="text-[10px] font-mono mt-1 text-slate-500">
              {metrics.atividadesAtrasadas > 0 ? "Exige atenção imediata!" : "Tudo em dia!"}
            </p>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Donut de Status das Atividades */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
            <Layers className="w-4.5 h-4.5 text-blue-500" />
            Distribuição de Atividades (Status)
          </h2>
          <p className="text-xs text-slate-500 mb-4">Volume percentual de tarefas por status em tempo real.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-around h-56 gap-4">
            {/* SVG Donut Circle */}
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="12" />
                {totalChartTasks > 0 && donutSlices.map((slice, i) => {
                  const r = 40;
                  const circ = 2 * Math.PI * r;
                  const strokeLength = circ * slice.percent;
                  const strokeOffset = circ * (1 - slice.startPercent);
                  
                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r={r}
                      fill="transparent"
                      className={`transition-all duration-500 ${slice.color}`}
                      strokeWidth={hoveredPieIndex === i ? "15" : "12"}
                      strokeDasharray={`${strokeLength} ${circ}`}
                      strokeDashoffset={-slice.startPercent * circ}
                      strokeLinecap="round"
                      onMouseEnter={() => setHoveredPieIndex(i)}
                      onMouseLeave={() => setHoveredPieIndex(null)}
                      style={{ cursor: "pointer" }}
                    />
                  );
                })}
              </svg>
              {/* Dynamic Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">{atividades.length}</span>
                <span className="text-[10px] text-slate-400 font-mono uppercase">Atividades</span>
              </div>
            </div>

            {/* Legends */}
            <div className="flex flex-col gap-2.5 w-full sm:w-1/2">
              {pieData.map((slice, i) => {
                const pct = ((slice.value / (atividades.length || 1)) * 100).toFixed(0);
                return (
                  <div 
                    key={i} 
                    className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-colors ${
                      hoveredPieIndex === i ? "bg-slate-150 dark:bg-slate-800" : ""
                    }`}
                    onMouseEnter={() => setHoveredPieIndex(i)}
                    onMouseLeave={() => setHoveredPieIndex(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${slice.bg}`} />
                      <span className="text-slate-600 dark:text-slate-400 font-medium">{slice.label}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-300">
                      {slice.value} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 2: Atividades por Projeto (Barra Horizontal) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-blue-500" />
              Quantidade de Atividades por Projeto
            </h2>
            <p className="text-xs text-slate-500 mb-4">Carga de trabalho distribuída por iniciativa ativa.</p>
          </div>
          
          <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
            {projectBars.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400 font-mono">
                Por favor, crie seu primeiro projeto para visualizar.
              </div>
            ) : (
              projectBars.map((p, idx) => {
                const percent = (p.count / maxTaskCountInProject) * 100;
                return (
                  <div key={p.id} className="space-y-1.5 cursor-pointer hover:opacity-90" onClick={() => onSelectProject(p.id)}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-sans font-medium text-slate-700 dark:text-slate-300 truncate w-3/4">{p.name}</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{p.count} task{p.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 hover:bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Warnings & Timeline Deliveries Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Alert Card / Warning panel (4 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-96">
          <div className="mb-4">
            <h2 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
              Notificações e Alertas
            </h2>
            <p className="text-xs text-slate-500">Alertas críticos de entrega e riscos.</p>
          </div>

          <div id="alerts-container" className="flex-1 overflow-y-auto space-y-3 pr-1">
            {alertasVencimento.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Excelente!</p>
                <p className="text-[11px] text-slate-400 font-mono mt-1">Nenhuma atividade atrasada ou próxima ao vencimento.</p>
              </div>
            ) : (
              alertasVencimento.map((a) => {
                const isAtrasada = a.dataLimite && a.dataLimite < hojeStr;
                return (
                  <div 
                    key={a.id} 
                    className={`p-3 rounded-lg border flex gap-3 cursor-pointer transition-colors ${
                      isAtrasada 
                        ? "bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30" 
                        : "bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30"
                    }`}
                    onClick={() => {
                      onSelectProject(a.projetoId);
                    }}
                  >
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${isAtrasada ? "text-red-500" : "text-amber-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{a.nome}</p>
                      <div className="flex justify-between items-center mt-1 text-[10px] font-mono">
                        <span className="text-slate-500 truncate max-w-[120px]">
                          Proj: {projetos.find(p => p.id === a.projetoId)?.nome || "Não encontrado"}
                        </span>
                        <span className={`font-bold ${isAtrasada ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {isAtrasada ? `Atrasado: ${a.dataLimite}` : `Vence em: ${a.dataLimite}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Next Deliveries Timeline (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-96">
          <div className="mb-4">
            <h2 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-blue-500" />
                Próximas Entregas (Cronograma)
              </span>
              <button 
                onClick={() => onNavigateToTab("calendario")}
                className="text-[11px] font-sans font-medium text-blue-600 hover:text-blue-500 flex items-center gap-0.5"
              >
                Ver Calendário <ArrowRight size={12} />
              </button>
            </h2>
            <p className="text-xs text-slate-500">Estágio de datas e prioridade das próximas tarefas.</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {proximasEntregas.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                Sem próximas entregas pendentes em aberto.
              </div>
            ) : (
              proximasEntregas.map((a) => {
                const rName = responsables.find(r => r.id === a.responsavelId)?.nome || "Sem responsável";
                const pName = projetos.find(p => p.id === a.projetoId)?.nome || "Deletado";
                return (
                  <div key={a.id} className="flex gap-4">
                    {/* Date Block */}
                    <div className="w-20 shrink-0 flex flex-col justify-center items-center font-mono py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">Limite</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {a.dataLimite ? a.dataLimite.substring(5) : "S/D"}
                      </span>
                    </div>

                    {/* Task Info details */}
                    <div className="flex-1 min-w-0 border-b border-slate-100 dark:border-slate-850 pb-3 flex justify-between items-center gap-3">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate hover:text-blue-600" onClick={() => onSelectProject(a.projetoId)}>
                          {a.nome}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-slate-400 font-mono">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5 max-w-[120px] truncate">
                            {pName}
                          </span>
                          <span>•</span>
                          <span>Resp: {rName}</span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full select-none ${
                        a.prioridade === "Critica" ? "bg-red-100 text-red-700 border border-red-200" :
                        a.prioridade === "Alta" ? "bg-orange-100 text-orange-700 border border-orange-200" :
                        a.prioridade === "Media" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                        "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {a.prioridade}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
