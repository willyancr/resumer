import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import axios from "axios";

// CONFIGURAÇÃO DO NEXT.JS (APP ROUTER)
// Tenta aumentar o tempo limite da função na Vercel para 60 segundos (padrão é 10s no Hobby)
export const maxDuration = 60; 
// Força a renderização dinâmica para evitar cache estático indesejado
export const dynamic = 'force-dynamic';

/**
 * Função auxiliar para chamar a API Gemini (v1beta) via REST.
 */
async function callGemini(
  prompt: string,
  generationConfig: {
    maxOutputTokens: number;
    temperature: number;
    topK: number;
    topP: number;
  },
): Promise<string> {
  const model = "gemini-2.5-flash-preview-09-2025";
  const apiKey = process.env.GEMINI_API_KEY;

  // Verificação crucial para Debug na Vercel
  if (!apiKey) {
    console.error("ERRO CRÍTICO: GEMINI_API_KEY não encontrada nas variáveis de ambiente.");
    throw new Error("API Key do Gemini não configurada no servidor.");
  }
  
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: generationConfig,
    systemInstruction: {
      parts: [{ text: "Você é um assistente especializado em processar e resumir textos de artigos da web." }]
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Erro na API Gemini:", response.status, errorBody);
      throw new Error(`Falha na API Gemini: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      if (result.candidates?.[0]?.finishReason === "MAX_TOKENS") {
          console.error("Erro: A resposta foi cortada por MAX_TOKENS.", JSON.stringify(result, null, 2));
          throw new Error("A geração de resposta excedeu o limite máximo de tokens.");
      }
      console.error("Resposta inesperada da API Gemini (sem texto):", JSON.stringify(result, null, 2));
      throw new Error("Não foi possível extrair o texto da resposta da API.");
    }

    return text.trim();

  } catch (error) {
    console.error("Erro ao chamar callGemini:", error);
    const errorMessage = (error instanceof Error) ? error.message : "Falha ao comunicar com a API Generativa.";
    throw new Error(errorMessage);
  }
}

// Handler da rota POST
export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    console.log("URL RECEBIDA:", url);

    if (!process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Configuração de API ausente no servidor (Verifique as variáveis de ambiente na Vercel)." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "URL inválida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Tenta buscar a página com timeout de 15s (um pouco maior para evitar falha prematura)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'Referer': 'https://www.google.com/', 
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
        JSON.stringify({ error: "Não foi possível ler o texto principal dessa página. O site pode estar bloqueando a leitura." }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      );
    }

    const articleText = article.textContent;

    // Resumo Principal
    const promptSummary = `Você é um assistente especializado em resumir artigos. Faça um resumo conciso e informativo do seguinte texto: "${articleText}", sem usar formatação markdown. O resumo deve ter no máximo 490 tokens e terminar com uma frase completa.`;
    
    const configSummary = {
      maxOutputTokens: 2048, 
      temperature: 0,
      topK: 1,
      topP: 1,
    };
    
    // Executa em paralelo se possível, ou sequencial para evitar estourar memória se for função pequena
    // Vamos manter sequencial para garantir estabilidade
    const summary = await callGemini(promptSummary, configSummary);

    // Resumo Twitter
    const promptTwitter = `Você é um assistente especializado em gerar tweets de notícias. Com base no seguinte texto: '${articleText}', crie um tweet altamente conciso, informativo e atrativo que resuma o ponto principal do artigo. O tweet deve conter no máximo 280 caracteres.`;

    const configTwitter = {
      maxOutputTokens: 1024,
      temperature: 0,
      topK: 1,
      topP: 1,
    };

    const summaryTwitter = await callGemini(promptTwitter, configTwitter);

    return new Response(
      JSON.stringify({
        title: article?.title,
        excerpt: article?.excerpt,
        content: article?.textContent, 
        summary: summary,
        summaryTwitter: summaryTwitter,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  } catch (error: unknown) {
    // Tratar erros gerais e específicos do Axios
    if (error instanceof Error) {
      console.error("Falha geral no processamento:", error.message);
    } else {
      console.error("Falha geral no processamento:", error);
    }
    
    let errorMessage = "Falha interna no servidor.";
    let statusCode = 500;

    if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
            errorMessage = "O site bloqueou o acesso do servidor Vercel (Erro 403). Tente rodar localmente ou usar proxies.";
            statusCode = 403;
        } else if (error.response?.status === 404) {
             errorMessage = "Página não encontrada (404).";
             statusCode = 404;
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = "O site demorou muito para responder (Timeout).";
            statusCode = 504;
        }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: statusCode, headers: { "Content-Type": "application/json" } },
    );
  }
}