import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import DemandsView from "./components/DemandsView";
import ProjectsView from "./components/ProjectsView";
import ActivitiesView from "./components/ActivitiesView";
import ResponsiblesView from "./components/ResponsiblesView";
import CalendarView from "./components/CalendarView";
import ReportsView from "./components/ReportsView";
import SettingsView from "./components/SettingsView";

import { Demanda, Projeto, Atividade, Responsavel } from "./types";
import { Search, Bell, Menu, X, ArrowUpRight, Lightbulb, Briefcase, CheckSquare, Users, Sun, Moon } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Core Data States
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [responsables, setResponsables] = useState<Responsavel[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);

  // Selected project filter inside folder viewer
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Global search bar
  const [globalQuery, setGlobalQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Fetch all initial data
  const loadData = async () => {
    try {
      const resDem = await fetch("/api/demandas");
      const dataDem = await resDem.json();
      setDemandas(dataDem);

      const resProj = await fetch("/api/projetos");
      const dataProj = await resProj.json();
      setProjetos(dataProj);

      const resResp = await fetch("/api/responsables");
      const dataResp = await resResp.json();
      setResponsables(dataResp);

      const resAtiv = await fetch("/api/atividades");
      const dataAtiv = await resAtiv.json();
      setAtividades(dataAtiv);
    } catch (err) {
      console.error("Erro ao sincronizar informações com o SQLite:", err);
    }
  };

  const handleResetDatabase = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/reset-db", { method: "POST" });
      if (res.ok) {
        await loadData();
        return true;
      }
    } catch (err) {
      console.error("Erro ao limpar base de dados:", err);
    }
    return false;
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync darkmode state on root tag
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Operational Demanda Functions
  const handleAddDemanda = async (newDem: Partial<Demanda>) => {
    try {
      const res = await fetch("/api/demandas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDem)
      });
      if (res.ok) {
        const added = await res.json();
        setDemandas([...demandas, added]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDemanda = async (id: string, updates: Partial<Demanda>) => {
    try {
      const res = await fetch(`/api/demandas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setDemandas(demandas.map(d => d.id === id ? updated : d));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertDemanda = async (id: string) => {
    try {
      const res = await fetch(`/api/demandas/${id}/converter`, {
        method: "POST"
      });
      if (res.ok) {
        const result = await res.json();
        // Update local state is simple: update corresponding demands list and append newly created project!
        setDemandas(demandas.map(d => d.id === id ? result.demanda : d));
        setProjetos([...projetos, result.projeto]);
        
        // Dynamic feedback trigger: Open Projects view with newly converted project directory selected
        setSelectedProjectId(result.projeto.id);
        setCurrentTab("projetos");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Operational Projeto Functions
  const handleAddProjeto = async (newProj: Partial<Projeto>) => {
    try {
      const res = await fetch("/api/projetos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProj)
      });
      if (res.ok) {
        const added = await res.json();
        setProjetos([...projetos, added]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProjeto = async (id: string, updates: Partial<Projeto>) => {
    try {
      const res = await fetch(`/api/projetos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setProjetos(projetos.map(p => p.id === id ? updated : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProjeto = async (id: string) => {
    try {
      const res = await fetch(`/api/projetos/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setProjetos(projetos.filter(p => p.id !== id));
        // Also clean up cascade deleted tasks on client state side
        setAtividades(atividades.filter(a => a.projetoId !== id));
        if (selectedProjectId === id) setSelectedProjectId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Operational Responsáveis Functions
  const handleAddResponsavel = async (newResp: Partial<Responsavel>) => {
    try {
      const res = await fetch("/api/responsables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResp)
      });
      if (res.ok) {
        const added = await res.json();
        setResponsables([...responsables, added]);
        return added;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  const handleUpdateResponsavel = async (id: string, updates: Partial<Responsavel>) => {
    try {
      const res = await fetch(`/api/responsables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setResponsables(responsables.map(r => r.id === id ? updated : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteResponsavel = async (id: string) => {
    try {
      const res = await fetch(`/api/responsables/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setResponsables(responsables.filter(r => r.id !== id));
        // Clear references on activities state side too
        setAtividades(atividades.map(a => a.responsavelId === id ? { ...a, responsavelId: "" } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Operational Atividade Functions
  const handleAddAtividade = async (newAtiv: Partial<Atividade>) => {
    try {
      const res = await fetch("/api/atividades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAtiv)
      });
      if (res.ok) {
        const added = await res.json();
        setAtividades([...atividades, added]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAtividade = async (id: string, updates: Partial<Atividade>) => {
    try {
      const res = await fetch(`/api/atividades/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setAtividades(atividades.map(a => a.id === id ? updated : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAtividade = async (id: string) => {
    try {
      const res = await fetch(`/api/atividades/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setAtividades(atividades.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Global search filtering across Demands, Projects, Activities, and Responsables
  const displaySearch = globalQuery.trim().length > 0;
  const searchDemands = demandas.filter(d => d.titulo.toLowerCase().includes(globalQuery.toLowerCase()) || d.descricao.toLowerCase().includes(globalQuery.toLowerCase()));
  const searchProjects = projetos.filter(p => p.nome.toLowerCase().includes(globalQuery.toLowerCase()) || p.descricao.toLowerCase().includes(globalQuery.toLowerCase()));
  const searchActivities = atividades.filter(a => a.nome.toLowerCase().includes(globalQuery.toLowerCase()) || a.descricao.toLowerCase().includes(globalQuery.toLowerCase()));
  const searchResponsibles = responsables.filter(r => r.nome.toLowerCase().includes(globalQuery.toLowerCase()) || r.cargo.toLowerCase().includes(globalQuery.toLowerCase()));

  const handleSelectSearchResult = (type: "demandas" | "projetos" | "atividades" | "responsaveis", id: string) => {
    setGlobalQuery("");
    setShowSearchResults(false);
    
    if (type === "projetos") {
      setSelectedProjectId(id);
      setCurrentTab("projetos");
    } else {
      setCurrentTab(type);
    }
  };

  // Switch view tabs safely
  const renderCurrentView = () => {
    switch (currentTab) {
      case "dashboard":
        return (
          <DashboardView
            projetos={projetos}
            atividades={atividades}
            demandas={demandas}
            responsables={responsables}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
            onSelectProject={(projId) => {
              setSelectedProjectId(projId);
              setCurrentTab("projetos");
            }}
            darkMode={darkMode}
          />
        );
      case "demandas":
        return (
          <DemandsView
            demandas={demandas}
            onAddDemanda={handleAddDemanda}
            onUpdateDemanda={handleUpdateDemanda}
            onConvertDemanda={handleConvertDemanda}
            darkMode={darkMode}
          />
        );
      case "projetos":
        return (
          <ProjectsView
            projetos={projetos}
            atividades={atividades}
            responsables={responsables}
            onAddProjeto={handleAddProjeto}
            onUpdateProjeto={handleUpdateProjeto}
            onDeleteProjeto={handleDeleteProjeto}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              // After selecting a folder, also filter activities tab or view detail
              setCurrentTab("atividades");
            }}
            selectedProjectId={selectedProjectId}
            darkMode={darkMode}
          />
        );
      case "atividades":
        return (
          <ActivitiesView
            atividades={atividades}
            projetos={projetos}
            responsables={responsables}
            onAddAtividade={handleAddAtividade}
            onUpdateAtividade={handleUpdateAtividade}
            onDeleteAtividade={handleDeleteAtividade}
            onAddResponsavel={handleAddResponsavel}
            selectedProjectId={selectedProjectId}
            darkMode={darkMode}
          />
        );
      case "responsaveis":
        return (
          <ResponsiblesView
            responsables={responsables}
            atividades={atividades}
            onAddResponsavel={handleAddResponsavel}
            onUpdateResponsavel={handleUpdateResponsavel}
            onDeleteResponsavel={handleDeleteResponsavel}
            darkMode={darkMode}
          />
        );
      case "calendario":
        return (
          <CalendarView
            atividades={atividades}
            projetos={projetos}
            darkMode={darkMode}
          />
        );
      case "relatorios":
        return (
          <ReportsView
            atividades={atividades}
            projetos={projetos}
            responsables={responsables}
            darkMode={darkMode}
          />
        );
      case "configuracoes":
        return (
          <SettingsView
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onRefreshData={loadData}
            onResetDatabase={handleResetDatabase}
          />
        );
      default:
        return <div className="text-sm font-mono text-slate-400">Página em modelagem de dados.</div>;
    }
  };

  return (
    <div id="root-theme" className={`flex h-screen w-screen overflow-hidden ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {/* Collapsible Corporate Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={(tab) => {
          if (tab !== "atividades" && tab !== "projetos") {
            // Keep folder clean on other views
            setSelectedProjectId(null);
          }
          setCurrentTab(tab);
        }} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed}
        darkMode={darkMode}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Global Search Top Header bar matching theme rules */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 px-6 sm:px-8 flex items-center justify-between shrink-0 relative z-20">
          
          {/* Instantly loaded global search matching constraints */}
          <div className="relative w-72 sm:w-96">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-1.5 border border-transparent dark:border-slate-700">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                id="global-search-input"
                type="text" 
                placeholder="Busca global (projetos, demandas, tarefas...)" 
                value={globalQuery}
                onFocus={() => setShowSearchResults(true)}
                onChange={(e) => setGlobalQuery(e.target.value)}
                className="bg-transparent border-none text-xs focus:outline-none focus:ring-0 ml-2 w-full text-slate-800 dark:text-slate-100"
              />
              {globalQuery.trim().length > 0 && (
                <button id="clear-search-btn" onClick={() => setGlobalQuery("")} className="text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Results Floating Panel */}
            {showSearchResults && displaySearch && (
              <div id="search-dropdown" className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-h-80 overflow-y-auto p-4 z-50 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] font-mono">Painel de Busca</span>
                  <button id="close-search-panel" onClick={() => setShowSearchResults(false)} className="text-slate-400" title="Fechar resultados">
                    Fechar
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Demands Results */}
                  {searchDemands.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-bold font-mono text-[9px] text-blue-500 flex items-center gap-1">
                        <Lightbulb size={11} /> Ideias e Demandas ({searchDemands.length})
                      </span>
                      <div className="space-y-1 divide-y divide-slate-100/30">
                        {searchDemands.map(d => (
                          <div 
                            key={d.id} 
                            onClick={() => handleSelectSearchResult("demandas", d.id)}
                            className="p-1 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer truncate text-slate-750 dark:text-slate-200 font-medium"
                          >
                            {d.titulo}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects Results */}
                  {searchProjects.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-bold font-mono text-[9px] text-indigo-500 flex items-center gap-1">
                        <Briefcase size={11} /> Pastas de Projetos ({searchProjects.length})
                      </span>
                      <div className="space-y-1 divide-y divide-slate-100/30">
                        {searchProjects.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => handleSelectSearchResult("projetos", p.id)}
                            className="p-1 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer truncate text-slate-750 dark:text-slate-200 font-medium"
                          >
                            {p.nome}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activities Results */}
                  {searchActivities.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-bold font-mono text-[9px] text-amber-500 flex items-center gap-1">
                        <CheckSquare size={11} /> Atividades Pendentes ({searchActivities.length})
                      </span>
                      <div className="space-y-1 divide-y divide-slate-100/30">
                        {searchActivities.map(a => (
                          <div 
                            key={a.id} 
                            onClick={() => handleSelectSearchResult("atividades", a.id)}
                            className="p-1 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer truncate text-slate-755 dark:text-slate-200 font-medium"
                          >
                            {a.nome}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Responsibles Results */}
                  {searchResponsibles.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-bold font-mono text-[9px] text-emerald-500 flex items-center gap-1">
                        <Users size={11} /> Responsáveis Cadastrados ({searchResponsibles.length})
                      </span>
                      <div className="space-y-1 divide-y divide-slate-100/30">
                        {searchResponsibles.map(r => (
                          <div 
                            key={r.id} 
                            onClick={() => handleSelectSearchResult("responsaveis", r.id)}
                            className="p-1 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer truncate text-slate-755 dark:text-slate-205 font-medium"
                          >
                            {r.nome} - <span className="text-[10px] text-slate-500">{r.cargo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchDemands.length === 0 && searchProjects.length === 0 && searchActivities.length === 0 && searchResponsibles.length === 0 && (
                    <div className="text-center font-mono py-4 text-slate-400">
                      Nenhum correspondente encontrado para '{globalQuery}'.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Notification triggers and avatar info */}
          <div className="flex items-center gap-4">
            {/* Botão de Tema Claro / Escuro */}
            <button
              id="theme-toggle-header"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors flex items-center justify-center"
              title={darkMode ? "Ativar Tema Claro" : "Ativar Tema Escuro"}
            >
              {darkMode ? <Sun size={18} className="text-amber-550" /> : <Moon size={18} />}
            </button>

            <button 
              id="top-bell-notification"
              onClick={() => {
                alert("Você tem 02 alertas de atividades próximas do prazo de entrega de acordo com a central executiva.");
              }}
              className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Notificações ativas"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
            </button>

            <button 
              onClick={() => {
                setSelectedProjectId(null);
                setCurrentTab("configuracoes");
              }}
              className="bg-blue-600 font-sans hover:bg-blue-500 text-white font-semibold text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              Gerenciar PMO <ArrowUpRight size={13} />
            </button>
          </div>
        </header>

        {/* Content Area viewport with fine scrolling scrollbars */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderCurrentView()}
          </div>
        </main>

      </div>

    </div>
  );
}
