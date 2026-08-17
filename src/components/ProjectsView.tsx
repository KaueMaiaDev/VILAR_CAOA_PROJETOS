import React, { useState } from "react";
import { Projeto, Atividade, Responsavel } from "../types";
import { 
  Folder, 
  FolderOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Briefcase,
  AlertCircle
} from "lucide-react";

interface ProjectsViewProps {
  projetos: Projeto[];
  atividades: Atividade[];
  responsables: Responsavel[];
  onAddProjeto: (p: Partial<Projeto>) => Promise<void>;
  onUpdateProjeto: (id: string, updates: Partial<Projeto>) => Promise<void>;
  onDeleteProjeto: (id: string) => Promise<void>;
  onSelectProject: (id: string) => void;
  selectedProjectId: string | null;
  darkMode: boolean;
}

export default function ProjectsView({
  projetos,
  atividades,
  responsables,
  onAddProjeto,
  onUpdateProjeto,
  onDeleteProjeto,
  onSelectProject,
  selectedProjectId,
  darkMode
}: ProjectsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterArea, setFilterArea] = useState("todos");

  // Project Form State
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [area, setArea] = useState("");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataPrevistaConclusao, setDataPrevistaConclusao] = useState("");
  const [prioridade, setPrioridade] = useState<'Baixa' | 'Media' | 'Alta' | 'Critica'>("Media");

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    if (editingId) {
      await onUpdateProjeto(editingId, {
        nome,
        descricao,
        area,
        dataInicio,
        dataPrevistaConclusao,
        prioridade
      });
      setEditingId(null);
    } else {
      await onAddProjeto({
        nome,
        descricao,
        area: area || "Geral",
        dataInicio,
        dataPrevistaConclusao,
        prioridade,
        status: "Planejamento"
      });
    }

    // Reset Form
    setNome("");
    setDescricao("");
    setArea("");
    setDataInicio(new Date().toISOString().split("T")[0]);
    setDataPrevistaConclusao("");
    setPrioridade("Media");
    setShowAddForm(false);
  };

  const handleStartEdit = (proj: Projeto) => {
    setEditingId(proj.id);
    setNome(proj.nome);
    setDescricao(proj.descricao);
    setArea(proj.area);
    setDataInicio(proj.dataInicio);
    setDataPrevistaConclusao(proj.dataPrevistaConclusao);
    setPrioridade(proj.prioridade);
    setShowAddForm(true);
  };

  const areas = Array.from(new Set(projetos.map(p => p.area)));

  const filteredProjetos = projetos.filter(p => {
    return filterArea === "todos" || p.area === filterArea;
  });

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case "Critica":
        return "bg-red-100 text-red-700 border border-red-200";
      case "Alta":
        return "bg-orange-100 text-orange-700 border border-orange-200";
      case "Media":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Concluido":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "Pausado":
        return "bg-amber-100 text-amber-700 border border-amber-200";
      case "Em andamento":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  return (
    <div id="projects-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-500" />
            Estrutura de Pastas de Projetos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cada diretório representa uma iniciativa de inovação independente com prazos, responsáveis e entregáveis vinculados.
          </p>
        </div>
        <button
          id="btn-add-p"
          onClick={() => {
            setEditingId(null);
            setShowAddForm(!showAddForm);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs shrink-0 transition-colors"
        >
          <Plus size={16} /> Novo Projeto
        </button>
      </div>

      {showAddForm && (
        <form 
          id="add-project-form"
          onSubmit={handleSubmit} 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs space-y-4 animate-fade-in"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              {editingId ? "Editar Detalhes do Projeto" : "Modelar Novo Projeto Corporativo"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nome da Iniciativa *</label>
              <input
                id="proj-field-name"
                type="text"
                required
                placeholder="Ex: Plataforma Omnichannel DX V2"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Escopo e Descrição do Projeto</label>
              <textarea
                id="proj-field-desc"
                placeholder="Metas corporativas, justificativa de implantação e principais marcos esperados..."
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Área Responsável</label>
              <input
                id="proj-field-area"
                type="text"
                placeholder="Ex: Inovação, Engenharia, RH, Compliance"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Prioridade Corporativa</label>
              <select
                id="proj-field-priority"
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Data de Início</label>
              <input
                id="proj-field-start"
                type="date"
                required
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Data Prevista de Conclusão</label>
              <input
                id="proj-field-end"
                type="date"
                required
                value={dataPrevistaConclusao}
                onChange={(e) => setDataPrevistaConclusao(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              id="btn-cancel-proj"
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-850"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-proj"
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Confirmar
            </button>
          </div>
        </form>
      )}

      {/* Filter by Area Pills */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="filter-proj-area-todos"
            onClick={() => setFilterArea("todos")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              filterArea === "todos"
                ? "bg-slate-900 border-slate-950 text-white dark:bg-slate-100 dark:border-slate-200 dark:text-slate-900"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            Todas as Áreas
          </button>
          {areas.map((ar) => (
            <button
              id={`filter-proj-area-${ar.replace(" ", "-")}`}
              key={ar}
              onClick={() => setFilterArea(ar)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                filterArea === ar
                  ? "bg-slate-900 border-slate-950 text-white dark:bg-slate-100 dark:border-slate-200 dark:text-slate-900"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              {ar}
            </button>
          ))}
        </div>
      </div>

      {/* Folder Structure Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredProjetos.map((proj) => {
          const isSelected = selectedProjectId === proj.id;
          const projAtividades = atividades.filter(a => a.projetoId === proj.id);
          const totalTasks = projAtividades.length;
          const completedTasks = projAtividades.filter(a => a.status === "Concluido").length;
          const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return (
            <div 
              id={`project-folder-${proj.id}`}
              key={proj.id}
              className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                isSelected 
                  ? "border-blue-500 ring-1 ring-blue-500 dark:border-blue-600" 
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {/* Folder Top Tab styling to represent Directory */}
              <div 
                className={`py-2 px-4 text-[10px] font-mono tracking-wider uppercase border-b flex justify-between items-center ${
                  isSelected 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
              >
                <span>DIR: {proj.area}</span>
                <span className="font-semibold">{proj.prioridade}</span>
              </div>

              {/* Folder Inner Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div onClick={() => onSelectProject(proj.id)} className="cursor-pointer group space-y-1">
                  <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                    {proj.nome}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 h-8">
                    {proj.descricao || "Sem resumo definido."}
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-450 dark:text-slate-400">Progresso Geral</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{completionPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
                    <span>Tarefas: {completedTasks}/{totalTasks}</span>
                    <span className={`px-1.5 py-0.5 rounded ${getStatusBadge(proj.status)}`}>{proj.status}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50/50 dark:bg-slate-900/55 border-t border-slate-200 dark:border-slate-800 py-2 px-4 flex items-center justify-between">
                <button
                  id={`btn-open-proj-${proj.id}`}
                  onClick={() => onSelectProject(proj.id)}
                  className="text-[11px] font-sans font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1.5"
                >
                  {isSelected ? (
                    <>
                      <FolderOpen className="w-3.5 h-3.5" /> Aberto
                    </>
                  ) : (
                    <>
                      <Folder className="w-3.5 h-3.5" /> Abrir Pasta
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    id={`btn-edit-proj-${proj.id}`}
                    onClick={() => handleStartEdit(proj)}
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Editar informações do projeto"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    id={`btn-delete-proj-${proj.id}`}
                    onClick={() => {
                      if (confirm("Você tem certeza que quer excluir este projeto? Todas as atividades vinculadas a ele serão removidas de forma irreversível.")) {
                        onDeleteProjeto(proj.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Excluir projeto e tarefas"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
