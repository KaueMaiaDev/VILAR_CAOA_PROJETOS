import React from "react";
import { 
  LayoutDashboard, 
  Lightbulb, 
  Briefcase, 
  CheckSquare, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  darkMode: boolean;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  isCollapsed, 
  setIsCollapsed,
  darkMode
}: SidebarProps) {
  
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "demandas", label: "Demandas", icon: Lightbulb, badge: "Ideias" },
    { id: "projetos", label: "Projetos", icon: Briefcase },
    { id: "atividades", label: "Atividades", icon: CheckSquare },
    { id: "responsaveis", label: "Responsáveis", icon: Users },
    { id: "calendario", label: "Calendário", icon: Calendar },
    { id: "relatorios", label: "Relatórios", icon: FileText },
    { id: "configuracoes", label: "Configurações", icon: Settings }
  ];

  const sidebarBg = darkMode 
    ? "bg-slate-900 border-slate-850 text-slate-100" 
    : "bg-slate-950 border-slate-900 text-slate-100"; // Deep Corporate corporate theme

  return (
    <aside 
      id="app-sidebar"
      className={`h-screen relative flex flex-col transition-all duration-300 z-30 border-r ${
        isCollapsed ? "w-16" : "w-64"
      } ${sidebarBg}`}
    >
      {/* Header / Brand */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex flex-col select-none animate-fade-in">
            <span className="font-sans font-bold tracking-tight text-base flex items-center gap-1.5 text-blue-400">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Agente de Projetos
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">
              by Vilar
            </span>
          </div>
        )}
        {isCollapsed && (
          <TrendingUp className="w-6 h-6 text-blue-400 mx-auto" />
        )}
        
        {/* Collapse Button */}
        <button 
          id="toggle-sidebar-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-blue-600 hover:bg-blue-500 text-white p-1 rounded-full border border-slate-800 shadow-md transition-colors"
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Profile summary */}
      {!isCollapsed ? (
        <div className="p-4 bg-slate-900/50 border-b border-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/35 border border-blue-500/50 flex items-center justify-center font-bold text-blue-300">
              V
            </div>
            <div>
              <p className="font-sans font-medium text-sm text-slate-200">Vilar</p>
              <p className="text-xs text-slate-400 font-mono">Inovação & Projetos</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 border-b border-slate-800/40 text-center">
          <div className="w-8 h-8 rounded-full bg-blue-600/35 border border-blue-500/40 flex items-center justify-center font-bold text-blue-300 mx-auto text-xs">
            V
          </div>
        </div>
      )}

      {/* Navigation links */}
      <nav id="sidebar-nav" className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;
          
          return (
            <button
              id={`nav-item-${item.id}`}
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive 
                  ? "bg-blue-600/90 text-white shadow-sm" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`} />
              
              {!isCollapsed && (
                <span className="flex-1 text-left whitespace-nowrap animate-fade-in">
                  {item.label}
                </span>
              )}

              {!isCollapsed && item.badge && (
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded-md border border-blue-800/40">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer copyright */}
      <div className="p-4 border-t border-slate-800 text-slate-500 text-[10px] text-center font-mono select-none">
        {!isCollapsed ? (
          <div>
            <p>© 2026 Agente Projetos</p>
            <p className="text-[8px] text-slate-600">Enterprise Edition</p>
          </div>
        ) : (
          <span>V26</span>
        )}
      </div>
    </aside>
  );
}
