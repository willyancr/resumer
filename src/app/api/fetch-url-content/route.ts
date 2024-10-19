import { GoogleGenerativeAI } from "@google/generative-ai";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import axios from "axios";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    // Extrair a URL do corpo da requisição
    const { url } = await req.json();
    console.log("URL RECEBIDA", url);

    // Validar a URL antes de prosseguir
    try {
      new URL(url);
    } catch {
      // Retornar erro se a URL for inválida
      return new Response(JSON.stringify({ error: "URL inválida" }), {
        status: 400,
      });
    }

    // Fazer a requisição GET para a URL fornecida
    const response = await axios.get(url);
    console.log("Status da resposta:", response.status);

    // Criar um DOM a partir do conteúdo HTML recebido
    const dom = new JSDOM(response.data, { url });
    // Inicializar o Readability com o documento do DOM
    const reader = new Readability(dom.window.document);
    // Extrair o conteúdo principal da página
    const article = reader.parse();

    //Gerar resumo usando o Gemini
    const modelSummary = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0,
        topK: 1,
        topP: 1,
      },
    });
    const prompt = `Você é um assistente especializado em resumir artigos. Faça um resumo conciso e informativo do seguinte texto: "${article?.textContent}", sem usar formatação markdown. O resumo deve ter no máximo 490 tokens e terminar com uma frase completa.
    Importante: Certifique-se de que o resumo termine com uma frase completa, mesmo que isso signifique usar menos de 490 tokens.`;

    const result = await modelSummary.generateContent(prompt);
    const summary = result.response.text().trim();

    //Gerar resumo pra twitter usando o Gemini
    const modelTwitter = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 280,
        temperature: 0,
        topK: 1,
        topP: 1,
      },
    });
    const promptTwitter = `Você é um assistente especializado em gerar tweets de notícias. Com base no seguinte texto: '${article?.textContent}', crie um tweet altamente conciso, informativo e atrativo que resuma o ponto principal do artigo. O tweet deve conter no máximo 280 caracteres (incluindo espaços), ser fácil de entender e instigante. Evite o uso de formatação markdown e certifique-se de que a última frase seja completa, mesmo que o tweet fique com menos de 280 caracteres. Se relevante, considere incluir uma hashtag ou uma chamada para ação apropriada.`;

    const resultTwitter = await modelTwitter.generateContent(promptTwitter);
    const summaryTwitter = resultTwitter.response.text().trim();

    // Verificar se o Readability conseguiu processar o conteúdo
    if (!article) {
      console.error("Erro: Readability não conseguiu processar o conteúdo");
      return new Response(
        JSON.stringify({ error: "Erro ao processar o conteúdo da página" }),
        { status: 500 },
      );
    }

    // Retornar o conteúdo processado
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
  } catch (error) {
    // Tratar erros gerais
    console.error("Falha ao buscar conteúdo da URL", error);
    return new Response(
      JSON.stringify({ error: "Falha ao buscar o conteúdo da URL" }),
      { status: 500 },
    );
  }
}
