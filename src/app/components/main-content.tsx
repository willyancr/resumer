"use client";
import { useState } from "react";

type Article = {
  title: string;
  content: string;
  excerpt: string;
};

export default function MainContent() {
  const [url, setUrl] = useState<string>("");
  const [article, setArticle] = useState<Article>({
    title: "",
    content: "",
    excerpt: "",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!url) {
      console.error("URL inválida");
      return;
    }

    fetch("/api/fetch-url-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setArticle(data);
      })
      .catch((error) => {
        console.error("Falha ao buscar conteúdo da URL", error);
      });
  };

  // Função para remover imagens de um HTML
  const removeImagesHtml = (html: string) => {
    // Cria um novo objeto DOMParser e analisa a string HTML
    const doc = new DOMParser().parseFromString(html, "text/html");
    const images = doc.querySelectorAll("img");

    images.forEach((image) => image.remove());
    // Retorna o HTML do corpo do documento sem as imagens
    return doc.body.innerHTML;
  };

  const optimizeContent = removeImagesHtml(article.content);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-12 px-4 py-8 md:px-12">
      <div className="mx-auto w-full max-w-[700px]">
        <h1 className="text-center text-xl md:text-2xl font-bold text-zinc-300">
          Com o <span className="text-2xl md:text-3xl text-zinc-50">Resumer</span>, você
          obtém resumos inteligentes e rápidos das matérias que desejar, usando
          o poder da Inteligência Artificial.
        </h1>
      </div>
      <div className="flex flex-col gap-12 w-full max-w-[700px]">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full flex-col sm:flex-row items-center justify-between gap-2 rounded-xl border border-zinc-500 px-4 sm:px-6 py-3"
        >
          <input
            type="text"
            placeholder="Cole a URL"
            className="w-full sm:w-[calc(100%-120px)] rounded-md bg-zinc-800 px-4 py-3 font-semibold outline-0 mb-2 sm:mb-0"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="submit"
            className="w-full sm:w-auto rounded-md bg-zinc-200 px-4 py-3 text-lg font-semibold text-zinc-950 transition-colors hover:bg-zinc-300"
          >
            Resumer
          </button>
        </form>
        <div>
          {article && (
            <div className="h-[400px] w-full overflow-y-auto rounded-md bg-zinc-800 px-4 sm:px-6 py-4 font-semibold outline-0">
              <h1 className="text-lg text-zinc-300">{article.title}</h1>
              <p className="mb-4 italic text-zinc-300">{article.excerpt}</p>
              {/* O uso dangerouslySetInnerHTML é responsável por permitir que o conteúdo HTML seja renderizado corretamente. */}
              <div
                className="prose mb-4 text-zinc-300"
                dangerouslySetInnerHTML={{ __html: optimizeContent }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
