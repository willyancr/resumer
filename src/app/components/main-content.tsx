"use client";
import ArticleSummaryCard from "./summary-and-share";
import { Input } from "@/components/ui/input";
import ButtonResumer from "./button-resumer";
import { useState } from "react";

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
        <ArticleSummaryCard article={article} loading={loading} />
      </div>
    </div>
  );
}
