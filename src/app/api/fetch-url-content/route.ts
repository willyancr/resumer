// Importações necessárias para extração de conteúdo e requisições HTTP
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import axios from "axios";

async function callGemini(
  prompt: string,
  generationConfig: {
    maxOutputTokens: number;
    temperature: number;
    topK: number;
    topP: number;
  },
): Promise<string> {
  // Usamos o modelo mais recente
  const model = "gemini-2.5-flash-preview-09-2025";
  
  // A chave de API é lida das variáveis de ambiente
  const apiKey = process.env.GEMINI_API_KEY || "";
  
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
    // 1. Extrair e validar a URL
    const { url } = await req.json();
    console.log("URL RECEBIDA", url);

    try {
      new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "URL inválida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Buscar e processar o conteúdo da página com Headers Reforçados
    // Sites protegidos por Cloudflare (como o Tecnoblog) precisam destes headers
    // para acreditar que somos um navegador real.
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        // Referer ajuda a enganar alguns sites pensando que viemos do Google
        'Referer': 'https://www.google.com/', 
      },
      // Timeout para evitar travamentos longos
      timeout: 10000, 
    });
    
    console.log("Status da resposta HTTP:", response.status);

    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    // 3. Verificar se o Readability funcionou ANTES de chamar a API
    if (!article || !article.textContent) {
      console.error("Erro: Readability não conseguiu processar o conteúdo");
      return new Response(
        JSON.stringify({ error: "Erro ao processar o conteúdo da página (falha na leitura)" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const articleText = article.textContent;

    // 4. Gerar resumo principal usando a nova função
    const promptSummary = `Você é um assistente especializado em resumir artigos. Faça um resumo conciso e informativo do seguinte texto: "${articleText}", sem usar formatação markdown. O resumo deve ter no máximo 490 tokens e terminar com uma frase completa.
    Importante: Certifique-se de que o resumo termine com uma frase completa, mesmo que isso signifique usar menos de 490 tokens.`;
    
    const configSummary = {
      maxOutputTokens: 2048, 
      temperature: 0,
      topK: 1,
      topP: 1,
    };
    
    const summary = await callGemini(promptSummary, configSummary);

    // 5. Gerar resumo para o Twitter usando a nova função
    const promptTwitter = `Você é um assistente especializado em gerar tweets de notícias. Com base no seguinte texto: '${articleText}', crie um tweet altamente conciso, informativo e atrativo que resuma o ponto principal do artigo. O tweet deve conter no máximo 280 caracteres (incluindo espaços), ser fácil de entender e instigante. Evite o uso de formatação markdown e certifique-se de que a última frase seja completa, mesmo que o tweet fique com menos de 280 caracteres. Se relevante, considere incluir uma hashtag ou uma chamada para ação apropriada.`;

    const configTwitter = {
      maxOutputTokens: 1024,
      temperature: 0,
      topK: 1,
      topP: 1,
    };

    const summaryTwitter = await callGemini(promptTwitter, configTwitter);

    // 6. Retornar a resposta completa
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
  } catch (error: any) {
    // Tratar erros gerais e específicos do Axios
    console.error("Falha geral no processamento:", error.message);
    
    let errorMessage = "Falha ao buscar o conteúdo da URL";
    let statusCode = 500;

    if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
            errorMessage = "O site bloqueou o acesso automatizado (Proteção Cloudflare/WAF). Tente outra URL ou um site menos restritivo.";
            statusCode = 403;
        } else if (error.response?.status === 404) {
             errorMessage = "Artigo não encontrado (404). Verifique a URL.";
             statusCode = 404;
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