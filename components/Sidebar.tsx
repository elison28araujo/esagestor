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

  // Close mobile sidebar on tab change
  useEffect(() => {
    setMobileOpen(false);
  }, [activeTab, activeFilter]);

  const baseMenuItems = [
    { id: "dashboard", label: "Painel", icon: LayoutDashboard },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "cadastro", label: "Cadastrar", icon: UserPlus },
    { id: "despesas", label: "Despesas", icon: TrendingDown },
    { id: "pagamentos", label: "Histórico", icon: History },
    { id: "configuracoes", label: "Configurações", icon: Settings },
  ];

  const menuItems =
    userEmail === "elison28araujo@gmail.com"
      ? [...baseMenuItems, { id: "licencas", label: "Licenças", icon: ShieldCheck }]
      : baseMenuItems;

  const filters = [
    { id: "todos", label: "Todos", color: "bg-slate-500" },
    { id: "ativos", label: "Ativos", color: "bg-emerald-500" },
    { id: "vencendo", label: "Vencendo", color: "bg-amber-500" },
    { id: "vencidos", label: "Vencidos", color: "bg-red-500" },
  ];

  return (
    <>
      {/* Mobile Trigger */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="h-10 w-10 rounded-full border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          {mobileOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-slate-200/50 bg-white/80 backdrop-blur-xl transition-all duration-300 dark:border-slate-800/50 dark:bg-slate-950/80 md:translate-x-0",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div>
            {/* Logo */}
            <div className="mb-8 flex items-center justify-between px-2 pt-2 md:pt-0">
              {(!collapsed || mobileOpen) && (
                <span className="text-2xl font-heading font-black tracking-tighter text-blue-600 dark:text-blue-500">
                  ESA<span className="text-slate-900 dark:text-slate-100">GESTOR</span>
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </Button>
            </div>

            {/* Offline Indicator */}
            {isOffline && (!collapsed || mobileOpen) && (
              <div className="mb-6 rounded-2xl bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <span className="text-base mr-1">⚠️</span> Offline. Sincronização pendente.
              </div>
            )}

            {/* Navigation */}
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 py-6 rounded-2xl transition-all duration-300",
                    activeTab === item.id 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border-none" 
                      : "text-slate-500 hover:bg-slate-100/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100"
                  )}
                  onClick={() => setActiveTab(item.id as Tab)}
                >
                  <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} className={cn(activeTab === item.id ? "animate-pulse-once" : "")} />
                  {(!collapsed || mobileOpen) && <span className="font-semibold text-base">{item.label}</span>}
                </Button>
              ))}
            </nav>

            {/* Filters (only for Clientes tab) */}
            {(!collapsed || mobileOpen) && activeTab === "clientes" && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400/80 dark:text-slate-500/80">
                  <FilterIcon size={12} />
                  <span>Filtros Rápidos</span>
                </div>
                <div className="space-y-1">
                  {filters.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFilter(f.id as Filter)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-200 active:scale-95",
                        activeFilter === f.id
                          ? "bg-slate-900 font-bold text-white shadow-md dark:bg-white dark:text-slate-900"
                          : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <span className={cn("h-2.5 w-2.5 rounded-full ring-4 ring-white/10", f.color)} />
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-2 dark:border-slate-800/50 dark:bg-slate-950/50">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl py-5"
                onClick={toggleDark}
              >
                {darkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-blue-500" />}
                {(!collapsed || mobileOpen) && <span className="font-medium">{darkMode ? "Modo Claro" : "Modo Escuro"}</span>}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl py-5 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                onClick={onLogout}
              >
                <LogOut size={20} />
                {(!collapsed || mobileOpen) && <span className="font-medium">Sair da conta</span>}
              </Button>
            </div>

            {(!collapsed || mobileOpen) && userEmail && (
              <div className="px-3 pb-2">
                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Usuário
                </p>
                <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {userEmail}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
