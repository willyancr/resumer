import { Readability } from "@mozilla/readability";
import axios from "axios";
import { JSDOM } from "jsdom";

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
