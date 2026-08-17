import React, { useState, useEffect } from "react";
import { Projeto, Atividade, Responsavel, Comentario, Anexo, HistoricoAtividade } from "../types";
import { 
  CheckSquare, 
  Plus, 
  Filter, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  Paperclip, 
  History, 
  User, 
  Calendar, 
  AlertCircle, 
  FolderOpen, 
  Download,
  X,
  XCircle,
  Clock,
  ArrowRightLeft
} from "lucide-react";

interface ActivitiesViewProps {
  atividades: Atividade[];
  projetos: Projeto[];
  responsables: Responsavel[];
  onAddAtividade: (a: Partial<Atividade>) => Promise<void>;
  onUpdateAtividade: (id: string, updates: Partial<Atividade>) => Promise<void>;
  onDeleteAtividade: (id: string) => Promise<void>;
  onAddResponsavel?: (r: Partial<Responsavel>) => Promise<any>;
  selectedProjectId: string | null;
  darkMode: boolean;
}

export default function ActivitiesView({
  atividades,
  projetos,
  responsables,
  onAddAtividade,
  onUpdateAtividade,
  onDeleteAtividade,
  onAddResponsavel,
  selectedProjectId,
  darkMode
}: ActivitiesViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterProject, setFilterProject] = useState<string>(selectedProjectId || "todos");
  const [filterResponsavel, setFilterResponsavel] = useState<string>("todos");
  const [filterPriority, setFilterPriority] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Activity Form Fields
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [projetoId, setProjetoId] = useState(selectedProjectId || "");
  const [responsavelId, setResponsavelId] = useState("");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataLimite, setDataLimite] = useState("");
  const [prioridade, setPrioridade] = useState<'Baixa' | 'Media' | 'Alta' | 'Critica'>("Media");
  const [status, setStatus] = useState<'Pendente' | 'Em andamento' | 'Pausado' | 'Em validacao' | 'Concluido' | 'Cancelado'>("Pendente");

  const [editingId, setEditingId] = useState<string | null>(null);

  // Quick Add Responsible State
  const [showQuickAddResp, setShowQuickAddResp] = useState(false);
  const [quickRespNome, setQuickRespNome] = useState("");
  const [quickRespCargo, setQuickRespCargo] = useState("");
  const [quickRespArea, setQuickRespArea] = useState("");
  const [quickRespEmail, setQuickRespEmail] = useState("");
  const [quickRespTelefone, setQuickRespTelefone] = useState("");

  const handleQuickAddRespSubmit = async () => {
    if (!quickRespNome.trim()) {
      alert("Por favor, preencha o nome do responsável.");
      return;
    }
    if (!quickRespCargo.trim()) {
      alert("Por favor, preencha o cargo do responsável.");
      return;
    }
    if (!quickRespArea.trim()) {
      alert("Por favor, preencha a área do responsável.");
      return;
    }

    if (onAddResponsavel) {
      const added = await onAddResponsavel({
        nome: quickRespNome.trim(),
        cargo: quickRespCargo.trim(),
        area: quickRespArea.trim(),
        email: quickRespEmail.trim(),
        telefone: quickRespTelefone.trim()
      });

      if (added && added.id) {
        setResponsavelId(added.id);
        // Clear quick form
        setQuickRespNome("");
        setQuickRespCargo("");
        setQuickRespArea("");
        setQuickRespEmail("");
        setQuickRespTelefone("");
        setShowQuickAddResp(false);
      }
    }
  };

  // Modal / Detail panel state
  const [selectedTask, setSelectedTask] = useState<Atividade | null>(null);
  const [comments, setComments] = useState<Comentario[]>([]);
  const [attachments, setAttachments] = useState<Anexo[]>([]);
  const [historyLogs, setHistoryLogs] = useState<HistoricoAtividade[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  
  // Simulated file attach fields
  const [newAttachName, setNewAttachName] = useState("");
  const [newAttachSize, setNewAttachSize] = useState("120 KB");

  // Local effect to sync filtering when selectedProjectId changes from Dashboard
  useEffect(() => {
    if (selectedProjectId) {
      setFilterProject(selectedProjectId);
      setProjetoId(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Load selected activity details (comments, history, attachments)
  const loadActivityDetails = async (task: Atividade) => {
    setSelectedTask(task);
    try {
      const resComments = await fetch(`/api/atividades/${task.id}/comentarios`);
      const dataComments = await resComments.json();
      setComments(dataComments);

      const resAnexos = await fetch(`/api/atividades/${task.id}/anexos`);
      const dataAnexos = await resAnexos.json();
      setAttachments(dataAnexos);

      const resHist = await fetch(`/api/atividades/${task.id}/historico`);
      const dataHist = await resHist.json();
      setHistoryLogs(dataHist);
    } catch (err) {
      console.error("Erro ao carregar detalhes adicionais da atividade:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTask) return;

    try {
      const res = await fetch(`/api/atividades/${selectedTask.id}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autor: "Vilar (Inovação)",
          texto: newCommentText
        })
      });
      if (res.ok) {
        const added = await res.json();
        setComments([...comments, added]);
        setNewCommentText("");
        
        // Refresh history logs
        const resHist = await fetch(`/api/atividades/${selectedTask.id}/historico`);
        const dataHist = await resHist.json();
        setHistoryLogs(dataHist);
      }
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err);
    }
  };

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachName.trim() || !selectedTask) return;

    try {
      const res = await fetch(`/api/atividades/${selectedTask.id}/anexos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeArquivo: newAttachName,
          tamanho: newAttachSize
        })
      });
      if (res.ok) {
        const added = await res.json();
        setAttachments([...attachments, added]);
        setNewAttachName("");
        
        // Refresh history logs
        const resHist = await fetch(`/api/atividades/${selectedTask.id}/historico`);
        const dataHist = await resHist.json();
        setHistoryLogs(dataHist);
      }
    } catch (err) {
      console.error("Erro ao vincular anexo:", err);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    try {
      const res = await fetch(`/api/anexos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAttachments(attachments.filter(ax => ax.id !== id));
        if (selectedTask) {
          const resHist = await fetch(`/api/atividades/${selectedTask.id}/historico`);
          const dataHist = await resHist.json();
          setHistoryLogs(dataHist);
        }
      }
    } catch (err) {
      console.error("Erro ao remover anexo:", err);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !projetoId) return;

    if (editingId) {
      await onUpdateAtividade(editingId, {
        nome,
        descricao,
        projetoId,
        responsavelId,
        dataInicio,
        dataLimite,
        prioridade,
        status
      });
      setEditingId(null);
    } else {
      await onAddAtividade({
        nome,
        descricao,
        projetoId,
        responsavelId,
        dataInicio,
        dataLimite,
        prioridade,
        status: "Pendente"
      });
    }

    // Reset Form
    setNome("");
    setDescricao("");
    setResponsavelId("");
    setDataInicio(new Date().toISOString().split("T")[0]);
    setDataLimite("");
    setPrioridade("Media");
    setStatus("Pendente");
    setShowAddForm(false);
  };

  const handleStartEdit = (a: Atividade) => {
    setEditingId(a.id);
    setNome(a.nome);
    setDescricao(a.descricao);
    setProjetoId(a.projetoId);
    setResponsavelId(a.responsavelId);
    setDataInicio(a.dataInicio);
    setDataLimite(a.dataLimite);
    setPrioridade(a.prioridade);
    setStatus(a.status);
    setShowAddForm(true);
  };

  // Status list representing Kanban columns
  const kanbanColumns: Array<'Pendente' | 'Em andamento' | 'Pausado' | 'Em validacao' | 'Concluido'> = [
    "Pendente",
    "Em andamento",
    "Pausado",
    "Em validacao",
    "Concluido"
  ];

  // Helper calculation for Deadlines Math
  const getDeadlineIndicator = (limitDate: string, currentStatus: string) => {
    if (currentStatus === "Concluido" || currentStatus === "Cancelado") return { label: "Concluido", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100" };
    if (!limitDate) return { label: "Sem limite", color: "text-slate-400 font-mono" };

    const hoje = new Date().toISOString().split("T")[0];
    if (limitDate < hoje) {
      return { label: "ATRASADA", color: "text-red-650 bg-red-100/50 dark:bg-red-950/20 font-bold border-red-200" };
    }

    // Near deadline (less than 3 days)
    const difference = new Date(limitDate).getTime() - new Date(hoje).getTime();
    const daysLeft = Math.ceil(difference / (1000 * 3600 * 24));
    
    if (daysLeft <= 3) {
      return { label: "PRAZO PRÓXIMO", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/10 font-semibold border-amber-100" };
    }

    return { label: "No prazo", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-905/10 border-emerald-100" };
  };

  // Perform multi-dimensional filters
  const filteredAtividades = atividades.filter((a) => {
    const matchesProj = filterProject === "todos" || a.projetoId === filterProject;
    const matchesResp = filterResponsavel === "todos" || a.responsavelId === filterResponsavel;
    const matchesPrio = filterPriority === "todos" || a.prioridade === filterPriority;
    const matchesStat = filterStatus === "todos" || a.status === filterStatus;
    return matchesProj && matchesResp && matchesPrio && matchesStat;
  });

  const getPriorityStyle = (prio: string) => {
    switch (prio) {
      case "Critica": return "bg-red-100 text-red-700 border-red-200";
      case "Alta": return "bg-orange-100 text-orange-700 border border-orange-200";
      case "Media": return "bg-blue-100 text-blue-700 border border-blue-200";
      default: return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  return (
    <div id="activities-view" className="space-y-6">
      {/* Header action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-500" />
            Agenda e Atividades
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhe o andamento das tarefas, mude status e gerencie prazos com a visibilidade Kanban.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            id="btn-toggle-view"
            onClick={() => setViewMode(viewMode === "kanban" ? "table" : "kanban")}
            className="px-3 py-2 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Ver {viewMode === "kanban" ? "em Lista" : "em Quadro"}
          </button>
          
          <button
            id="btn-add-activity"
            onClick={() => {
              setEditingId(null);
              setShowAddForm(!showAddForm);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus size={16} /> Nova Atividade
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showAddForm && (
        <form 
          id="add-activity-form"
          onSubmit={handleCreateOrUpdate} 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs space-y-4 animate-fade-in"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              {editingId ? "Editar Detalhes da Atividade" : "Agendar Nova Atividade Operacional"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nome da Atividade *</label>
              <input
                id="act-field-name"
                type="text"
                required
                placeholder="Ex: Refatorar documentação técnica ou configurar base"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-705 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Detalhamento Técnico / Escopo</label>
              <textarea
                id="act-field-desc"
                placeholder="Descreva as tarefas menores implicadas, restrições e resultados..."
                rows={2}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-750 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Vincular a Pasta / Projeto *</label>
              <select
                id="act-field-proj"
                required
                value={projetoId}
                onChange={(e) => setProjetoId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-705 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="">-- Escolha um Projeto --</option>
                {projetos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Profissional Responsável *</label>
                <button
                  type="button"
                  onClick={() => setShowQuickAddResp(!showQuickAddResp)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  {showQuickAddResp ? "- Fechar cadastro" : "+ Cadastrar Novo"}
                </button>
              </div>
              <select
                id="act-field-resp"
                required
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-705 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="">-- Selecione o Responsável --</option>
                {responsables.map(r => (
                  <option key={r.id} value={r.id}>{r.nome} ({r.cargo})</option>
                ))}
              </select>
            </div>

            {showQuickAddResp && (
              <div className="col-span-1 md:col-span-2 bg-blue-50/50 dark:bg-slate-800/40 p-4 rounded-xl border border-blue-100 dark:border-slate-800 space-y-3 animate-fade-in">
                <div className="flex justify-between items-center border-b border-blue-100 dark:border-slate-800 pb-1.5">
                  <span className="text-xs font-bold text-blue-850 dark:text-blue-400">Cadastrar Novo Responsável</span>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddResp(false)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-450">Nome Completo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Clara Silva"
                      value={quickRespNome}
                      onChange={(e) => setQuickRespNome(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-450">Cargo / Função *</label>
                    <input
                      type="text"
                      placeholder="Ex: Designer UI/UX"
                      value={quickRespCargo}
                      onChange={(e) => setQuickRespCargo(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-450">Área / Setor *</label>
                    <input
                      type="text"
                      placeholder="Ex: Produto"
                      value={quickRespArea}
                      onChange={(e) => setQuickRespArea(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-450">E-mail corporativo</label>
                    <input
                      type="email"
                      placeholder="Ex: clara@empresa.com"
                      value={quickRespEmail}
                      onChange={(e) => setQuickRespEmail(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-450">Telefone / Ramal</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 99999-9999"
                      value={quickRespTelefone}
                      onChange={(e) => setQuickRespTelefone(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickRespNome("");
                      setQuickRespCargo("");
                      setQuickRespArea("");
                      setQuickRespEmail("");
                      setQuickRespTelefone("");
                      setShowQuickAddResp(false);
                    }}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickAddRespSubmit}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold shadow-xs transition-colors"
                  >
                    Salvar e Selecionar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Início da Atividade</label>
              <input
                id="act-field-start"
                type="date"
                required
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-705 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Data Limite de Conclusão</label>
              <input
                id="act-field-end"
                type="date"
                required
                value={dataLimite}
                onChange={(e) => setDataLimite(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-705 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Prioridade de Entrega</label>
              <select
                id="act-field-prio"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-705 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="Baixa">Baixa</option>
                <option value="Media">Média</option>
                <option value="Alta">Alta</option>
                <option value="Critica">Crítica</option>
              </select>
            </div>

            {editingId && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status Geral</label>
                <select
                  id="act-field-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-705 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Pausado">Pausado</option>
                  <option value="Em validacao">Em Validação</option>
                  <option value="Concluido">Concluído</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              id="btn-cancel-act"
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-act"
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Confirmar
            </button>
          </div>
        </form>
      )}

      {/* Multi-Filter Bar block */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-3">
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1.5">
          <Filter size={12} className="text-blue-500" /> Filtros Avançados
        </span>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Proj filter */}
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Projeto / Iniciativa</label>
            <select
              id="filter-act-proj"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none mt-1 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-200 font-medium"
            >
              <option value="todos">Todos os Projetos</option>
              {projetos.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Resp filter */}
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Responsável</label>
            <select
              id="filter-act-resp"
              value={filterResponsavel}
              onChange={(e) => setFilterResponsavel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none mt-1 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-200 font-medium"
            >
              <option value="todos">Todos os Responsáveis</option>
              {responsables.map(r => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Prioridade</label>
            <select
              id="filter-act-prio"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none mt-1 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-200 font-medium"
            >
              <option value="todos">Todas as Prioridades</option>
              <option value="Baixa">Baixa</option>
              <option value="Media">Média</option>
              <option value="Alta">Alta</option>
              <option value="Critica">Crítica</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Status</label>
            <select
              id="filter-act-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none mt-1 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-200 font-medium"
            >
              <option value="todos">Todos os Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Pausado">Pausado</option>
              <option value="Em validacao">Em Validação</option>
              <option value="Concluido">Concluído</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((colName) => {
            const colTasks = filteredAtividades.filter(t => t.status === colName);
            
            return (
              <div 
                id={`kanban-column-${colName.toLowerCase().replace(" ", "-")}`}
                key={colName} 
                className="bg-slate-100/50 dark:bg-slate-900/35 border border-slate-200/60 dark:border-slate-800 p-4 rounded-xl min-w-[210px] flex flex-col h-[520px]"
              >
                {/* Column header */}
                <div className="flex justify-between items-center mb-3 text-xs font-bold border-b border-slate-200/50 dark:border-slate-800 pb-2">
                  <span className="text-slate-700 dark:text-slate-300 font-sans tracking-tight">{colName}</span>
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono text-[10px]">
                    {colTasks.length}
                  </span>
                </div>

                {/* Subtasks listing */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colTasks.length === 0 ? (
                    <div className="h-28 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-[10px] text-slate-400 font-mono text-center px-2">
                      Sem atividades nesta coluna.
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const resp = responsables.find(r => r.id === task.responsavelId);
                      const proj = projetos.find(p => p.id === task.projetoId);
                      const deadlineInfo = getDeadlineIndicator(task.dataLimite, task.status);

                      return (
                        <div
                          id={`kanban-card-${task.id}`}
                          key={task.id}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl text-left shadow-xs hover:shadow-md transition-shadow cursor-pointer space-y-2.5 relative group"
                        >
                          {/* Label priority and Open Folder details */}
                          <div className="flex items-center justify-between gap-1.5" onClick={() => loadActivityDetails(task)}>
                            <span className={`text-[9px] font-semibold py-0.5 px-2 rounded-full border uppercase tracking-wider ${getPriorityStyle(task.prioridade)}`}>
                              {task.prioridade}
                            </span>
                            
                            <span className="text-[10px] text-slate-400 font-mono italic">
                              #{task.id.slice(-4)}
                            </span>
                          </div>

                          {/* Task Name */}
                          <div onClick={() => loadActivityDetails(task)} className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug tracking-tight">
                              {task.nome}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-medium truncate">
                              {proj ? proj.nome : "Sem projeto"}
                            </p>
                          </div>

                          {/* Member assignment & deadline badge */}
                          <div id="col-indicators" className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                            <span className="flex items-center gap-1 font-sans text-slate-600 dark:text-slate-400" onClick={() => loadActivityDetails(task)}>
                              <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 font-bold flex items-center justify-center text-[9px] text-blue-600 dark:text-blue-400">
                                {resp ? resp.nome[0] : "?"}
                              </div>
                              <span className="truncate max-w-[80px]">{resp ? resp.nome : "S/R"}</span>
                            </span>

                            <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] border ${deadlineInfo.color}`} onClick={() => loadActivityDetails(task)}>
                              {task.dataLimite ? task.dataLimite.substring(5) : "Sem data"}
                            </span>
                          </div>

                          {/* Admin Edit button or column migration shortcuts */}
                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 pl-2 flex gap-1.5 items-center">
                            <button
                              id={`act-quick-edit-${task.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                  handleStartEdit(task);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Editar Atividade"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              id={`act-quick-delete-${task.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Deseja mesmo remover esta atividade?")) {
                                  onDeleteAtividade(task.id);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-red-650 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Deletar Atividade"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>

                          {/* Dynamic column status fast upgrade tool */}
                          <span className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-slate-900">
                            {colName !== "Concluido" && (
                              <button
                                id={`quick-next-status-${task.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const idx = kanbanColumns.indexOf(colName);
                                  const nextCol = kanbanColumns[idx + 1];
                                  onUpdateAtividade(task.id, { status: nextCol });
                                }}
                                className="p-0.5 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 rounded text-blue-600 border border-blue-200 text-[8px] font-mono tracking-widest uppercase px-1 flex items-center gap-0.5"
                                title="Passar para próxima etapa"
                              >
                                {kanbanColumns[kanbanColumns.indexOf(colName) + 1]} <ArrowRightLeft size={8} />
                              </button>
                            )}
                          </span>

                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-6 py-3 font-semibold">Atividade</th>
                <th className="px-6 py-3 font-semibold">Projeto</th>
                <th className="px-6 py-3 font-semibold">Responsável</th>
                <th className="px-6 py-3 font-semibold">Prazo / Alerta</th>
                <th className="px-6 py-3 font-semibold">Prioridade</th>
                <th className="px-6 py-3 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAtividades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-mono">
                    Nenhuma atividade atende aos parâmetros atuais do filtro.
                  </td>
                </tr>
              ) : (
                filteredAtividades.map((task) => {
                  const resp = responsables.find(r => r.id === task.responsavelId);
                  const proj = projetos.find(p => p.id === task.projetoId);
                  const deadlineInfo = getDeadlineIndicator(task.dataLimite, task.status);

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 cursor-pointer" onClick={() => loadActivityDetails(task)}>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{task.nome}</div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{proj ? proj.nome : "Não atribuído"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[10px]">
                            {resp ? resp.nome[0] : "?"}
                          </span>
                          <span>{resp ? resp.nome : "Sem Responsável"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        <div className="text-slate-700 dark:text-slate-350 font-bold">{task.dataLimite || "S/D"}</div>
                        <span className={`text-[9px] px-1 py-0.5 rounded border ${deadlineInfo.color}`}>
                          {deadlineInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getPriorityStyle(task.prioridade)}`}>
                          {task.prioridade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            id={`tbl-edit-act-${task.id}`}
                            onClick={() => handleStartEdit(task)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            id={`tbl-delete-act-${task.id}`}
                            onClick={() => {
                              if (confirm("Confirmar exclusão desta atividade?")) {
                                onDeleteAtividade(task.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-650 hover:bg-slate-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Task detailed Modal popup - comments, files, history */}
      {selectedTask && (
        <div id="task-detail-modal" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Dossiê de Atividades</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                  <CheckSquare size={18} className="text-blue-500" />
                  {selectedTask.nome}
                </h3>
              </div>
              <button 
                id="btn-close-task-modal"
                onClick={() => setSelectedTask(null)}
                className="p-1 bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X size={18} className="text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            {/* Modal Body Scroll Container */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column info details (5 cols) */}
              <div className="md:col-span-5 space-y-5">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Metadados</span>
                  
                  {/* Projeto */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono">Projeto Principal</label>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {projetos.find(p => p.id === selectedTask.projetoId)?.nome || "Mapeado incorretamente"}
                    </p>
                  </div>

                  {/* Responsavel */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono">Profissional Conectado</label>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {responsables.find(r => r.id === selectedTask.responsavelId)?.nome || "Não escalado"}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono">Iniciada em</label>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-mono font-bold">{selectedTask.dataInicio || "S/D"}</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono">Data Máxima</label>
                      <p className="text-xs text-red-600 dark:text-red-400 font-mono font-bold">{selectedTask.dataLimite || "Sem limite"}</p>
                    </div>
                  </div>

                  {/* Priority check */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono">Importância Crítica</label>
                    <p className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">{selectedTask.prioridade}</p>
                  </div>
                </div>

                {/* Descrição em si */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase font-mono tracking-widest block">Memorial de Descrição</span>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedTask.descricao || "Sem memorial de escopo anexado a esta atividade."}
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase font-mono tracking-widest block">Documentos e Anexos</span>
                  
                  <div className="space-y-2">
                    {attachments.map((ax) => (
                      <div key={ax.id} className="p-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Paperclip size={13} className="text-slate-400" />
                          <span className="truncate text-slate-800 dark:text-slate-200 font-medium">{ax.nomeArquivo}</span>
                          <span className="text-[9px] text-slate-450 font-mono font-light">({ax.tamanho})</span>
                        </div>
                        <div className="flex gap-1.5">
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              alert(`Seu arquivo '${ax.nomeArquivo}' começou a baixar (Simulado).`);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-100 rounded"
                            title="Baixar anexo"
                          >
                            <Download size={12} />
                          </a>
                          <button
                            id={`btn-del-attach-${ax.id}`}
                            onClick={() => handleDeleteAttachment(ax.id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                            title="Apagar anexo"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddAttachment} className="flex gap-2.5 items-center">
                    <input
                      id="attach-file-name"
                      type="text"
                      required
                      placeholder="Nome do arquivo..."
                      value={newAttachName}
                      onChange={(e) => setNewAttachName(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] dark:bg-slate-800 dark:border-slate-705 text-slate-900 dark:text-slate-100 font-medium"
                    />
                    <select
                      value={newAttachSize}
                      onChange={(e) => setNewAttachSize(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] dark:bg-slate-800 dark:border-slate-705 text-slate-900 dark:text-slate-100 font-medium"
                    >
                      <option value="120 KB">120 KB</option>
                      <option value="1.5 MB">1.5 MB</option>
                      <option value="8.4 MB">8.4 MB</option>
                    </select>
                    <button
                      id="btn-add-attach"
                      type="submit"
                      className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] px-2.5 py-1.5 rounded-lg font-semibold"
                    >
                      Anexar
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column (Comments & Logs timeline) (7 cols) */}
              <div className="md:col-span-7 flex flex-col gap-5 border-l border-slate-100 dark:border-slate-800 pl-2 md:pl-6 max-h-full">
                
                {/* Status Timeline History */}
                <div className="flex-1 min-h-[160px] max-h-[220px] overflow-y-auto space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase font-mono tracking-widest block flex items-center gap-1">
                    <History size={12} /> Histórico de Alterações e Tráfego
                  </span>
                  
                  <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 space-y-4 font-mono text-[10px]">
                    {historyLogs.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">Sem registros históricos salvos.</p>
                    ) : (
                      historyLogs.map((log) => (
                        <div key={log.id} className="relative">
                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900" />
                          <div className="flex justify-between items-start text-slate-600 dark:text-slate-300">
                             <span className="font-semibold text-slate-800 dark:text-slate-200">{log.descricao}</span>
                             <span className="text-slate-400 shrink-0 select-none">{log.data}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Comments Listing Section */}
                <div className="flex-1 flex flex-col gap-2 max-h-[300px]">
                  <span className="text-[11px] font-bold text-slate-400 uppercase font-mono tracking-widest block flex items-center gap-1.5">
                    <MessageSquare size={12} /> Discussão e Alinhamento
                  </span>

                  <div className="flex-1 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {comments.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono italic">
                        Inicie o debate. Pergunta ao Vilar ou equipe técnico.
                      </div>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="text-xs space-y-1 bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-250 dark:border-slate-800">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                            <span className="text-blue-600 dark:text-blue-400 font-sans">{c.autor}</span>
                            <span className="font-mono text-slate-400">{c.data}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-normal font-sans whitespace-pre-wrap">{c.texto}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add comment Form */}
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      id="comment-field-input"
                      type="text"
                      required
                      placeholder="Espaço para notas corporativas, links Figma, observações..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-705 text-slate-900 dark:text-slate-100 font-medium"
                    />
                    <button
                      id="btn-comment-submit"
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-sans font-semibold text-xs px-4 py-2 rounded-lg"
                    >
                      Enviar
                    </button>
                  </form>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
