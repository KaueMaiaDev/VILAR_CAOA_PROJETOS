import React, { useState } from "react";
import { Projeto, Atividade, Responsavel } from "../types";
import { FileText, Download, Briefcase, FileCheck, AlertTriangle, CheckCircle2, Layout, Sliders } from "lucide-react";

interface ReportsViewProps {
  atividades: Atividade[];
  projetos: Projeto[];
  responsables: Responsavel[];
  darkMode: boolean;
}

export default function ReportsView({
  atividades,
  projetos,
  responsables,
  darkMode
}: ReportsViewProps) {
  const [selectedRepProjId, setSelectedRepProjId] = useState<string>("todos");
  const [successExportMessage, setSuccessExportMessage] = useState<string | null>(null);
  const [printData, setPrintData] = useState<{
    type: "executive" | "detailed";
    title: string;
  } | null>(null);

  const exportToCSV = (filename: string, headers: string[], rows: string[][]) => {
    const delimiter = ";";
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(delimiter),
      ...rows.map(row => row.map(cell => {
        const val = cell !== undefined && cell !== null ? String(cell) : "";
        return `"${val.replace(/"/g, '""')}"`;
      }).join(delimiter))
    ].join("\n");

    const bom = "\uFEFF"; // Byte Order Mark for proper UTF-8 handling in Excel
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerExport = (format: "PDF" | "Excel", type: string) => {
    if (format === "Excel") {
      if (type === "Relatório Executivo Consolidado") {
        const headers = [
          "Projeto",
          "Área",
          "Status",
          "Prioridade",
          "Data Início",
          "Previsão Conclusão",
          "Atividades Totais",
          "Atividades Concluídas",
          "Progresso (%)"
        ];
        const rows = projetos.map(p => {
          const projTasks = atividades.filter(a => a.projetoId === p.id);
          const totalTasks = projTasks.length;
          const concludedTasks = projTasks.filter(a => a.status === "Concluido").length;
          const progress = totalTasks > 0 ? Math.round((concludedTasks / totalTasks) * 100) : 0;
          return [
            p.nome,
            p.area,
            p.status,
            p.prioridade,
            p.dataInicio || "N/A",
            p.dataPrevistaConclusao || "N/A",
            totalTasks.toString(),
            concludedTasks.toString(),
            `${progress}%`
          ];
        });
        exportToCSV("relatorio_executivo_consolidado", headers, rows);
      } else {
        // Relatório detalhado do projeto
        const currentProjId = selectedRepProjId === "todos" ? projetos[0]?.id : selectedRepProjId;
        const currentProj = projetos.find(p => p.id === currentProjId);
        if (!currentProj) return;

        const currentProjTasks = atividades.filter(a => a.projetoId === currentProj.id);
        const headers = [
          "Atividade",
          "Responsável",
          "Status",
          "Prioridade",
          "Data Início",
          "Data Limite",
          "Descrição"
        ];
        const rows = currentProjTasks.map(t => {
          const resp = responsables.find(r => r.id === t.responsavelId);
          return [
            t.nome,
            resp ? resp.nome : "Sem responsável",
            t.status,
            t.prioridade,
            t.dataInicio || "N/A",
            t.dataLimite || "N/A",
            t.descricao || ""
          ];
        });
        exportToCSV(`relatorio_detalhado_${currentProj.nome.toLowerCase().replace(/[^a-z0-9]/g, "_")}`, headers, rows);
      }

      setSuccessExportMessage(`Exportando planilha de ${type} em formato Excel... Arquivo baixado com sucesso!`);
      setTimeout(() => {
        setSuccessExportMessage(null);
      }, 4000);
    } else {
      // PDF export - Trigger print view
      const isExecutive = type === "Relatório Executivo Consolidado";
      setPrintData({
        type: isExecutive ? "executive" : "detailed",
        title: type
      });

      setSuccessExportMessage(`Gerando documento PDF de ${type}... Carregando visualização de impressão.`);
      setTimeout(() => {
        window.print();
        setPrintData(null);
        setSuccessExportMessage(null);
      }, 500);
    }
  };

  // 1. Calculations for Executivo report
  const activeProjects = projetos.filter(p => p.status === "Em andamento" || p.status === "Planejamento");
  const concludedProjects = projetos.filter(p => p.status === "Concluido");
  
  const criticalTasks = atividades.filter(a => a.prioridade === "Critica" && a.status !== "Concluido" && a.status !== "Cancelado");
  const hoje = new Date().toISOString().split("T")[0];
  const lateTasks = atividades.filter(a => {
    return a.status !== "Concluido" && a.status !== "Cancelado" && a.dataLimite && a.dataLimite < hoje;
  });

  // 2. Calculations for chosen project
  const currentProjId = selectedRepProjId === "todos" ? projetos[0]?.id : selectedRepProjId;
  const currentProj = projetos.find(p => p.id === currentProjId);
  const currentProjTasks = atividades.filter(a => a.projetoId === currentProjId);
  const currentProjTotal = currentProjTasks.length;
  const currentProjConcluded = currentProjTasks.filter(a => a.status === "Concluido").length;
  const currentProjPercentage = currentProjTotal > 0 ? Math.round((currentProjConcluded / currentProjTotal) * 100) : 0;
  
  const currentProjPending = currentProjTasks.filter(a => a.status !== "Concluido" && a.status !== "Cancelado");
  const currentProjLate = currentProjTasks.filter(a => a.status !== "Concluido" && a.status !== "Cancelado" && a.dataLimite && a.dataLimite < hoje);

  return (
    <div id="reports-view" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500" />
            Central de Relatórios Inteligentes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Geração de relatórios executivos para conselhos ou arquivos de auditoria em múltiplos formatos.
          </p>
        </div>
      </div>

      {/* Success Notification banner */}
      {successExportMessage && (
        <div id="export-success-banner" className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-xl text-emerald-850 dark:text-emerald-350 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successExportMessage}</span>
        </div>
      )}

      {/* Segment 1: Executivo summary report */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layout className="w-4.5 h-4.5 text-blue-500" />
              1. Relatório Consolidado Executivo (Geral)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Consolidação de esforço de toda a diretoria de inovação.</p>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0 font-semibold text-[11px]">
            <button
              id="btn-export-exec-pdf"
              onClick={() => triggerExport("PDF", "Relatório Executivo Consolidado")}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              <Download size={11} /> PDF 
            </button>
            <button
              id="btn-export-exec-excel"
              onClick={() => triggerExport("Excel", "Relatório Executivo Consolidado")}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1"
            >
              <Download size={11} /> Excel
            </button>
          </div>
        </div>

        {/* Dashboard parameters mini grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider block font-semibold">Projetos Ativos</span>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 block mt-1">{activeProjects.length}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gargalos sob foco</p>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider block font-semibold">Projetos Concluídos</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 block mt-1">{concludedProjects.length}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Iniciativas arquivadas</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider block font-semibold">Atividades Críticas</span>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 block mt-1">{criticalTasks.length}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Exigem dedicação técnica</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider block font-semibold">Atividades em Atraso</span>
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 block mt-1">{lateTasks.length}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Prazos vencidos</p>
          </div>
        </div>
      </div>

      {/* Segment 2: Individual project-specific report */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-4.5 h-4.5 text-blue-500" />
              2. Relatório de Desempenho Interno por Projeto
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Selecione uma iniciativa corporativa para compilar métricas analíticas exclusivas.</p>
          </div>

          <select
            id="report-select-proj"
            value={selectedRepProjId}
            onChange={(e) => setSelectedRepProjId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 w-full sm:w-60 mt-2 sm:mt-0"
          >
            <option value="todos">-- Escolha um Projeto --</option>
            {projetos.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        {currentProj ? (
          <div className="space-y-4 pt-2">
            
            {/* Upper stats block */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              <div>
                <span className="text-[10.5px] text-slate-400 font-mono tracking-wider block">PORCENTAGEM CONCLUÍDA</span>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-3xl font-extrabold text-blue-600">{currentProjPercentage}%</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${currentProjPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10.5px] text-slate-400 font-mono tracking-wider block">TAREFAS PENDENTES</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-200 block mt-1">
                  {currentProjPending.length} <span className="text-xs text-slate-400 font-normal">em aberto</span>
                </span>
              </div>

              <div>
                <span className="text-[10.5px] text-slate-400 font-mono tracking-wider block">VECIMENTO / PRAZO ATIVO</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block mt-2">
                  Término: {currentProj.dataPrevistaConclusao || "Sem prazo estipulado"}
                </span>
              </div>
            </div>

            {/* List of outstanding or critical tasks */}
            <div className="space-y-2">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                Tarefas Restantes Pendentes
              </span>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                {currentProjPending.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 italic font-mono">
                    Excelente! Nenhuma pendência em aberto para esta iniciativa.
                  </div>
                ) : (
                  currentProjPending.map((task) => {
                    const resp = responsables.find(r => r.id === task.responsavelId);
                    return (
                      <div key={task.id} className="p-3 bg-slate-50/20 dark:bg-slate-900/40 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{task.nome}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Resp: {resp ? resp.nome : "Não alocado"} | Prazo: {task.dataLimite || "Sem limite"}</p>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          task.prioridade === "Critica" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/25 dark:text-red-400 dark:border-red-900/60" :
                          task.prioridade === "Alta" ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/25 dark:text-orange-400 dark:border-orange-900/60" :
                          "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        }`}>
                          {task.prioridade}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Export specific project report */}
            <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
              <button
                id="btn-export-proj-pdf"
                onClick={() => triggerExport("PDF", `Relatório Detalhado - ${currentProj.nome}`)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              >
                Exportar Projeto PDF
              </button>
              <button
                id="btn-export-proj-excel"
                onClick={() => triggerExport("Excel", `Relatório Detalhado - ${currentProj.nome}`)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Exportar Planilha Excel
              </button>
            </div>

          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Por favor, crie seu primeiro projeto ou selecione uma opção válida acima para compilar o relatório por projeto.
          </div>
        )}
      </div>

      {printData && (
        <div id="print-area" className="hidden print:block p-8 bg-white text-slate-955 font-sans leading-relaxed">
          <style>{`
            @media print {
              body {
                background-color: white !important;
                color: #020617 !important;
              }
              body > div:not(#print-area),
              #root-theme,
              #root-theme > * {
                display: none !important;
                height: 0 !important;
                overflow: hidden !important;
                visibility: hidden !important;
              }
              #print-area {
                display: block !important;
                visibility: visible !important;
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
              }
            }
          `}</style>
          
          <div className="border-b-2 border-blue-600 pb-4 mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-blue-900 uppercase tracking-tight">Agente de Projetos por Vilar</h1>
              <p className="text-[10px] text-slate-500 font-mono">Sistema de Gestão de Atividades e Governança Corporativa</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-700">{printData.title}</p>
              <p className="text-[9px] text-slate-500 font-mono">Emissão: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}</p>
            </div>
          </div>

          {printData.type === "executive" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-center border-r border-slate-200">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Projetos Ativos</span>
                  <span className="text-lg font-bold text-slate-800 block mt-0.5">{activeProjects.length}</span>
                </div>
                <div className="text-center border-r border-slate-200">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Projetos Concluídos</span>
                  <span className="text-lg font-bold text-emerald-600 block mt-0.5">{concludedProjects.length}</span>
                </div>
                <div className="text-center border-r border-slate-200">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Atividades Críticas</span>
                  <span className="text-lg font-bold text-amber-600 block mt-0.5">{criticalTasks.length}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Atividades em Atraso</span>
                  <span className="text-lg font-bold text-rose-600 block mt-0.5">{lateTasks.length}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Portfólio de Projetos</h3>
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                      <th className="p-2 border border-slate-200">Nome do Projeto</th>
                      <th className="p-2 border border-slate-200">Setor/Área</th>
                      <th className="p-2 border border-slate-200">Prioridade</th>
                      <th className="p-2 border border-slate-200">Status</th>
                      <th className="p-2 border border-slate-200 text-center">Atividades</th>
                      <th className="p-2 border border-slate-200 text-center">Progresso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projetos.map(p => {
                      const pTasks = atividades.filter(a => a.projetoId === p.id);
                      const doneTasks = pTasks.filter(a => a.status === "Concluido").length;
                      const prog = pTasks.length > 0 ? Math.round((doneTasks / pTasks.length) * 100) : 0;
                      return (
                        <tr key={p.id} className="border-b border-slate-200">
                          <td className="p-2 border border-slate-200 font-semibold text-slate-850">{p.nome}</td>
                          <td className="p-2 border border-slate-200 text-slate-600">{p.area}</td>
                          <td className="p-2 border border-slate-200 text-center">{p.prioridade}</td>
                          <td className="p-2 border border-slate-200 text-center">{p.status}</td>
                          <td className="p-2 border border-slate-200 text-center font-mono">{doneTasks}/{pTasks.length}</td>
                          <td className="p-2 border border-slate-200 text-center font-bold text-blue-700 font-mono">{prog}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {currentProj && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h2 className="text-sm font-bold text-slate-850 uppercase mb-2">{currentProj.nome}</h2>
                  <p className="text-[11px] text-slate-600 mb-3">{currentProj.descricao || "Nenhuma descrição fornecida."}</p>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="border-r border-slate-200">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Área Coordenadora</span>
                      <span className="text-xs font-bold text-slate-850 block mt-0.5">{currentProj.area}</span>
                    </div>
                    <div className="border-r border-slate-200">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Início / Conclusão</span>
                      <span className="text-xs font-bold text-slate-850 block mt-0.5">{currentProj.dataInicio || "N/A"} - {currentProj.dataPrevistaConclusao || "N/A"}</span>
                    </div>
                    <div className="border-r border-slate-200">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Status Atual</span>
                      <span className="text-xs font-bold text-slate-850 block mt-0.5">{currentProj.status}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Progresso Geral</span>
                      <span className="text-xs font-bold text-blue-700 block mt-0.5">{currentProjPercentage}%</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Cronograma de Atividades</h3>
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                      <th className="p-2 border border-slate-200">Nome da Atividade</th>
                      <th className="p-2 border border-slate-200">Responsável</th>
                      <th className="p-2 border border-slate-200 text-center">Prioridade</th>
                      <th className="p-2 border border-slate-200 text-center">Prazo Limite</th>
                      <th className="p-2 border border-slate-200 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProjTasks.map(t => {
                      const resp = responsables.find(r => r.id === t.responsavelId);
                      return (
                        <tr key={t.id} className="border-b border-slate-200">
                          <td className="p-2 border border-slate-200 font-semibold text-slate-850">{t.nome}</td>
                          <td className="p-2 border border-slate-200 text-slate-600">{resp ? resp.nome : "Sem responsável"}</td>
                          <td className="p-2 border border-slate-200 text-center">{t.prioridade}</td>
                          <td className="p-2 border border-slate-200 text-center font-mono">{t.dataLimite || "N/A"}</td>
                          <td className="p-2 border border-slate-200 text-center font-semibold">{t.status}</td>
                        </tr>
                      );
                    })}
                    {currentProjTasks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center italic text-slate-400">Nenhuma atividade cadastrada neste projeto.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-16 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-500">
            <p>Este relatório foi extraído eletronicamente e é válido como documento de auditoria interna.</p>
            <p className="mt-1">Agente de Projetos - Solução de Governança Corporativa Segura</p>
          </div>
        </div>
      )}

    </div>
  );
}
