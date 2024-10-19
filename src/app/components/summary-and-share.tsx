"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy } from "lucide-react";
import { useState } from "react";
import Loader from "./loader";

type Article = {
  title: string;
  excerpt: string;
  summary: string;
};

export default function ArticleSummaryCard({
  article,
  loading,
}: {
  article: Article;
  loading: boolean;
}) {
  const [activeTab, setActiveTab] = useState("summary");
  const [copied, setCopied] = useState(false);

  const articleTitle = "The Future of Artificial Intelligence";

  const tweetTemplate = `Just read an fascinating article on "${articleTitle}"! Key takeaway: AI is set to transform multiple industries. #AI #FutureTech `;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tweetTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="mx-auto h-[450px] w-full max-w-[700px] bg-primary/10">
      <CardContent className="py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-[350px] grid-cols-2 bg-gradient-custom text-zinc-50">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="twitter">Resumo para X/Twitter</TabsTrigger>
          </TabsList>
          <TabsContent
            value="summary"
            className="mt-4 h-[350px] overflow-y-auto rounded-md bg-background p-4"
          >
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader />
              </div>
            ) : article.title ? (
              <div>
                <p className="text-xl font-semibold text-gray-600">
                  {article.title}
                </p>
                <p className="text-sm italic text-gray-600">
                  {article.excerpt}
                </p>
                <p className="mt-4 text-gray-600">{article.summary}</p>
                <Button
                  onClick={copyToClipboard}
                  className="ml-auto mt-5 flex items-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copied ? "Copiado!" : "Copiar Resumo"}</span>
                </Button>
              </div>
            ) : (
              <p className="text-center text-primary">
                Cole uma URL e clique em{" "}
                <strong className="text-secondary-foreground">Resumer</strong>{" "}
                para ver o resumo aqui.
              </p>
            )}
          </TabsContent>
          <TabsContent
            value="twitter"
            className="mt-4 h-[350px] rounded-md bg-background p-4"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{tweetTemplate}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {tweetTemplate.length}/280 caracteres
                </span>
                <Button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copied ? "Copiado!" : "Copiar Tweet"}</span>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
