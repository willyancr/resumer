"use client";
import ButtonResumer from "./button-resumer";
import ButtonCopy from "./button-copy";
import { useState } from "react";
import Loader from "./loader";
import { Input } from "@/components/ui/input";

type Article = {
  title: string;
  content: string;
  excerpt: string;
  summary: string;
};

export default function MainContent() {
  const [article, setArticle] = useState<Article>({
    title: "",
    content: "",
    excerpt: "",
    summary: "",
  });
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    if (!url) {
      console.error("URL inválida");
      alert("URL inválida");
      setLoading(false);
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
        setUrl("");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Falha ao buscar conteúdo da URL", err);
        setLoading(false);
      });
  };

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-12 px-4 py-8 md:px-12">
      <div className="mx-auto w-full max-w-[700px]">
        <h1 className="text-center text-xl font-bold text-primary md:text-2xl">
          Com o{" "}
          <span className="bg-gradient-custom bg-clip-text text-2xl text-transparent md:text-3xl">
            Resumer
          </span>
          , você obtém resumos inteligentes e rápidos das matérias que desejar,
          usando o poder da Inteligência Artificial.
        </h1>
      </div>
      <div className="flex w-full max-w-[700px] flex-col gap-12">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full flex-col items-center justify-between gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:px-6"
        >
          <Input
            type="url"
            placeholder="Cole a URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="text-primary"
          />

          {loading ? <ButtonResumer disabled /> : <ButtonResumer />}
        </form>

        <div className="h-[400px] w-full overflow-y-auto rounded-md bg-primary/10 px-4 py-4 font-semibold outline-0 sm:px-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader />
            </div>
          ) : article.title ? (
            <div>
              <div className="flex items-start justify-between">
                <h1 className="text-2xl text-zinc-950">{article.title}</h1>

                <ButtonCopy
                  title={article.title}
                  excerpt={article.excerpt}
                  sumary={article.summary}
                />
              </div>
              <p className="mb-4 italic text-zinc-700">{article.excerpt}</p>
              <p className="font-poppins mb-4 text-primary">
                {article.summary}
              </p>
            </div>
          ) : (
            <p className="text-center text-primary">
              Cole uma URL e clique em{" "}
              <strong className="text-secondary-foreground">Resumer</strong>{" "}
              para ver o resumo aqui.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
