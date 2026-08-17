import React, { useState } from "react";
import { Responsavel, Atividade } from "../types";
import { Users, Plus, Edit3, Trash2, Mail, Phone, Library, UserMinus, ShieldAlert } from "lucide-react";

interface ResponsiblesViewProps {
  responsables: Responsavel[];
  atividades: Atividade[];
  onAddResponsavel: (r: Partial<Responsavel>) => Promise<void>;
  onUpdateResponsavel: (id: string, updates: Partial<Responsavel>) => Promise<void>;
  onDeleteResponsavel: (id: string) => Promise<void>;
  darkMode: boolean;
}

export default function ResponsiblesView({
  responsables,
  atividades,
  onAddResponsavel,
  onUpdateResponsavel,
  onDeleteResponsavel,
  darkMode
}: ResponsiblesViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [area, setArea] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;

    if (editingId) {
      await onUpdateResponsavel(editingId, { nome, cargo, area, email, telefone });
      setEditingId(null);
    } else {
      await onAddResponsavel({ nome, cargo, area, email, telefone });
    }

    // Reset Form
    setNome("");
    setCargo("");
    setArea("");
    setEmail("");
    setTelefone("");
    setShowAddForm(false);
  };

  const handleStartEdit = (resp: Responsavel) => {
    setEditingId(resp.id);
    setNome(resp.nome);
    setCargo(resp.cargo);
    setArea(resp.area);
    setEmail(resp.email);
    setTelefone(resp.telefone);
    setShowAddForm(true);
  };

  return (
    <div id="responsibles-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Quadro de Responsáveis
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cadastre os profissionais, defina áreas corporativas e acompanhe a alocação de tarefas por responsável.
          </p>
        </div>
        <button
          id="btn-add-responsible"
          onClick={() => {
            setEditingId(null);
            setShowAddForm(!showAddForm);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs shrink-0 transition-colors"
        >
          <Plus size={16} /> Novo Responsável
        </button>
      </div>

      {showAddForm && (
        <form 
          id="add-responsible-form"
          onSubmit={handleSubmit} 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs space-y-4 animate-fade-in"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              {editingId ? "Editar Perfil do Profissional" : "Cadastrar Novo Integrante dDe Equipe"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nome Completo *</label>
              <input
                id="resp-field-name"
                type="text"
                required
                placeholder="Ex: Thiago Vilar"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-850 dark:border-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Cargo Corporativo</label>
              <input
                id="resp-field-cargo"
                type="text"
                placeholder="Ex: Gerente de Inovação"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-850 dark:border-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-605 dark:text-slate-400">Área / Coordenação</label>
              <input
                id="resp-field-area"
                type="text"
                placeholder="Ex: Inovação & Projetos"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-850 dark:border-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">E-mail Corporativo *</label>
              <input
                id="resp-field-email"
                type="email"
                required
                placeholder="Ex: vilar@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-850 dark:border-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Telefone / Ramal</label>
              <input
                id="resp-field-phone"
                type="text"
                placeholder="Ex: (11) 98765-4321"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-slate-850 dark:border-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              id="btn-cancel-resp"
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-resp"
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-550 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Confirmar Cadastro
            </button>
          </div>
        </form>
      )}

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {responsables.map((r) => {
          // Calculate allocations to active tasks
          const assignedTasks = atividades.filter(a => a.responsavelId === r.id);
          const totalAssigned = assignedTasks.length;
          const concluidasCount = assignedTasks.filter(a => a.status === "Concluido").length;
          const pendingCount = totalAssigned - concluidasCount;

          return (
            <div 
              id={`resp-card-${r.id}`}
              key={r.id} 
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 p-5 rounded-2xl shadow-xs transition-shadow hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Profile header visual */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-slate-105 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold flex items-center justify-center text-blue-500 dark:text-blue-400 text-lg">
                    {r.nome[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {r.nome}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {r.cargo || "Profissional de Apoio"}
                    </p>
                  </div>
                </div>

                {/* Info Lines */}
                <div className="space-y-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-85 y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-350">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{r.email}</span>
                  </div>
                  {r.telefone && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-350">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span>{r.telefone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-350">
                    <Library size={13} className="text-slate-400 shrink-0" />
                    <span>Setor: <strong className="font-medium">{r.area || "Geral"}</strong></span>
                  </div>
                </div>
              </div>

              {/* Workload indicators */}
              <div className="mt-5 border-t border-slate-100 dark:border-slate-850 pt-4 flex items-center justify-between">
                <div className="flex gap-4 text-[10px] uppercase font-mono tracking-widest text-slate-400">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">
                      {totalAssigned}
                    </span>
                    Total Tasks
                  </div>
                  <div>
                    <span className="font-bold text-blue-600 text-sm block">
                      {pendingCount}
                    </span>
                    Ativas
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    id={`btn-edit-resp-${r.id}`}
                    onClick={() => handleStartEdit(r)}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 rounded text-slate-500 hover:text-blue-500 transition-colors"
                    title="Editar informações"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    id={`btn-delete-resp-${r.id}`}
                    onClick={() => {
                      if (confirm(`Deseja remover o responsável '${r.nome}'? Ele será desvinculado de todas as respectivas atividades.`)) {
                        onDeleteResponsavel(r.id);
                      }
                    }}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 rounded text-slate-500 hover:text-red-500 transition-colors"
                    title="Remover cadastro"
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
