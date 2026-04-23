"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { Acesso, Despesa, UsuarioAgrupado } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

interface DashboardProps {
  acessos: Acesso[];
  despesas: Despesa[];
  usuariosAgrupados: UsuarioAgrupado[];
}

export function Dashboard({ acessos, despesas, usuariosAgrupados }: DashboardProps) {
  const totalEntrada = acessos.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const totalSaida = despesas.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const lucro = totalEntrada - totalSaida;

  const vencendoHoje = useMemo(() => {
    const hoje = Date.now();
    return acessos.filter((a) => {
      const dias = Math.ceil((new Date(a.vencimento).getTime() - hoje) / (1000 * 60 * 60 * 24));
      return dias <= 3 && dias >= 0;
    }).length;
  }, [acessos]);

  const vencidos = useMemo(() => {
    return acessos.filter((a) => new Date(a.vencimento).getTime() < Date.now()).length;
  }, [acessos]);

  const dadosMensais = useMemo(() => {
    const meses: Record<string, { entrada: number; saida: number }> = {};
    acessos.forEach((item) => {
      const mes = new Date(item.data).toLocaleString("pt-BR", { month: "short" });
      if (!meses[mes]) meses[mes] = { entrada: 0, saida: 0 };
      meses[mes].entrada += Number(item.valor || 0);
    });
    despesas.forEach((item) => {
      const mes = new Date(item.data).toLocaleString("pt-BR", { month: "short" });
      if (!meses[mes]) meses[mes] = { entrada: 0, saida: 0 };
      meses[mes].saida += Number(item.valor || 0);
    });
    return Object.entries(meses).map(([mes, v]) => ({
      mes,
      entrada: v.entrada,
      saida: v.saida,
      lucro: v.entrada - v.saida,
    }));
  }, [acessos, despesas]);

  return (
    <>
      {(vencidos > 0 || vencendoHoje > 0) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {vencidos > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span><strong>{vencidos}</strong> acesso{vencidos > 1 ? "s" : ""} vencido{vencidos > 1 ? "s" : ""}</span>
            </div>
          )}
          {vencendoHoje > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <span><strong>{vencendoHoje}</strong> acesso{vencendoHoje > 1 ? "s" : ""} vence{vencendoHoje > 1 ? "m" : ""} em até 3 dias</span>
            </div>
          )}
        </div>
      )}

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Entrada total</div>
            <div className="mt-1 text-xl font-bold text-emerald-600">R$ {totalEntrada.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Saída total</div>
            <div className="mt-1 text-xl font-bold text-red-600">R$ {totalSaida.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Lucro</div>
            <div className={`mt-1 text-xl font-bold ${lucro >= 0 ? "text-blue-600" : "text-red-600"}`}>
              R$ {lucro.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Usuários</div>
            <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{usuariosAgrupados.length}</div>
          </CardContent>
        </Card>
      </section>

      {dadosMensais.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="mb-3 text-sm font-semibold">Lucro mensal</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dadosMensais}>
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                <Line type="monotone" dataKey="lucro" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
}
