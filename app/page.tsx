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
  Lock,
  Cake
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
    const mensagem = `Olá! Vi o site da ESA Play e gostaria de aproveitar a Promoção de Aniversário do *${plano}* (R$ ${valor}). Como faço para ativar?`;
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
      nome: "Plano Mensal",
      preco: "35,00",
      precoOriginal: null,
      duracao: "/mês",
      popular: false,
      vantagens: ["Acesso completo a canais, filmes e séries", "Qualidade Ultra HD / 4K", "Sem fidelidade", "Suporte 24h"]
    },
    {
      nome: "Plano Trimestral",
      preco: "81,00",
      precoOriginal: "105,00",
      duracao: "/trimestre",
      popular: true,
      vantagens: ["Economia de R$ 24,00!", "Acesso por 90 dias", "Qualidade Ultra HD / 4K", "Suporte prioritário"]
    },
    {
      nome: "Plano Semestral",
      preco: "190,00",
      precoOriginal: "210,00",
      duracao: "/semestre",
      popular: false,
      vantagens: ["Economia de R$ 20,00!", "Acesso por 180 dias", "Qualidade Ultra HD / 4K", "Suporte VIP"]
    },
    {
      nome: "Plano Anual",
      preco: "300,00",
      precoOriginal: "420,00",
      duracao: "/ano",
      popular: false,
      vantagens: ["Economia gigante de R$ 120,00!", "Acesso por 365 dias", "Qualidade Ultra HD / 4K", "Suporte Ultra VIP"]
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
    <div className="min-h-screen bg-[#060814] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-900 overflow-x-hidden">
      
      {/* Estilos para animações de balões e efeitos */}
      <style>{`
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(-3deg); }
        }
        .animate-float-1 { animation: float-gentle 6s ease-in-out infinite; }
        .animate-float-2 { animation: float-delayed 8s ease-in-out infinite; }
        .animate-float-3 { animation: float-gentle 7s ease-in-out infinite 1s; }
        .animate-float-4 { animation: float-delayed 9s ease-in-out infinite 1.5s; }
      `}</style>

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
      <section className="relative min-h-[90vh] pt-32 pb-24 flex items-center overflow-hidden">
        
        {/* Imagem de Fundo Completa Enviada pelo Usuário */}
        <div 
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.85] md:brightness-[0.9] pointer-events-none scale-100 transition-all duration-700"
          style={{ backgroundImage: "url('/banner-aniversario.png')" }}
        />
        
        {/* Gradientes e Fades para Suavizar Bordas */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060814]/80 via-transparent to-[#060814]/80 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060814]/50 via-transparent to-[#060814]/50 pointer-events-none" />

        {/* Balões de Aniversário Flutuantes (Esquerda) */}
        <div className="absolute left-[3%] top-[25%] z-20 animate-float-1 hidden xl:block">
          <div className="w-12 h-16 bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 rounded-full shadow-lg relative">
            <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-0 h-0 border-t-[5px] border-t-yellow-700 border-x-[3.5px] border-x-transparent" />
            <div className="absolute bottom-[-35px] left-1/2 -translate-x-1/2 w-[1px] h-[35px] bg-slate-500/40" />
          </div>
        </div>
        <div className="absolute left-[12%] top-[55%] z-20 animate-float-2 hidden xl:block">
          <div className="w-16 h-20 bg-gradient-to-br from-sky-300 via-blue-500 to-blue-700 rounded-full shadow-lg relative">
            <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-0 h-0 border-t-[5px] border-t-blue-800 border-x-[3.5px] border-x-transparent" />
            <div className="absolute bottom-[-45px] left-1/2 -translate-x-1/2 w-[1px] h-[45px] bg-slate-500/40" />
          </div>
        </div>

        {/* Balões de Aniversário Flutuantes (Direita) */}
        <div className="absolute right-[4%] top-[20%] z-20 animate-float-3 hidden xl:block">
          <div className="w-14 h-18 bg-gradient-to-br from-amber-300 via-yellow-400 to-yellow-600 rounded-full shadow-lg relative">
            <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-0 h-0 border-t-[5px] border-t-yellow-700 border-x-[3.5px] border-x-transparent" />
            <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-[1px] h-[40px] bg-slate-500/40" />
          </div>
        </div>
        <div className="absolute right-[10%] top-[48%] z-20 animate-float-4 hidden xl:block">
          <div className="w-16 h-21 bg-gradient-to-br from-sky-300 via-blue-500 to-blue-700 rounded-full shadow-lg relative">
            <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-0 h-0 border-t-[5px] border-t-blue-800 border-x-[3.5px] border-x-transparent" />
            <div className="absolute bottom-[-45px] left-1/2 -translate-x-1/2 w-[1px] h-[45px] bg-slate-500/40" />
          </div>
        </div>

        {/* Conteúdo Central */}
        <div className="max-w-2xl mx-auto px-4 relative z-30 pt-6">
          <div className="bg-[#060814]/85 backdrop-blur-md border border-slate-900/80 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl text-center">
            
            {/* Selo/Bolo de Aniversário */}
            <div className="inline-flex flex-col items-center gap-2">
              <div className="h-12 w-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/25 transform hover:scale-105 transition">
                <Cake className="h-6 w-6 text-[#060814]" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-black tracking-widest text-amber-500 uppercase">
                Feliz 1º Aniversário ESA Play!
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] text-slate-50 uppercase">
              Celebrando nosso primeiro ano <br />
              <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent">de TV Online!</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto font-medium leading-relaxed">
              Séries Exclusivas, Filmes Blockbuster & a Copa do Mundo FIFA 2026™ <br />
              tudo com <strong className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wide inline-block mt-1">Ofertas Especiais!</strong>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <a href="#planos" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-6 flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transform active:scale-95 transition-all">
                  Ver Ofertas de Aniversário <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link href="/consulta" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-11 rounded-xl border-slate-800 bg-slate-950/60 hover:bg-slate-900 text-slate-200 font-bold text-xs px-6 flex items-center justify-center gap-2 hover:border-slate-700">
                  <Play className="h-4 w-4 text-amber-500 animate-pulse" /> Acessar Portal do Cliente
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo Destaques */}
      <section id="catalogo" className="py-20 bg-slate-950/40 relative border-t border-slate-900/30">
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
          
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-extrabold uppercase tracking-wide">
              🎉 1 Ano de TV Online - Aniversário ESA Play!
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Escolha o seu plano</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Aproveite nossas promoções de aniversário por tempo limitado (de 05/07/2026 a 05/08/2026) e garanta sua diversão!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Acesso Imediato</span>
                  </div>
                  
                  <div className="flex flex-col">
                    {plano.precoOriginal && (
                      <span className="text-xs text-slate-500 line-through">
                        De R$ {plano.precoOriginal}
                      </span>
                    )}
                    <div className="flex items-baseline">
                      <span className="text-sm font-semibold text-slate-400">R$</span>
                      <span className="text-3xl font-black text-slate-50 ml-1">{plano.preco}</span>
                      <span className="text-[11px] text-slate-400 ml-1">{plano.duracao}</span>
                    </div>
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
