"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Play, 
  Tv, 
  Film, 
  Award, 
  HelpCircle, 
  ArrowRight, 
  Smartphone, 
  Laptop, 
  ChevronDown, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [whatsappGestor, setWhatsappGestor] = useState("");
  const [faqAberto, setFaqAberto] = useState<number | null>(null);

  // Carregar dados de contato públicos do gestor
  useEffect(() => {
    async function loadLandingInfo() {
      try {
        const res = await fetch("/api/landing-info");
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
    const telefone = whatsappGestor ? whatsappGestor.replace(/\D/g, "") : "5511999999999";
    const mensagem = `Olá! Vi o site da ESA Play e gostaria de assinar o *${plano}* (R$ ${valor}). Como posso fazer para ativar?`;
    window.open(`https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(mensagem)}`, "_blank");
  }

  const catalog = [
    {
      title: "Filmes Blockbuster",
      img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80",
      description: "Lançamentos e clássicos do cinema mundial.",
      badge: "4K Ultra HD"
    },
    {
      title: "Copa do Mundo 2026 & Esportes",
      img: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
      description: "Transmissões ao vivo dos maiores campeonatos.",
      badge: "Ao Vivo"
    },
    {
      title: "Séries Exclusivas",
      img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
      description: "As melhores produções para maratonar.",
      badge: "Completo"
    },
    {
      title: "Canais Ao Vivo",
      img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
      description: "Mais de 500 canais abertos e fechados.",
      badge: "Sem Travamentos"
    }
  ];

  const planos = [
    {
      nome: "Bronze - 1 Tela",
      preco: "30,00",
      telas: 1,
      popular: false,
      vantagens: ["Qualidade Full HD", "Acesso imediato", "Sem fidelidade", "Suporte 24h"]
    },
    {
      nome: "Prata - 2 Telas",
      preco: "33,00",
      telas: 2,
      popular: true,
      vantagens: ["Qualidade Ultra HD / 4K", "Acesso imediato", "Sem fidelidade", "Suporte prioritário"]
    },
    {
      nome: "Ouro - 3 Telas",
      preco: "35,00",
      telas: 3,
      popular: false,
      vantagens: ["Qualidade Ultra HD / 4K", "Acesso imediato", "Sem fidelidade", "Suporte VIP", "Economia máxima"]
    }
  ];

  const faqs = [
    {
      p: "Como funciona a ativação?",
      r: "Após escolher o plano e realizar o pagamento, nosso suporte envia os dados de acesso (usuário e senha) no seu WhatsApp em menos de 5 minutos."
    },
    {
      p: "Em quais dispositivos posso assistir?",
      r: "Você pode assistir na Smart TV (Samsung, LG, Android TV), TV Box, Chromecast, celulares (Android e iOS), tablet, computador ou notebook."
    },
    {
      p: "Preciso de quantos megas de internet?",
      r: "Recomendamos uma internet mínima de 15 Mbps para conteúdos em HD/Full HD e 30 Mbps para assistir transmissões ao vivo ou filmes em 4K sem travamentos."
    },
    {
      p: "Posso cancelar quando quiser?",
      r: "Sim! Não temos contrato de fidelidade. Você paga mês a mês e pode cancelar ou trocar de plano a qualquer momento sem taxas adicionais."
    }
  ];

  return (
    <div className="min-h-screen bg-[#060814] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-900">
      
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#060814]/80 backdrop-blur-md border-b border-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-heading font-black tracking-tighter text-slate-50">
              ESA<span className="bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-lg ml-1 text-sm inline-block transform rotate-[-2deg]">Play</span>
            </span>
          </Link>

          {/* Links Navegação */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-400">
            <a href="#" className="hover:text-slate-100 transition">Home</a>
            <a href="#catalogo" className="hover:text-slate-100 transition">Catálogo</a>
            <a href="#planos" className="hover:text-slate-100 transition">Planos</a>
            <a href="#faq" className="hover:text-slate-100 transition">Dúvidas</a>
            <Link 
              href="/consulta" 
              className="text-amber-500 hover:text-amber-400 transition flex items-center gap-1"
            >
              Área do Cliente <ExternalLink className="h-3 w-3" />
            </Link>
          </nav>

          {/* Botões do Topo */}
          <div className="flex items-center gap-3">
            <Link href="/consulta">
              <Button variant="ghost" className="hidden sm:inline-flex rounded-xl font-bold text-xs text-slate-300 hover:text-white hover:bg-slate-900">
                Área do Cliente
              </Button>
            </Link>
            <a href="#planos">
              <Button className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-5 shadow-lg shadow-amber-500/10">
                Assine Já
              </Button>
            </a>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-36 overflow-hidden flex items-center">
        {/* Imagem de Fundo Estilizada (Cinema / Esportes) */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.25] pointer-events-none scale-105 filter blur-sm transition-all"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&auto=format&fit=crop&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060814] via-[#060814]/70 to-[#060814] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-amber-500 text-xs font-bold uppercase tracking-wider animate-pulse">
            <Zap className="h-4.5 w-4.5 text-amber-500" /> Ativação Imediata
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-slate-50">
            O melhor do entretenimento <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">& esporte está aqui.</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-medium">
            Filmes Blockbuster, Séries Exclusivas & a Copa do Mundo FIFA 2026™ ao vivo e em 4K. Assista na sua TV, Computador ou Celular sem travamentos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a href="#planos" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm px-8 flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transform active:scale-95 transition-all">
                Assine Agora <ArrowRight className="h-4.5 w-4.5" />
              </Button>
            </a>
            <Link href="/consulta" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-12 rounded-xl border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-slate-200 font-bold text-sm px-8 flex items-center justify-center gap-2 hover:border-slate-700">
                <Play className="h-4.5 w-4.5 text-amber-500" /> Acessar Portal do Cliente
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Catálogo Destaques */}
      <section id="catalogo" className="py-20 bg-slate-950/40 relative">
        <div className="max-w-6xl mx-auto px-4">
          
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight">Conteúdo para toda a família</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">Várias categorias de canais, filmes e esportes com servidores de alta velocidade.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {catalog.map((item, index) => (
              <Card key={index} className="bg-slate-900/40 border-slate-900 rounded-3xl overflow-hidden hover:shadow-xl hover:border-slate-800 transition duration-300 group">
                <div className="relative h-44 overflow-hidden">
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                  <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                </div>
                <CardContent className="p-5 space-y-1">
                  <h3 className="font-bold text-slate-100 group-hover:text-amber-500 transition">{item.title}</h3>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4">
          
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight">Escolha o seu plano</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">Sem taxas ocultas. Cancele ou altere o plano quando desejar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {planos.map((plano, index) => (
              <div 
                key={index} 
                className={`relative rounded-3xl p-6 border ${
                  plano.popular 
                    ? "border-amber-500/60 bg-gradient-to-b from-amber-500/[0.04] to-transparent shadow-xl" 
                    : "border-slate-900 bg-slate-900/20"
                } flex flex-col justify-between gap-6 transition hover:-translate-y-1`}
              >
                {plano.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    Mais Popular
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">{plano.nome}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{plano.telas} tela{plano.telas > 1 ? "s" : ""} simultânea{plano.telas > 1 ? "s" : ""}</p>
                  </div>
                  
                  <div className="flex items-baseline">
                    <span className="text-sm font-semibold text-slate-400">R$</span>
                    <span className="text-4xl font-black text-slate-50 ml-1">{plano.preco}</span>
                    <span className="text-xs text-slate-400 ml-1">/mês</span>
                  </div>

                  <hr className="border-slate-900" />

                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {plano.vantagens.map((v, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  onClick={() => handleAssinar(plano.nome, plano.preco)}
                  className={`w-full h-11 rounded-xl font-bold text-xs transition ${
                    plano.popular 
                      ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/10" 
                      : "bg-slate-900 hover:bg-slate-800 text-slate-100"
                  }`}
                >
                  Contratar Plano
                </Button>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Dispositivos Suportados */}
      <section className="py-16 bg-[#04060e] border-y border-slate-900/40">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-around gap-8 text-center sm:text-left text-slate-400 text-sm">
          <div className="flex items-center gap-3">
            <Tv className="h-8 w-8 text-amber-500 shrink-0 mx-auto" />
            <div>
              <h4 className="font-bold text-slate-200">Smart TV / TV Box</h4>
              <p className="text-xs">Aplicativos dedicados e leves.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-amber-500 shrink-0 mx-auto" />
            <div>
              <h4 className="font-bold text-slate-200">Celular / Tablet</h4>
              <p className="text-xs">Assista de onde estiver.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Laptop className="h-8 w-8 text-amber-500 shrink-0 mx-auto" />
            <div>
              <h4 className="font-bold text-slate-200">Computador</h4>
              <p className="text-xs">Player web direto no navegador.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 relative">
        <div className="max-w-3xl mx-auto px-4">
          
          <div className="text-center mb-12 space-y-2">
            <HelpCircle className="h-8 w-8 text-amber-500 mx-auto" />
            <h2 className="text-3xl font-extrabold tracking-tight">Perguntas Frequentes</h2>
            <p className="text-slate-400 text-sm">Tem alguma dúvida? Confira as respostas rápidas abaixo.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                className="bg-slate-900/10 border border-slate-900 rounded-2xl overflow-hidden transition"
              >
                <button 
                  onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                  className="w-full px-5 py-4 flex items-center justify-between font-bold text-slate-200 text-sm text-left hover:bg-slate-900/20"
                >
                  <span>{faq.p}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${faqAberto === i ? "rotate-180" : ""}`} />
                </button>
                {faqAberto === i && (
                  <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-900/30 pt-3">
                    {faq.r}
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
            <span className="text-sm font-heading font-black tracking-tighter text-slate-400">
              ESA<span className="text-amber-500">Play</span>
            </span>
          </div>
          <p className="max-w-md mx-auto text-[10px] text-slate-600 leading-relaxed">
            ESA Play é uma plataforma de demonstração de serviços de streaming. Não hospedamos ou comercializamos arquivos protegidos por direitos autorais em nossos servidores.
          </p>
          <div className="flex justify-center gap-6 text-[11px] font-bold text-slate-500">
            <Link href="/consulta" className="hover:text-slate-300">Portal de Pagamentos</Link>
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
