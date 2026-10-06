# ✍️ Corretor IA (Groq) - Extensão para Google Chrome

Extensão moderna, simples e ultrarrápida para o Google Chrome / Chromium que permite corrigir textos selecionados em qualquer página da web utilizando a API de alta performance do **Groq**.

---

## ✨ Funcionalidades

- **Detecção Inteligente de Seleção:** Ao selecionar qualquer trecho de texto em páginas da web, um botão flutuante com a opção **✨ Corrigir texto** aparece suavemente perto da seleção.
- **Correção Ortográfica e Gramatical:** Utiliza modelos de IA via Groq (como `qwen/qwen3.8-27b`) com prompt especializado em português do Brasil, garantindo correção de concordância, regência, acentuação e pontuação mantendo o tom e intenção original.
- **Substituição Direta no Texto Original:** Em campos de formulário (`<input>`, `<textarea>`) e editores ricos (`contenteditable` como Gmail, Notion, WhatsApp Web e Slack), basta 1 clique em **✍️ Substituir** para que o texto original seja trocado instantaneamente, preservando o histórico de Desfazer (`Ctrl+Z`).
- **Copiar com 1 Clique:** Botão **📋 Copiar** dedicado para transferir a versão corrigida para a área de transferência.
- **Design Isolado com Shadow DOM:** Todo o botão flutuante e o modal são renderizados em um Shadow DOM próprio. Nenhum CSS de nenhuma página interfere no layout da extensão e nenhum estilo da extensão afeta o site em que você está navegando.
- **Área de Teste Integrada (Playground):** No ícone da extensão, há uma aba para você digitar e testar frases imediatamente sem sair da tela.
- **Configuração Simples:** Permite alterar a chave de API do Groq e escolher entre diferentes modelos da Groq (`qwen/qwen3.8-27b`, `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, etc.).

---

## 🚀 Como Instalar no Google Chrome

1. Abra o **Google Chrome** (ou Edge / Brave).
2. Na barra de endereços, acerte o caminho:
   ```text
   chrome://extensions
   ```
   e pressione **Enter**.
3. No canto superior direito da página, **ative o botão "Modo do desenvolvedor"** (*Developer mode*).
4. No canto superior esquerdo, clique no botão **"Carregar sem compactação"** (*Load unpacked*).
5. Selecione a pasta da extensão:
   ```text
   c:\Users\willyan.costa\Documents\Will\resumer\corretor-extension
   ```
6. Pronto! A extensão **Corretor IA - Groq** estará ativa e pronta para uso.  
   *(Recomendado: Clique no ícone de "quebra-cabeça" na barra superior do navegador e fixe a extensão para acesso rápido).*

---

## 🧪 Como Testar

Para testar todas as funcionalidades imediatamente, criamos uma página de laboratório:

1. Abra o arquivo `test-page.html` no seu navegador Chrome dando dois cliques ou abrindo:
   ```text
   file:///c:/Users/willyan.costa/Documents/Will/resumer/corretor-extension/test-page.html
   ```
2. Selecione qualquer um dos textos de teste:
   - Texto estático de leitura.
   - Campo `<input>` com erros ortográficos.
   - Campo `<textarea>` multilinha.
   - Caixa editável `contenteditable`.
3. Veja o botão flutuante **✨ Corrigir texto** surgir.
4. Clique para corrigir e experimente os botões **✍️ Substituir** e **📋 Copiar**.

---

## ⚙️ Configurações da API Groq

Por padrão, a extensão já vem pré-configurada com a sua chave da Groq e o modelo `qwen/qwen3.8-27b`. Caso queira atualizar:

1. Clique no ícone da extensão no canto superior direito do navegador.
2. Acesse a aba **Configurações**.
3. Insira sua chave obtida no [Console da Groq](https://console.groq.com/keys).
4. Escolha o modelo desejado e clique em **Salvar Configurações**.

---

## 📁 Estrutura de Arquivos

```text
corretor-extension/
├── manifest.json         # Manifesto Manifest V3 da extensão
├── background.js         # Service Worker que gerencia a comunicação com a API Groq
├── content.js            # Script injetado que gerencia seleção de texto, Shadow DOM e substituição
├── popup.html            # Interface de configuração e playground rápido
├── popup.css             # Estilos do popup
├── popup.js              # Lógica do popup
├── test-page.html        # Página HTML para testar todas as situações em tempo real
├── generate-icons.ps1    # Script PowerShell para geração dos ícones da extensão
├── icons/                # Ícones da extensão (16x16, 48x48, 128x128)
└── README.md             # Esta documentação
```
