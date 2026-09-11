"use client";
import ArticleSummaryCard from "./summary-and-share";
import { Input } from "@/components/ui/input";
import ButtonResumer from "./button-resumer";
import { useState } from "react";
import { ClipboardPaste, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Article = {
  title: string;
  content: string;
  excerpt: string;
  summary: string;
  summaryTwitter: string;
};

export default function MainContent() {
  const [article, setArticle] = useState<Article>({
    title: "",
    content: "",
    excerpt: "",
    summary: "",
    summaryTwitter: "",
  });
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setErrorMessage("");
    } catch (err) {
      console.error("Falha ao ler do clipboard", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage("");

    if (!url || !url.trim()) {
      setErrorMessage("Por favor, insira uma URL válida.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/fetch-url-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.error || `Falha na requisição (Status: ${response.status}).`;
        setErrorMessage(message);
        setLoading(false);
        return;
      }

      if (!data || !data.summary) {
        setErrorMessage("Não foi possível obter o resumo desta página.");
        setLoading(false);
        return;
      }

      setArticle(data);
      setUrl("");
      setLoading(false);
    } catch (err) {
      console.error("Falha ao buscar conteúdo da URL", err);
      setErrorMessage(
        "Erro de conexão com o servidor. Verifique sua rede e tente novamente."
      );
      setLoading(false);
    }
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
      <div className="flex w-full max-w-[700px] flex-col gap-8">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full flex-col items-center justify-between gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:px-6"
        >
          <Input
            type="url"
            placeholder="Cole a URL"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (errorMessage) setErrorMessage("");
            }}
            className="text-primary"
          />

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handlePaste}
              className="flex items-center gap-2 border-primary/20 text-primary hover:bg-primary/5"
            >
              <ClipboardPaste className="h-4 w-4" />
              <span className="sm:hidden lg:inline">Colar</span>
            </Button>
            {loading ? <ButtonResumer disabled /> : <ButtonResumer />}
          </div>
        </form>

        {errorMessage && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <ArticleSummaryCard article={article} loading={loading} />
      </div>
    </div>
  );
}