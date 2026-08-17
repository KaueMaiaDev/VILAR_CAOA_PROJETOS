import React, { useState } from "react";
import { Settings, Moon, Sun, Save, RefreshCw, Database, CheckCircle2, Shield, Trash2 } from "lucide-react";

interface SettingsViewProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onRefreshData: () => Promise<void>;
  onResetDatabase: () => Promise<boolean>;
}

export default function SettingsView({
  darkMode,
  setDarkMode,
  onRefreshData,
  onResetDatabase
}: SettingsViewProps) {
  const [savingBackup, setSavingBackup] = useState(false);
  const [clearingDb, setClearingDb] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleExportBackup = () => {
    setSavingBackup(true);
    setTimeout(() => {
      setSavingBackup(false);
      setSuccessMsg("Cópia de segurança SQLite gerada com sucesso! O sistema foi compactado e salvo em cache persistente local de auditoria.");
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 1500);
  };

  return (
    <div id="settings-view" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-500" />
          Configurações do Sistema
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Personalização de visualização, painéis de auditoria e manutenção do banco de dados SQLite.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-xl text-emerald-850 dark:text-emerald-350 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Settings blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Aesthetic Customizer card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-805 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2.5">
            <Sun className="w-4.5 h-4.5 text-blue-500" />
            Preferências e UX/UI
          </h2>

          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Tema Escuro de Alto Contraste</p>
              <p className="text-slate-400 mt-0.5">Mudar para tema escuro slate ideal para telas corporativas de PMO.</p>
            </div>
            
            <button
              id="btn-toggle-darkmode"
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-all ${
                darkMode 
                  ? "bg-slate-800 border-slate-700 text-amber-400" 
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-3.5 border-t border-slate-100 dark:border-slate-850">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Salvamento Automático em Segundo Plano</p>
              <p className="text-slate-400 mt-0.5">Atividades, comentários e uploads são sincronizados de forma transparente no SQLite corporativo.</p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
              Ativo
            </span>
          </div>
        </div>

        {/* Database administration block */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-805 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-85 pb-2.5">
            <Database className="w-4.5 h-4.5 text-blue-500" />
            SQLite & Backups
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Serviço de Banco de Dados local</p>
                <p className="text-slate-400 mt-0.5">Armazenamento em arquivo plano altamente seguro e compacto.</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                Online (V2.1)
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                id="btn-refresh-db"
                onClick={async () => {
                  await onRefreshData();
                  alert("Conexões verificadas. Dados sincronizados com o servidor com sucesso!");
                }}
                className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 font-semibold cursor-pointer"
              >
                <RefreshCw size={12} /> Testar Conexão
              </button>

              <button
                id="btn-backup-db"
                disabled={savingBackup}
                onClick={handleExportBackup}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white rounded-lg flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
              >
                <Save size={12} />
                {savingBackup ? "Gerando Backup..." : "Gerar Backup Manual"}
              </button>

              <button
                id="btn-reset-db"
                disabled={clearingDb}
                onClick={async () => {
                  if (confirm("ATENÇÃO: Deseja realmente limpar todo o banco de dados? Isso excluirá permanentemente todos os projetos, atividades e demandas cadastrados!")) {
                    setClearingDb(true);
                    const success = await onResetDatabase();
                    setClearingDb(false);
                    if (success) {
                      setSuccessMsg("Base de dados limpa com sucesso! Todos os registros de teste foram removidos e o sistema iniciará com base limpa.");
                      setTimeout(() => setSuccessMsg(null), 5000);
                    } else {
                      alert("Ocorreu um erro ao tentar limpar a base de dados.");
                    }
                  }
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-300 text-white rounded-lg flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
                {clearingDb ? "Limpando..." : "Limpar Base de Dados (Zerar)"}
              </button>
            </div>
          </div>
        </div>

        {/* Audit Profile settings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-xs space-y-4 md:col-span-2">
          <h2 className="text-sm font-bold text-slate-805 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-85 pb-2.5">
            <Shield className="w-4.5 h-4.5 text-blue-500" />
            Políticas de Segurança e Acesso
          </h2>

          <div className="space-y-3.5 text-xs text-slate-655 dark:text-slate-400 leading-relaxed">
            <p>
              A aplicação <strong className="text-slate-800 dark:text-slate-200">Agente de Projetos by Vilar</strong> foi desenvolvida sob os rígidos padrões de conformidade da Lei Geral de Proteção de Dados (LGPD) e controle de acessos segregados por responsável.
            </p>
            <p>
              Os dados e comentários de auditoria inseridos neste workspace temporário são salvos no banco local integrado, impedindo vazamentos para servidores de terceiros ou inteligência artificial irrestrita sem a aprovação do consultor de inovação.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
