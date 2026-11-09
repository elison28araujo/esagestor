"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Tv,
  HelpCircle,
  ArrowRight,
  Smartphone,
  Laptop,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Lock,
  Flame,
  Sparkles,
  CheckCircle2,
  Clock,
  Radio,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { getApiUrl } from "@/lib/utils";
import {
  Card3DTilt,
  MockupTV3D,
  Countdown3D,
  BlackFridayBadge3D,
} from "@/components/BlackFriday3D";

export default function LandingPage() {
  const [whatsappGestor, setWhatsappGestor] = useState("");
  const [faqAberto, setFaqAberto] = useState<number | null>(0); // Primeiro FAQ aberto por padrão (Teste 4h)

  // Carregar dados de contato públicos do gestor
  useEffect(() => {
    async function loadLandingInfo() {
      try {
        const res = await fetch(getApiUrl("/api/landing-info"));
        const data = await res.json();
        if (data.whatsappGestor) {
          setWhatsappGestor(data.whatsappGestor);
        }
      } catch (err) {
        console.error("Erro ao carregar informações da landing page:", err);
      }
    }
    loadLandingInfo();
  }, []);

  function handleAssinar(plano: string, valor: string) {
    const numeroLimpo = whatsappGestor ? whatsappGestor.replace(/\D/g, "") : "";
    const telefone = numeroLimpo.length >= 10 ? numeroLimpo : "5591985066711";
    const mensagem = `Olá! Vi a oferta especial de *BLACK FRIDAY* no site da ESA Play e gostaria de garantir o *${plano}* por apenas R$ ${valor}. Como faço para ativar?`;
    window.open(`https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(mensagem)}`, "_blank");
  }

  function handleTesteGratis() {
    const numeroLimpo = whatsappGestor ? whatsappGestor.replace(/\D/g, "") : "";
    const telefone = numeroLimpo.length >= 10 ? numeroLimpo : "5591985066711";
    const mensagem = `Olá! Gostaria de solicitar meu *TESTE GRATUITO DE 4 HORAS* da Black Friday na ESA Play para testar na minha TV!`;
    window.open(`https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(mensagem)}`, "_blank");
  }

  const catalog = [
    {
      title: "Filmes & Blockbusters",
      img: "/filmes.jpg",
      description: "Lançamentos direto do cinema em 4K e catálogo completo.",
      badge: "4K HDR",
      tag: "Filmes",
    },
    {
      title: "Futebol & Esportes Ao Vivo",
      img: "/copa.jpg",
      description: "Brasileirão, Champions, Libertadores e Copa do Mundo 2026.",
      badge: "Sem Delay",
      tag: "Esportes",
    },
    {
      title: "Séries & Maratonas",
      img: "/serie.jpg",
      description: "Temporadas completas da Netflix, HBO, Disney+ e Prime.",
      badge: "Atualizado",
      tag: "Séries",
    },
    {
      title: "500+ Canais Ao Vivo",
      img: "/canais.jpg",
      description: "Grade completa de canais abertos, fechados, infantis e notícias.",
      badge: "Ultra Estável",
      tag: "Canais",
    },
  ];

  const planos = [
    {
      nome: "Plano Mensal",
      preco: "35,00",
      precoOriginal: null,
      duracao: "/mês",
      popular: false,
      blackBadge: "Sem Fidelidade",
      vantagens: [
        "Acesso completo a canais, filmes e séries",
        "Qualidade Ultra HD / 4K e FHD",
        "Compatível com TV, Celular e TV Box",
        "Suporte diário via WhatsApp",
      ],
    },
    {
      nome: "Plano Trimestral",
      preco: "87,00",
      precoOriginal: "105,00",
      duracao: "/trimestre",
      popular: false,
      blackBadge: "Economize R$ 18,00",
      vantagens: [
        "Acesso por 90 dias garantidos",
        "Qualidade Ultra HD / 4K sem travamento",
        "Suporte prioritário no WhatsApp",
        "Economia imediata na Black Friday",
      ],
    },
    {
      nome: "Plano Semestral",
      preco: "162,00",
      precoOriginal: "210,00",
      duracao: "/semestre",
      popular: false,
      blackBadge: "Economize R$ 48,00",
      vantagens: [
        "Acesso por 180 dias de puro entretenimento",
        "Servidores VIP com rota dedicada",
        "Suporte VIP prioritário",
        "Ideal para economizar o ano todo",
      ],
    },
    {
      nome: "Plano Anual VIP",
      preco: "290,00",
      precoOriginal: "420,00",
      duracao: "/ano",
      popular: true,
      blackBadge: "SUPER BLACK DEAL • -R$ 130",
      vantagens: [
        "Economia absurda de R$ 130,00!",
        "Acesso por 365 dias sem preocupações",
        "Qualidade máxima Ultra HD / 4K",
        "Suporte Ultra VIP dedicado 24/7",
        "Garantia total de estabilidade",
      ],
    },
  ];

  const faqs = [
    {
      p: "Como funciona a ativação?",
      r: "Após escolher o plano e realizar o pagamento, nosso suporte envia os dados de acesso (usuário e senha) no seu WhatsApp em menos de 5 minutos.",
    },
    {
      p: "Em quais dispositivos posso assistir?",
      r: "Você pode assistir na Smart TV (Samsung, LG, Android TV, Roku), TV Box, Fire Stick, Chromecast, celulares (Android e iOS), tablet ou computador.",
    },
    {
      p: "Preciso de quantos megas de internet?",
      r: "Recomendamos uma internet mínima de 15 Mbps para conteúdos em HD/Full HD e 30 Mbps para assistir transmissões ao vivo ou filmes em 4K sem travamentos.",
    },
    {
      p: "Posso cancelar quando quiser?",
      r: "Sim! Não temos contrato de fidelidade nem multas. Você renova quando desejar de forma simples e descomplicada.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050711] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      {/* Top Banner Black Friday */}
      <div className="relative z-50 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-slate-950 px-4 py-2 text-center text-xs font-black uppercase tracking-wider shadow-md">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Flame size={15} fill="currentColor" />
          <span>BLACK FRIDAY ESA PLAY: ATÉ 60% DE DESCONTO + TESTE GRÁTIS DE 4 HORAS!</span>
          <a
            href="#planos"
            className="underline underline-offset-2 ml-1 text-slate-900 font-extrabold hover:text-white transition"
          >
            VER OFERTAS →
          </a>
        </div>
      </div>

      {/* Header Fixo Transparente com Efeito Vidro */}
      <header className="sticky top-0 left-0 w-full z-40 bg-[#050711]/85 backdrop-blur-xl border-b border-slate-900/60 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative flex items-center">
              <span className="text-2xl font-heading font-black tracking-tighter text-white">
                ESA
              </span>
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-lg ml-1 text-sm inline-block transform -rotate-2 shadow-md shadow-amber-500/20 group-hover:scale-105 transition">
                Play
              </span>
            </div>
            <span className="hidden sm:inline-block rounded-full bg-red-600/20 border border-red-500/30 px-2 py-0.5 text-[9px] font-black text-red-400 tracking-wider uppercase">
              BLACK FRIDAY
            </span>
          </Link>

          {/* Links Navegação */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-400">
            <a href="#" className="hover:text-amber-400 transition">Início</a>
            <a href="#catalogo" className="hover:text-amber-400 transition">Catálogo 4K</a>
            <a href="#planos" className="hover:text-amber-400 transition">Ofertas</a>
            <a href="#dispositivos" className="hover:text-amber-400 transition">Compatibilidade</a>
            <a href="#faq" className="hover:text-amber-400 transition">Dúvidas</a>
            <Link
              href="/consulta"
              className="text-amber-400 hover:text-amber-300 transition flex items-center gap-1 font-bold"
            >
              Área do Cliente <ExternalLink className="h-3 w-3" />
            </Link>
          </nav>

          {/* Botões do Topo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleTesteGratis}
              className="hidden sm:inline-flex rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2 transition"
            >
              Teste Grátis 4h
            </button>
            <a href="#planos">
              <Button className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs px-4 sm:px-5 shadow-lg shadow-amber-500/20 active:scale-95 transition">
                Assinar Agora
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section 3D com TV Flutuante e Cronômetro */}
      <section className="relative min-h-[85vh] pt-12 pb-20 flex items-center overflow-hidden">
        {/* Luzes e Gradientes de Fundo Black Friday */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-br from-amber-500/10 via-red-600/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#050711] to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Coluna Esquerda: Texto, Urgência e Botões */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <BlackFridayBadge3D text="BLACK FRIDAY OFICIAL 2026" />

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-heading font-black tracking-tight leading-[1.08] text-white">
                A Maior Black Friday <br />
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                  da Sua TV Online!
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Mais de <strong className="text-white font-bold">500 canais ao vivo</strong>, filmes recém-saídos do cinema, séries completas e todo o futebol da <strong className="text-amber-400">Copa do Mundo 2026™</strong> em 4K Ultra HD sem travamentos.
              </p>

              {/* Caixa 3D do Cronômetro Black Friday */}
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-900/90 via-black to-slate-900/90 p-4 shadow-xl backdrop-blur-md max-w-md mx-auto lg:mx-0">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Clock size={13} /> As Ofertas da Black Friday expiram em:
                  </span>
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                </div>
                <Countdown3D />
              </div>

              {/* Ações / Botões */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 justify-center lg:justify-start">
                <a href="#planos" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto h-12 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-600 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider px-7 shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Flame size={16} fill="currentColor" /> Garantir Desconto Black Friday
                  </Button>
                </a>
                <button
                  onClick={handleTesteGratis}
                  className="w-full sm:w-auto h-12 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-100 font-bold text-xs px-6 flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Play size={15} className="text-amber-400 animate-pulse" /> Testar 4h Grátis
                </button>
              </div>

              {/* Mini Features */}
              <div className="flex items-center gap-6 pt-1 text-xs text-slate-400 justify-center lg:justify-start">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Ativação em 5 min
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Sem fidelidade
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Suporte 24h
                </span>
              </div>
            </div>

            {/* Coluna Direita: Mockup 3D da Smart TV */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <MockupTV3D />
            </div>

          </div>
        </div>
      </section>

      {/* Catálogo Destaques 3D */}
      <section id="catalogo" className="py-24 bg-slate-950/60 relative border-t border-slate-900/60">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-widest text-amber-500 uppercase">
              <Sparkles size={14} /> Catálogo Completo em Alta Definição
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-white">
              O Melhor do Streaming e da TV na Sua Casa
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
              Sem travamentos, com canais em 4K, 60 FPS e servidores de ultra velocidade atualizados diariamente.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {catalog.map((item, index) => (
              <Card3DTilt key={index}>
                <div className="h-full rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-black border border-slate-800/80 p-3 shadow-xl hover:border-amber-500/50 hover:shadow-amber-500/10 transition-all duration-300 flex flex-col group">
                  <div className="relative h-48 rounded-2xl overflow-hidden bg-slate-950">
                    <img
                      src={item.img}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500 brightness-90 group-hover:brightness-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                    
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-amber-500 text-slate-950 px-2.5 py-0.5 text-[10px] font-black uppercase shadow-md">
                      {item.badge}
                    </span>

                    <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-white/10">
                      {item.tag}
                    </span>
                  </div>

                  <div className="p-3 space-y-1">
                    <h3 className="font-heading font-bold text-sm text-white group-hover:text-amber-400 transition">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card3DTilt>
            ))}
          </div>
        </div>
      </section>

      {/* Planos Black Friday */}
      <section id="planos" className="py-24 relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/5 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider">
              <Flame size={14} fill="currentColor" /> OFERTAS EXCLUSIVAS BLACK FRIDAY
            </div>
            <h2 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-white">
              Escolha Seu Plano com Super Desconto
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
              Garanta seu acesso com preço congelado da Black Friday. Teste primeiro, comprove a qualidade e pague com segurança.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {planos.map((plano, index) => {
              const isVIP = plano.popular;
              return (
                <Card3DTilt key={index} className="flex">
                  <div
                    className={`relative w-full rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                      isVIP
                        ? "bg-gradient-to-b from-slate-900 via-black to-slate-950 border-2 border-amber-500 shadow-2xl shadow-amber-500/20 neon-border-gold transform lg:-translate-y-2"
                        : "bg-gradient-to-b from-slate-900/60 to-black/80 border border-slate-800 hover:border-slate-700 shadow-xl"
                    }`}
                  >
                    {/* Badge Destaque VIP */}
                    {isVIP && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                        <Flame size={12} fill="currentColor" /> MAIS ESCOLHIDO
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Topo do Card */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-heading font-bold text-lg text-white">
                            {plano.nome}
                          </h3>
                        </div>
                        <span className="inline-block rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-400 uppercase tracking-wide">
                          {plano.blackBadge}
                        </span>
                      </div>

                      {/* Preço */}
                      <div className="pt-2">
                        {plano.precoOriginal && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 line-through">
                              De R$ {plano.precoOriginal}
                            </span>
                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded">
                              BLACK FRIDAY
                            </span>
                          </div>
                        )}
                        <div className="flex items-baseline mt-0.5">
                          <span className="text-sm font-bold text-slate-400">R$</span>
                          <span className="text-4xl font-heading font-black text-white ml-1 tracking-tight">
                            {plano.preco}
                          </span>
                          <span className="text-xs font-medium text-slate-400 ml-1.5">
                            {plano.duracao}
                          </span>
                        </div>
                      </div>

                      <div className="h-[1px] bg-slate-800 my-3" />

                      {/* Vantagens */}
                      <ul className="space-y-2.5 text-xs text-slate-300">
                        {plano.vantagens.map((v, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{v}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Botão de Contratação */}
                    <div className="pt-6">
                      <Button
                        onClick={() => handleAssinar(plano.nome, plano.preco)}
                        className={`w-full h-11 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-md ${
                          isVIP
                            ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-amber-500/25"
                            : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                        }`}
                      >
                        Garantir Oferta
                      </Button>
                    </div>
                  </div>
                </Card3DTilt>
              );
            })}
          </div>

          {/* Banner de Teste Gratuito */}
          <div className="mt-16 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl backdrop-blur-md">
            <div className="space-y-1 text-center md:text-left">
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-emerald-400">
                <CheckCircle2 size={14} /> SEM RISCO NENHUM
              </span>
              <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
                Quer testar antes de assinar?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                Libere um teste de 4 horas agora mesmo pelo WhatsApp, sem pagar nada e sem compromisso.
              </p>
            </div>

            <Button
              onClick={handleTesteGratis}
              className="h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              Pedir Teste de 4 Horas Grátis
            </Button>
          </div>
        </div>
      </section>

      {/* Dispositivos Suportados em 3D */}
      <section id="dispositivos" className="py-20 bg-[#04060e] border-y border-slate-900/60">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 space-y-2">
            <h3 className="text-2xl font-heading font-bold text-white">
              Assista no Seu Dispositivo Favorito
            </h3>
            <p className="text-xs text-slate-400">
              Instalação simples e rápida com suporte passo a passo da nossa equipe.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Tv, title: "Smart TVs", desc: "Samsung, LG, Android TV, Roku e TCL" },
              { icon: Zap, title: "TV Box & Fire Stick", desc: "Compatível com qualquer TV Box e Chromecast" },
              { icon: Smartphone, title: "Celulares & Tablets", desc: "App dedicado para Android e iPhone/iPad" },
              { icon: Laptop, title: "Computadores", desc: "Player web direto no Google Chrome ou Edge" },
            ].map((d, i) => {
              const Icon = d.icon;
              return (
                <Card3DTilt key={i}>
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 flex items-center gap-4 hover:border-amber-500/40 transition">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-white">{d.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{d.desc}</p>
                    </div>
                  </div>
                </Card3DTilt>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 relative">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12 space-y-2">
            <HelpCircle className="h-8 w-8 text-amber-500 mx-auto" />
            <h2 className="text-3xl font-heading font-black tracking-tight text-white">
              Perguntas Frequentes
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Tudo o que você precisa saber sobre a ESA Play e o teste gratuito.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                  className="w-full px-5 py-4 flex items-center justify-between font-bold text-slate-200 text-sm text-left hover:bg-slate-900/50"
                >
                  <span>{faq.p}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      faqAberto === i ? "rotate-180 text-amber-400" : ""
                    }`}
                  />
                </button>
                {faqAberto === i && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/50 pt-3">
                    {i === 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                          🎉 Faça um teste GRATUITO por 4 horas!
                        </p>
                        <p>
                          Antes de contratar, você pode testar nosso serviço por <strong>4 horas</strong>, sem compromisso, para conferir a qualidade da imagem, estabilidade e funcionamento.
                        </p>
                        <ul className="space-y-2 text-slate-300">
                          <li className="flex items-start gap-2">
                            <span className="shrink-0 text-base">✅</span>
                            <span>Solicite seu teste gratuito de 4 horas pelo WhatsApp.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="shrink-0 text-base">📺</span>
                            <span>Se sua TV ainda não possui o aplicativo instalado, nossa equipe enviará o aplicativo compatível com o modelo da sua TV e auxiliará na instalação.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="shrink-0 text-base">💳</span>
                            <span>Gostou do teste? O pagamento é realizado <strong>somente após a ativação do aplicativo na sua TV</strong>.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="shrink-0 text-base">🔐</span>
                            <span>Após a confirmação do pagamento, enviaremos seu usuário e senha diretamente no WhatsApp em até <strong>5 minutos</strong>.</span>
                          </li>
                        </ul>
                      </div>
                    ) : (
                      faq.r
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900/80 bg-[#04060e] py-12 text-center text-xs text-slate-500 relative">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-heading font-black tracking-tighter text-slate-300">
              ESA<span className="text-amber-500">Play</span>
            </span>
            <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.2 text-[9px] font-bold text-amber-400 uppercase">
              Black Edition
            </span>
          </div>
          <p className="max-w-md mx-auto text-[10px] text-slate-600 leading-relaxed">
            ESA Play é uma plataforma de demonstração de serviços de streaming. Não hospedamos ou comercializamos arquivos protegidos por direitos autorais em nossos servidores.
          </p>
          <div className="flex justify-center gap-6 text-[11px] font-bold text-slate-500">
            <Link href="/consulta" className="hover:text-slate-300">
              Portal do Cliente
            </Link>
            <span>&bull;</span>
            <Link href="/admin" className="hover:text-slate-300 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Painel do Gestor
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()} ESA PLAY. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
