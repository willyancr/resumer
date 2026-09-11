import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import axios from "axios";
import Groq from "groq-sdk";

// CONFIGURAÇÃO DO NEXT.JS (APP ROUTER)
export const maxDuration = 60; 
export const dynamic = "force-dynamic";

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Configuração de API ausente no servidor (Verifique a GROQ_API_KEY no arquivo .env.local).");
  }
  return new Groq({ apiKey });
}

/**
 * Função auxiliar para chamar a API da Groq.
 */
async function callGroq(
  prompt: string,
  config: {
    max_tokens: number;
    temperature: number;
  },
  systemPrompt: string = "Você é um assistente útil."
): Promise<string> {
  const groq = getGroqClient();

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: process.env.GROQ_MODEL || "groq/compound-mini", 
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      top_p: 1,
      stream: false,
    });

    const content = chatCompletion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("A API da Groq retornou uma resposta vazia.");
    }

    return content.trim();

  } catch (error) {
    console.error("Erro ao chamar Groq:", error);
    if (error instanceof Error) {
      throw new Error(`Erro na IA: ${error.message}`);
    }
    throw new Error("Falha desconhecida na comunicação com a IA.");
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handler para preflight CORS (OPTIONS)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Handler da rota POST
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, text, title } = body;
    console.log("DADOS RECEBIDOS:", { url, hasText: !!text, title });

    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuração de API ausente no servidor (Verifique a GROQ_API_KEY no arquivo .env.local)." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let articleTitle = title || "";
    let articleExcerpt = "";
    let articleText = "";

    // Se o cliente (ex: extensão) já extraiu o texto diretamente do DOM
    if (text && typeof text === "string" && text.trim().length > 50) {
      articleText = text.trim();
      articleTitle = title || "Artigo da Página";
      articleExcerpt = articleText.slice(0, 200).replace(/\s+/g, " ") + "...";
    } else {
      if (!url) {
        return new Response(JSON.stringify({ error: "URL ou texto da matéria é obrigatório." }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      try {
        new URL(url);
      } catch {
        return new Response(JSON.stringify({ error: "URL inválida." }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Tenta buscar a página com timeout e headers para evitar bloqueios
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Cache-Control": "max-age=0",
        },
        timeout: 15000, 
      });
      
      console.log("Status HTTP da Página Alvo:", response.status);

      const dom = new JSDOM(response.data, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article || !article.textContent) {
        console.error("Erro: Readability retornou conteúdo vazio.");
        return new Response(
          JSON.stringify({ error: "Não foi possível extrair o texto principal dessa página. O site pode estar bloqueando a leitura ou não possui conteúdo textual legível." }),
          { status: 422, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      articleText = article.textContent;
      articleTitle = article.title || "";
      articleExcerpt = article.excerpt || "";
    }

    // --- Resumo Principal ---
    const promptSummary = `Faça um resumo conciso e informativo do seguinte texto: "${articleText.slice(0, 10000)}". Não use formatação markdown (negrito, títulos). O resumo deve ter no máximo 490 tokens e terminar com uma frase completa. Responda em Português do Brasil.`;
    
    const configSummary = {
      max_tokens: 1000, 
      temperature: 0.5,
    };
    
    // Chamada para o Resumo
    const summary = await callGroq(
      promptSummary, 
      configSummary, 
      "Você é um assistente especializado em processar e resumir textos de artigos da web."
    );

    // --- Resumo Twitter ---
    const promptTwitter = `Com base no seguinte texto: '${articleText.slice(0, 10000)}', crie um tweet altamente conciso, informativo e atrativo que resuma o ponto principal do artigo. O tweet deve conter no máximo 280 caracteres. Não use aspas.`;

    const configTwitter = {
      max_tokens: 300,
      temperature: 0.7,
    };

    // Chamada para o Twitter
    const summaryTwitter = await callGroq(
      promptTwitter, 
      configTwitter,
      "Você é um especialista em redes sociais e copy para Twitter."
    );

    return new Response(
      JSON.stringify({
        title: articleTitle,
        excerpt: articleExcerpt,
        content: articleText, 
        summary: summary,
        summaryTwitter: summaryTwitter,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Falha geral no processamento:", error.message);
    } else {
      console.error("Falha geral no processamento:", error);
    }
    
    let errorMessage = "Falha interna no servidor.";
    let statusCode = 500;

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        errorMessage = "O site bloqueou o acesso do servidor (Erro 403 - Proteção anti-bot).";
        statusCode = 403;
      } else if (error.response?.status === 404) {
        errorMessage = "Página não encontrada (Erro 404).";
        statusCode = 404;
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "O site demorou muito para responder (Tempo esgotado).";
        statusCode = 504;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: statusCode, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}