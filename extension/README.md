# 🧩 Extensão do Google Chrome - Resumer

Extensão oficial para o Google Chrome que resume matérias jornalísticas e páginas da web diretamente da aba ativa usando Inteligência Artificial.

---

## 🚀 Como Instalar no Google Chrome (Modo Desenvolvedor)

Como a extensão está em desenvolvimento local, você pode instalá-la em segundos sem precisar de loja ou compilação:

1. Abra o **Google Chrome**.
2. Na barra de endereços, digite:
   ```text
   chrome://extensions
   ```
   e pressione **Enter**.
3. No canto superior direito da página, **ative a chave "Modo do desenvolvedor"** (*Developer mode*).
4. No canto superior esquerdo, clique no botão **"Carregar sem compactação"** (*Load unpacked*).
5. Na janela que abrir, selecione a pasta:
   ```text
   c:\Users\willyan.costa\Documents\Will\resumer\extension
   ```
6. Pronto! O ícone do **Resumer** aparecerá na sua barra de extensões do Chrome. 
   *(Dica: clique no ícone de "quebra-cabeça" na barra do Chrome e fixe o Resumer para acesso rápido).*

---

## ⚙️ Configuração da API

Por padrão, a extensão está configurada para se comunicar com o seu backend local:
```text
http://localhost:3000/api/fetch-url-content
```

* **Para testar localmente:** Certifique-se de iniciar o projeto Next.js no terminal com `npm run dev`.
* **Para usar com o site publicado (Vercel / Produção):**
  1. Clique no ícone da extensão.
  2. Clique no ícone de **engrenagem (⚙️)** no topo direito.
  3. Altere a URL para o seu domínio (exemplo: `https://seu-resumer.vercel.app/api/fetch-url-content`).
  4. Clique em **Salvar**.

---

## ✨ Funcionalidades

- **Resumo em 1 Clique:** Detecta a aba aberta e resume automaticamente.
- **Extração Inteligente do DOM:** Lê o texto diretamente da tela do seu navegador, evitando erros de bloqueio anti-bot (Cloudflare e Erro 403).
- **Aba de Resumo Tradicional:** Resumo conciso e informativo do artigo.
- **Aba de Resumo para X / Twitter:** Tweet otimizado com contador de caracteres (limite de 280).
- **Copiar com 1 Clique:** Botões dedicados para copiar o resumo ou tweet formatados.
- **Opção Manual:** Permite colar qualquer link manualmente caso queira resumir outra matéria.
