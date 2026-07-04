"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Pagamento } from "@/lib/types";
import { Loader2, Receipt, Trash2, Search, X } from "lucide-react";

interface PagamentosListProps {
  pagamentos: Pagamento[];
  onRemover: (id: string) => Promise<void>;
}

export function PagamentosList({ pagamentos, onRemover }: PagamentosListProps) {
  const [busca, setBusca] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);

  async function handleRemover() {
    if (!confirmId) return;
    setRemovendo(true);
    await onRemover(confirmId);
    setRemovendo(false);
    setConfirmId(null);
  }

  const confirmItem = pagamentos.find((p) => p.id === confirmId);

  const pagamentosFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) {
      return pagamentos.slice().sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }
    return pagamentos
      .filter(
        (p) =>
          p.cliente.toLowerCase().includes(q) ||
          p.usuario.toLowerCase().includes(q) ||
          p.app.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [pagamentos, busca]);

  const receitaTotal = useMemo(() => {
    return pagamentos.reduce((sum, p) => sum + Number(p.valor || 0), 0);
  }, [pagamentos]);

  return (
    <div className="space-y-4">
      {/* Resumo Financeiro Simples */}
      <Card className="border-none bg-gradient-to-br from-blue-500/10 to-blue-500/5 shadow-sm dark:from-blue-900/20 dark:to-blue-900/5">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">Receita Acumulada no Histórico</div>
            <div className="mt-2 text-3xl font-heading font-bold text-blue-600 dark:text-blue-400">
              R$ {receitaTotal.toFixed(2)}
            </div>
          </div>
          <Receipt className="h-10 w-10 text-blue-500 opacity-60" />
        </CardContent>
      </Card>

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="h-11 pl-10 pr-10 dark:border-slate-800 dark:bg-slate-900"
          placeholder="Buscar pagamentos por cliente, usuário ou app..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Lista de Pagamentos */}
      <div className="grid gap-4">
        {pagamentosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              {busca ? "Nenhum pagamento encontrado para a busca." : "Nenhum histórico de pagamentos registrado."}
            </CardContent>
          </Card>
        ) : (
          pagamentosFiltrados.map((item) => (
            <Card key={item.id} className="border-slate-200/60 dark:border-slate-800/60 hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                    {item.cliente}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {item.app}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Usuário: <strong className="text-slate-700 dark:text-slate-300">{item.usuario}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>Pago em: {new Date(item.data).toLocaleDateString("pt-BR") + " " + new Date(item.data).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right font-heading font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                    + R$ {Number(item.valor).toFixed(2)}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    onClick={() => setConfirmId(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!confirmId}
        title="Estornar Pagamento"
        message={`Deseja estornar o pagamento de "${confirmItem?.cliente}" no valor de R$ ${Number(confirmItem?.valor || 0).toFixed(2)}? Esta ação irá removê-lo do histórico financeiro.`}
        onConfirm={handleRemover}
        onCancel={() => setConfirmId(null)}
        loading={removendo}
      />
    </div>
  );
}
