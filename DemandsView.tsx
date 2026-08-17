import React, { useState } from "react";
import { Demanda } from "../types";
import { 
  Lightbulb, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  XOctagon, 
  Sparkles, 
  Search, 
  User, 
  Calendar,
  AlertCircle,
  Clock
} from "lucide-react";

interface DemandsViewProps {
  demandas: Demanda[];
  onAddDemanda: (d: Partial<Demanda>) => Promise<void>;
  onUpdateDemanda: (id: string, updates: Partial<Demanda>) => Promise<void>;
  onConvertDemanda: (id: string) => Promise<any>;
  darkMode: boolean;
}

export default function DemandsView({
  demandas,
  onAddDemanda,
  onUpdateDemanda,
  onConvertDemanda,
  darkMode
}: DemandsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [dataRecebimento, setDataRecebimento] = useState(new Date().toISOString().split("T")[0]);
  const [prioridade, setPrioridade] = useState<'Baixa' | 'Media' | 'Alta' | 'Critica'>("Media");

  const [convertingId, setConvertingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    await onAddDemanda({
      titulo,
      descricao,
      solicitante,
      dataRecebimento,
      prioridade,
      status: "Nova"
    });

    // Reset Form
    setTitulo("");
    setDescricao("");
    setSolicitante("");
    setDataRecebimento(new Date().toISOString().split("T")[0]);
    setPrioridade("Media");
    setShowAddForm(false);
  };

  const handleConvert = async (demId: string) => {
    setConvertingId(demId);
    try {
      await onConvertDemanda(demId);
    } catch (err) {
      console.error("Erro ao converter demanda:", err);
    } finally {
      setConvertingId(null);
    }
  };

  // Filter demands
  const filtered = demandas.filter((dem) => {
    const matchesStatus = filterStatus === "todos" || dem.status === filterStatus;
    const matchesSearch = 
      dem.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dem.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dem.solicitante.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Nova":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "Em analise":
        return "bg-amber-100 text-amber-700 border border-amber-200";
      case "Aprovada":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "Rejeitada":
        return "bg-red-100 text-red-700 border border-red-200";
      case "Transformada em Projeto":
        return "bg-indigo-100 text-indigo-700 border border-indigo-200";
      default:
        return "bg-slate-100 text-slate-800 border border-slate-200";
    }
  };

  const getPriorityStyle = (prio: string) => {
    switch (prio) {
      case "Critica":
        return "bg-rose-50 text-rose-700 border border-rose-100";
      case "Alta":
        return "bg-orange-50 text-orange-700 border border-orange-100";
      case "Media":
        return "bg-blue-50 text-blue-700 border border-blue-100";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-100";
    }
  };

  return (
    <div id="demands-view" className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-blue-500" />
            Ideário e Demandas Recebidas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acolhimento, triagem rápida e conversão instantânea de ideias corporativas para projetos estruturados.
          </p>
        </div>
        <button
          id="btn-add-demand"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs shrink-0 transition-colors"
        >
          <Plus size={16} /> Nova Demanda
        </button>
      </div>

      {/* Add Demand Form Collapsible */}
      {showAddForm && (
        <form 
          id="add-demand-form"
          onSubmit={handleSubmit} 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs space-y-4 animate-fade-in"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Registrar Nova Demanda
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Título da Solicitação / Ideia *</label>
              <input
                id="demand-field-title"
                type="text"
                placeholder="Ex: Refatorar fluxo de Onboarding no SAP"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Descrição Detalhada</label>
              <textarea
                id="demand-field-desc"
                placeholder="Explique o problema a ser resolvido, dores do negócio e objetivos gerais..."
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Solicitante (Área ou Nome) *</label>
              <input
                id="demand-field-solicitante"
                type="text"
                placeholder="Ex: Diretoria de Vendas / Ana PMO"
                required
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Data de Recebimento</label>
              <input
                id="demand-field-date"
                type="date"
                required
                value={dataRecebimento}
                onChange={(e) => setDataRecebimento(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Prioridade Inicial</label>
              <select
                id="demand-field-priority"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="Baixa">Baixa</option>
                <option value="Media">Média</option>
                <option value="Alta">Alta</option>
                <option value="Critica">Crítica</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              id="btn-cancel-demand"
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-demand"
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Salvar Demanda
            </button>
          </div>
        </form>
      )}

      {/* Filters and search section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="demand-search"
            type="text"
            placeholder="Pesquisar demandas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
          />
        </div>

        {/* Status selection pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {["todos", "Nova", "Em analise", "Aprovada", "Rejeitada", "Transformada em Projeto"].map((status) => {
            const label = status === "todos" ? "Todas" : status === "Em analise" ? "Em Análise" : status;
            const isSelected = filterStatus === status;
            return (
              <button
                id={`filter-demand-${status.replace(" ", "-")}`}
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                  isSelected 
                    ? "bg-slate-900 border-slate-950 text-white dark:bg-slate-100 dark:border-slate-200 dark:text-slate-900" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-16 text-center rounded-xl">
            <Lightbulb className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhuma demanda encontrada</p>
            <p className="text-xs text-slate-400 mt-1">Experimente mudar seus filtros ou clique em "Nova Demanda".</p>
          </div>
        ) : (
          filtered.map((dem) => {
            return (
              <div 
                id={`demand-card-${dem.id}`}
                key={dem.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Status header & Tag */}
                  <div className="flex items-center justify-between gap-2.5">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${getStatusStyle(dem.status)}`}>
                      {dem.status === "Em analise" ? "Em Análise" : dem.status}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${getPriorityStyle(dem.prioridade)}`}>
                      {dem.prioridade}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-slate-100">
                      {dem.titulo}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">
                      {dem.descricao || "Sem justificativa ou explicação cadastrada."}
                    </p>
                  </div>
                </div>

                {/* Footer details */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 mt-4 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <User size={13} className="text-slate-400" />
                      {dem.solicitante}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-slate-400" />
                      {dem.dataRecebimento}
                    </span>
                  </div>

                  {/* Operational Flow Action Buttons */}
                  <div className="flex gap-2 justify-end">
                    {/* Status transition triage */}
                    {dem.status === "Nova" && (
                      <button
                        id={`btn-triage-analise-${dem.id}`}
                        onClick={() => onUpdateDemanda(dem.id, { status: "Em analise" })}
                        className="text-[10px] font-serif tracking-tight text-amber-600 hover:text-amber-500 font-semibold px-2.5 py-1 border border-amber-200 hover:bg-amber-50 rounded"
                      >
                        Avaliar Ideia
                      </button>
                    )}

                    {dem.status === "Em analise" && (
                      <>
                        <button
                          id={`btn-triage-rejeitar-${dem.id}`}
                          onClick={() => onUpdateDemanda(dem.id, { status: "Rejeitada" })}
                          className="text-[10px] text-red-600 hover:text-red-500 px-2 py-1 border border-red-200 hover:bg-red-50 rounded"
                        >
                          Recusar
                        </button>
                        <button
                          id={`btn-triage-aprovar-${dem.id}`}
                          onClick={() => onUpdateDemanda(dem.id, { status: "Aprovada" })}
                          className="text-[10px] font-sans text-emerald-600 hover:text-emerald-500 font-semibold px-2.5 py-1 border border-emerald-200 hover:bg-emerald-50 rounded"
                        >
                          Aprovar
                        </button>
                      </>
                    )}

                    {/* Converter em Projeto */}
                    {(dem.status === "Aprovada" || dem.status === "Em analise" || dem.status === "Nova") && (
                      <button
                        id={`btn-convert-${dem.id}`}
                        onClick={() => handleConvert(dem.id)}
                        disabled={convertingId === dem.id}
                        className="bg-indigo-600 hover:bg-indigo-505 disabled:bg-indigo-300 text-white font-sans font-semibold text-[10px] px-3 py-1 rounded inline-flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        {convertingId === dem.id ? (
                          <span>Criando...</span>
                        ) : (
                          <>
                            Converter em Projeto <ArrowRight size={12} />
                          </>
                        )}
                      </button>
                    )}

                    {dem.status === "Transformada em Projeto" && (
                      <div className="text-[11px] text-indigo-600 font-bold bg-indigo-50/70 border border-indigo-100 px-3 py-1 rounded-md flex items-center gap-1 select-none">
                        <CheckCircle2 size={13} /> Projeto Ativado!
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
