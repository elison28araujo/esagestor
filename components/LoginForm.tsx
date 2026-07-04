"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Loader2, Mail, Lock } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function login() {
    if (!auth) { setError("Firebase não configurado."); return; }
    if (!email || !senha) { setError("Preencha email e senha"); return; }
    setLoading(true); setError(""); setInfo("");
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao entrar";
      if (msg.includes("invalid-credential")) setError("Email ou senha incorretos");
      else if (msg.includes("invalid-email")) setError("Email inválido");
      else setError(msg);
    } finally { setLoading(false); }
  }

  async function registrar() {
    if (!auth) { setError("Firebase não configurado."); return; }
    if (!email || !senha) { setError("Preencha email e senha"); return; }
    if (senha.length < 6) { setError("Senha deve ter no mínimo 6 caracteres"); return; }
    setLoading(true); setError(""); setInfo("");
    try {
      await createUserWithEmailAndPassword(auth, email, senha);
      setInfo("Conta criada com sucesso!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao criar conta";
      if (msg.includes("email-already-in-use")) setError("Este email já está em uso");
      else if (msg.includes("invalid-email")) setError("Email inválido");
      else setError(msg);
    } finally { setLoading(false); }
  }

  async function recuperarSenha() {
    if (!auth) { setError("Firebase não configurado."); return; }
    if (!email) { setError("Digite seu email para recuperar a senha"); return; }
    setLoading(true); setError(""); setInfo("");
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Link de recuperação enviado para seu email");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao recuperar senha";
      setError(msg);
    } finally { setLoading(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardContent className="space-y-4 p-8">
          <div className="text-center mb-2">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">ESA GESTOR</h1>
            <p className="mt-1 text-sm text-slate-500">Controle de acessos, cobranças e despesas</p>
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
            />
          </div>

          {error && <p className="text-center text-sm text-red-600 bg-red-50 rounded-lg py-2 px-3">{error}</p>}
          {info && <p className="text-center text-sm text-emerald-600 bg-emerald-50 rounded-lg py-2 px-3">{info}</p>}

          <Button className="w-full h-11" onClick={login} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
          <Button className="w-full" variant="outline" onClick={registrar} disabled={loading}>
            Criar conta
          </Button>
          <Button className="w-full" variant="ghost" onClick={recuperarSenha} disabled={loading}>
            Esqueci minha senha
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
