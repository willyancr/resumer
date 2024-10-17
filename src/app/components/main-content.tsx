"use client";
import { useState } from "react";

type Article = {
  title: string;
  content: string;
  excerpt: string;
  summary: string;
};

export default function MainContent() {
  const [url, setUrl] = useState<string>("");
  const [article, setArticle] = useState<Article>({
    title: "",
    content: "",
    excerpt: "",
    summary: "",
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

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-12 px-4 py-8 md:px-12">
      <div className="mx-auto w-full max-w-[700px]">
        <h1 className="text-center text-xl font-bold text-zinc-300 md:text-2xl">
          Com o{" "}
          <span className="text-2xl text-zinc-50 md:text-3xl">Resumer</span>,
          você obtém resumos inteligentes e rápidos das matérias que desejar,
          usando o poder da Inteligência Artificial.
        </h1>
      </div>
      <div className="flex w-full max-w-[700px] flex-col gap-12">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full flex-col items-center justify-between gap-2 rounded-xl border border-zinc-500 px-4 py-3 sm:flex-row sm:px-6"
        >
          <input
            type="text"
            placeholder="Cole a URL"
            className="mb-2 w-full rounded-md bg-zinc-800 px-4 py-3 font-semibold outline-0 sm:mb-0 sm:w-[calc(100%-120px)]"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-md bg-zinc-200 px-4 py-3 text-lg font-semibold text-zinc-950 transition-colors hover:bg-zinc-300 sm:w-auto"
          >
            Resumer
          </button>
        </form>
        <div>
          {article && (
            <div className="h-[400px] w-full overflow-y-auto rounded-md bg-zinc-800 px-4 py-4 font-semibold outline-0 sm:px-6">
              <h1 className="text-2xl text-zinc-300">{article.title}</h1>
              <p className="mb-4 italic text-zinc-400">{article.excerpt}</p>
              <p className="font-poppins mb-4 text-zinc-300">
                {article.summary}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
