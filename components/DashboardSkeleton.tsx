import * as React from "react";

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Alertas */}
      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-52 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 w-60 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Título & Período */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-7 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="flex gap-2">
          <div className="h-9 w-36 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-32 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-slate-200/80 bg-slate-100 dark:border-slate-800/80 dark:bg-slate-900/60 p-4" />
        ))}
      </div>

      {/* Gráfico */}
      <div className="h-64 rounded-2xl border border-slate-200/80 bg-slate-100 dark:border-slate-800/80 dark:bg-slate-900/60 p-4" />

      {/* Servidores */}
      <div className="space-y-4">
        <div className="h-6 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-slate-200/80 bg-slate-100 dark:border-slate-800/80 dark:bg-slate-900/60 p-4" />
          ))}
        </div>
      </div>
    </div>
  );
}
