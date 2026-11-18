import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export interface BannerItem {
  titulo: string;
  imagem: string;
}

const FALLBACK_BANNERS: BannerItem[] = [
  {
    titulo: "Duna: Parte Dois",
    imagem: "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
  },
  {
    titulo: "Deadpool & Wolverine",
    imagem: "https://image.tmdb.org/t/p/w1280/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg",
  },
  {
    titulo: "Divertida Mente 2",
    imagem: "https://image.tmdb.org/t/p/w1280/stKGOm8UyhuLPR9sZLjs5AkmncA.jpg",
  },
];

export async function GET() {
  try {
    let tmdbKey = process.env.TMDB_API_KEY?.trim() || "";

    if (!tmdbKey && adminDb) {
      try {
        const snap = await adminDb.collection("configuracoes").limit(5).get();
        for (const doc of snap.docs) {
          const val = String(doc.data()?.tmdbApiKey || "").trim();
          if (val) {
            tmdbKey = val;
            break;
          }
        }
      } catch (err) {
        console.warn("Erro ao ler tmdbApiKey no Firestore:", err);
      }
    }

    if (!tmdbKey) {
      return NextResponse.json({ banners: FALLBACK_BANNERS, source: "fallback" });
    }

    const res = await fetch(
      `https://api.themoviedb.org/3/trending/all/day?language=pt-BR&api_key=${encodeURIComponent(tmdbKey)}`,
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ banners: FALLBACK_BANNERS, source: "fallback" });
    }

    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    const banners: BannerItem[] = results
      .filter((item: any) => item?.backdrop_path && (item?.title || item?.name))
      .slice(0, 15)
      .map((item: any) => ({
        titulo: String(item.title || item.name),
        imagem: `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`,
      }));

    if (banners.length === 0) {
      return NextResponse.json({ banners: FALLBACK_BANNERS, source: "fallback" });
    }

    return NextResponse.json({ banners, source: "tmdb" });
  } catch (error) {
    console.warn("Erro ao buscar banners do TMDB:", error);
    return NextResponse.json({ banners: FALLBACK_BANNERS, source: "fallback" });
  }
}
