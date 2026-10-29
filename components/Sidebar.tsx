"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Users,
  TrendingDown,
  Settings,
  LogOut,
  Sun,
  Moon,
  Filter as FilterIcon,
  ChevronLeft,
  ChevronRight,
  Menu,
  X as CloseIcon,
  History,
  LayoutDashboard,
  UserPlus,
  ShieldCheck,
  Tv,
} from "lucide-react";
import { Filter, Tab } from "@/lib/types";
import { useState, useEffect } from "react";

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  activeFilter: Filter;
  setActiveFilter: (filter: Filter) => void;
  darkMode: boolean;
  toggleDark: () => void;
  onLogout: () => void;
  userEmail?: string | null;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  activeFilter,
  setActiveFilter,
  darkMode,
  toggleDark,
  onLogout,
  userEmail,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOnline() { setIsOffline(false); }
    function handleOffline() { setIsOffline(true); }

    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fecha sidebar mobile ao mudar de tab
  useEffect(() => {
    setMobileOpen(false);
  }, [activeTab, activeFilter]);

  const groups = [
    {
      title: "OPERAÇÃO",
      items: [
        { id: "dashboard", label: "Painel Geral", icon: LayoutDashboard },
        { id: "clientes", label: "Clientes", icon: Users },
        { id: "cadastro", label: "Cadastrar", icon: UserPlus },
      ],
    },
    {
      title: "FINANCEIRO",
      items: [
        { id: "despesas", label: "Despesas", icon: TrendingDown },
        { id: "pagamentos", label: "Histórico", icon: History },
      ],
    },
    {
      title: "SISTEMA",
      items: [
        { id: "configuracoes", label: "Configurações", icon: Settings },
        ...(userEmail === "elison28araujo@gmail.com"
          ? [{ id: "licencas", label: "Licenças SaaS", icon: ShieldCheck }]
          : []),
      ],
    },
  ];

  const filters = [
    { id: "todos", label: "Todos", color: "bg-slate-400" },
    { id: "ativos", label: "Ativos", color: "bg-emerald-500" },
    { id: "vencendo", label: "Vencendo (3d)", color: "bg-amber-500" },
    { id: "vencidos", label: "Vencidos", color: "bg-rose-500" },
  ];

  return (
    <>
      {/* Gatilho Mobile */}
      <div className="fixed top-3 left-3 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="h-9 w-9 rounded-lg border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          {mobileOpen ? <CloseIcon size={18} /> : <Menu size={18} />}
        </Button>
      </div>

      {/* Backdrop Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-slate-200/80 bg-white/95 transition-all duration-200 dark:border-slate-800/80 dark:bg-[#0c0f17]/95 md:translate-x-0 backdrop-blur-md",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col justify-between p-3">
          {/* Header com Logo */}
          <div className="shrink-0">
            <div className="flex h-12 items-center justify-between px-2">
              {(!collapsed || mobileOpen) && (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-sm">
                    E
                  </div>
                  <div className="flex items-center">
                    <span className="font-heading text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      ESA
                    </span>
                    <span className="font-heading text-sm font-medium tracking-tight text-slate-500 dark:text-slate-400">
                      GESTOR
                    </span>
                    <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex h-7 w-7 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title={collapsed ? "Expandir menu" : "Recolher menu"}
              >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </Button>
            </div>

            {/* Alerta Offline */}
            {isOffline && (!collapsed || mobileOpen) && (
              <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Modo Offline</span>
              </div>
            )}
          </div>

          {/* Navegação por Grupos */}
          <div className="flex-1 overflow-y-auto space-y-5 py-3 pr-0.5">
            {groups.map((group) => (
              <div key={group.title} className="space-y-1">
                {(!collapsed || mobileOpen) && (
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400/80 dark:text-slate-500">
                    {group.title}
                  </p>
                )}
                <nav className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id as Tab)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                          collapsed && !mobileOpen ? "justify-center px-0" : "justify-start",
                          isActive
                            ? "bg-slate-100 text-slate-900 dark:bg-slate-800/90 dark:text-white font-semibold"
                            : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200"
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon
                          size={16}
                          className={cn(
                            "shrink-0",
                            isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                          )}
                        />
                        {(!collapsed || mobileOpen) && (
                          <span className="truncate">{item.label}</span>
                        )}
                        {isActive && (!collapsed || mobileOpen) && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}

            {/* Filtros de Status (apenas quando na aba Clientes) */}
            {(!collapsed || mobileOpen) && activeTab === "clientes" && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1">
                <div className="flex items-center gap-1.5 px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <FilterIcon size={11} />
                  <span>Filtrar Status</span>
                </div>
                <div className="space-y-0.5">
                  {filters.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFilter(f.id as Filter)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                        activeFilter === f.id
                          ? "bg-slate-900 text-white font-medium dark:bg-white dark:text-slate-900"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", f.color)} />
                      <span className="truncate">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rodapé Fixo */}
          <div className="shrink-0 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* Usuário logado */}
            {(!collapsed || mobileOpen) && userEmail && (
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                    {userEmail}
                  </p>
                </div>
              </div>
            )}

            {/* Ações: Tema e Logout */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 rounded-lg text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
                  collapsed && !mobileOpen ? "w-full justify-center px-0" : "flex-1 justify-start gap-2 px-2"
                )}
                onClick={toggleDark}
                title={darkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
              >
                {darkMode ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} className="text-slate-400" />}
                {(!collapsed || mobileOpen) && <span>{darkMode ? "Claro" : "Escuro"}</span>}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 rounded-lg text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40",
                  collapsed && !mobileOpen ? "w-full justify-center px-0" : "px-2"
                )}
                onClick={onLogout}
                title="Sair da conta"
              >
                <LogOut size={15} />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
