"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Despesa } from "@/lib/types";
import { Loader2, TrendingDown, Trash2 } from "lucide-react";

interface DespesaListProps {
  despesas: Despesa[];
  onAdd: (descricao: string, valor: string) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
}

export function DespesaList({ despesas, onAdd, onRemover }: DespesaListProps) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [erro, setErro] = useState("");

  async function handleAdd() {
    if (!descricao.trim() || !valor) { setErro("Preencha descrição e valor"); return; }
    setErro(""); setAdicionando(true);
    await onAdd(descricao, valor);
    setDescricao(""); setValor(""); setAdicionando(false);
  }

  async function handleRemover() {
    if (!confirmId) return;
    setRemovendo(true);
    await onRemover(confirmId);
    setRemovendo(false);
    setConfirmId(null);
  }

  const confirmItem = despesas.find((d) => d.id === confirmId);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 p-5">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <TrendingDown className="h-4 w-4 text-red-500" /> Nova despesa
          </div>
          <Input placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          <Input placeholder="Valor (R$)" type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
          {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 dark:bg-red-950 dark:text-red-300">{erro}</p>}
          <Button onClick={handleAdd} disabled={adicionando} className="h-11">
            {adicionando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Adicionar despesa
          </Button>
        </CardContent>
      </Card>

      {despesas.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-slate-500">Nenhuma despesa cadastrada</CardContent></Card>
      ) : (
        despesas.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{item.descricao}</div>
                <div className="text-sm text-red-600">R$ {Number(item.valor).toFixed(2)}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {new Date(item.data).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <Button size="sm" variant="destructive" onClick={() => setConfirmId(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))
      )}

      <ConfirmDialog
        open={!!confirmId}
        title="Excluir despesa"
        message={`Excluir "${confirmItem?.descricao}"?`}
        onConfirm={handleRemover}
        onCancel={() => setConfirmId(null)}
        loading={removendo}
      />
    </div>
  );
}
