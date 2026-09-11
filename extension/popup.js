// Constantes e Configurações Padrão
const DEFAULT_API_URL = "http://localhost:3000/api/fetch-url-content";

// Elementos do DOM
const btnToggleSettings = document.getElementById("btn-toggle-settings");
const settingsPanel = document.getElementById("settings-panel");
const inputApiUrl = document.getElementById("input-api-url");
const btnSaveSettings = document.getElementById("btn-save-settings");

const sectionPrompt = document.getElementById("section-prompt");
const targetPageTitle = document.getElementById("target-page-title");
const targetPageUrl = document.getElementById("target-page-url");
const btnSummarizeCurrent = document.getElementById("btn-summarize-current");

const inputManualUrl = document.getElementById("input-manual-url");
const btnSummarizeManual = document.getElementById("btn-summarize-manual");

const sectionLoading = document.getElementById("section-loading");
const sectionError = document.getElementById("section-error");
const errorMessageEl = document.getElementById("error-message");
const btnRetry = document.getElementById("btn-retry");

const sectionResults = document.getElementById("section-results");
const resultTitle = document.getElementById("result-title");
const resultExcerpt = document.getElementById("result-excerpt");
const resultSummaryText = document.getElementById("result-summary-text");
const resultTwitterText = document.getElementById("result-twitter-text");
const twitterCharCount = document.getElementById("twitter-char-count");

const tabBtnSummary = document.getElementById("tab-btn-summary");
const tabBtnTwitter = document.getElementById("tab-btn-twitter");
const tabContentSummary = document.getElementById("tab-content-summary");
const tabContentTwitter = document.getElementById("tab-content-twitter");

const btnCopySummary = document.getElementById("btn-copy-summary");
const btnCopyTwitter = document.getElementById("btn-copy-twitter");
const btnReset = document.getElementById("btn-reset");

// Estado
let currentActiveTab = null;
let lastRequestPayload = null;
let currentArticleData = null;

// Inicialização
document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  setupEventListeners();
  await detectActiveTab();
});

// Gerenciamento de Configurações
async function getStoredApiUrl() {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
    const data = await chrome.storage.sync.get(["apiUrl"]);
    return data.apiUrl || DEFAULT_API_URL;
  }
  return localStorage.getItem("resumer_api_url") || DEFAULT_API_URL;
}

async function setStoredApiUrl(url) {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
    await chrome.storage.sync.set({ apiUrl: url });
  } else {
    localStorage.setItem("resumer_api_url", url);
  }
}

async function loadSettings() {
  const url = await getStoredApiUrl();
  inputApiUrl.value = url;
}

// Detecção da Aba Ativa
async function detectActiveTab() {
  try {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        currentActiveTab = tab;
        targetPageTitle.textContent = tab.title || "Sem título";
        targetPageUrl.textContent = tab.url || "";
        
        // Desativa se for página interna do Chrome
        if (tab.url && (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:"))) {
          btnSummarizeCurrent.disabled = true;
          btnSummarizeCurrent.textContent = "Página interna do navegador";
          btnSummarizeCurrent.style.opacity = "0.5";
          btnSummarizeCurrent.style.cursor = "not-allowed";
        }
        return;
      }
    }
  } catch (err) {
    console.warn("Não foi possível acessar a aba ativa:", err);
  }

  targetPageTitle.textContent = "Nenhuma aba detectada";
  targetPageUrl.textContent = "Insira uma URL manualmente abaixo.";
  btnSummarizeCurrent.disabled = true;
}

// Extração de conteúdo do DOM da aba ativa
async function extractContentFromActiveTab(tabId) {
  try {
    if (typeof chrome !== "undefined" && chrome.scripting && chrome.scripting.executeScript) {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          try {
            // Tenta encontrar o elemento principal do artigo
            const target =
              document.querySelector("article") ||
              document.querySelector("main") ||
              document.querySelector(".article-body, .post-content, .entry-content") ||
              document.body;

            if (!target) return null;

            // Clona para remover sujeiras sem alterar a página visual do usuário
            const clone = target.cloneNode(true);
            const unwanted = clone.querySelectorAll(
              "script, style, iframe, nav, footer, header, noscript, svg, [aria-hidden='true'], .advertisement, .ad, .banner, .social-share, .comments"
            );
            unwanted.forEach((el) => el.remove());

            const pageTitle = document.title || "";
            const pageText = (clone.innerText || clone.textContent || "")
              .replace(/\s+/g, " ")
              .trim();

            return {
              title: pageTitle,
              text: pageText.slice(0, 15000), // Envia até 15 mil caracteres
            };
          } catch (e) {
            return null;
          }
        },
      });

      if (results && results[0] && results[0].result && results[0].result.text && results[0].result.text.length > 80) {
        return results[0].result;
      }
    }
  } catch (err) {
    console.warn("Extração direta via scripting não permitida ou falhou:", err);
  }
  return null;
}

// Requisição para a API
async function summarize(payload) {
  lastRequestPayload = payload;
  showState("loading");

  try {
    const apiUrl = await getStoredApiUrl();
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = data?.error || `Falha na requisição (Status HTTP: ${response.status}).`;
      showError(msg);
      return;
    }

    if (!data || !data.summary) {
      showError("A IA não retornou um resumo válido para esta página.");
      return;
    }

    currentArticleData = data;
    renderResults(data);
    showState("results");

  } catch (err) {
    console.error("Erro na requisição da API:", err);
    showError(
      "Não foi possível conectar ao servidor do Resumer. Certifique-se de que o backend está rodando (ex: http://localhost:3000) ou ajuste a URL nas configurações."
    );
  }
}

// Renderização dos Resultados
function renderResults(data) {
  resultTitle.textContent = data.title || "Resumo da Matéria";
  resultExcerpt.textContent = data.excerpt || "";
  resultSummaryText.textContent = data.summary || "Sem resumo disponível.";
  
  const tweet = data.summaryTwitter || "Sem resumo para Twitter.";
  resultTwitterText.textContent = tweet;
  twitterCharCount.textContent = `${tweet.length}/280 caracteres`;

  // Volta para a aba principal
  switchTab("summary");
}

// Gerenciamento de Telas
function showState(state) {
  sectionPrompt.classList.add("hidden");
  sectionLoading.classList.add("hidden");
  sectionError.classList.add("hidden");
  sectionResults.classList.add("hidden");

  if (state === "prompt") sectionPrompt.classList.remove("hidden");
  if (state === "loading") sectionLoading.classList.remove("hidden");
  if (state === "error") sectionError.classList.remove("hidden");
  if (state === "results") sectionResults.classList.remove("hidden");
}

function showError(message) {
  errorMessageEl.textContent = message;
  showState("error");
}

// Troca de Abas
function switchTab(tab) {
  if (tab === "summary") {
    tabBtnSummary.classList.add("active");
    tabBtnTwitter.classList.remove("active");
    tabContentSummary.classList.remove("hidden");
    tabContentTwitter.classList.add("hidden");
  } else {
    tabBtnTwitter.classList.add("active");
    tabBtnSummary.classList.remove("active");
    tabContentTwitter.classList.remove("hidden");
    tabContentSummary.classList.add("hidden");
  }
}

// Cópia para Clipboard
async function copyText(text, buttonEl) {
  try {
    await navigator.clipboard.writeText(text);
    const label = buttonEl.querySelector(".btn-copy-text");
    const originalText = label.textContent;
    label.textContent = "✓ Copiado!";
    buttonEl.style.backgroundColor = "#10b981";

    setTimeout(() => {
      label.textContent = originalText;
      buttonEl.style.backgroundColor = "";
    }, 1500);
  } catch (err) {
    console.error("Erro ao copiar para clipboard:", err);
  }
}

// Event Listeners
function setupEventListeners() {
  // Toggle configurações
  btnToggleSettings.addEventListener("click", () => {
    settingsPanel.classList.toggle("hidden");
  });

  // Salvar configurações
  btnSaveSettings.addEventListener("click", async () => {
    const val = inputApiUrl.value.trim() || DEFAULT_API_URL;
    await setStoredApiUrl(val);
    btnSaveSettings.textContent = "Salvo!";
    setTimeout(() => {
      btnSaveSettings.textContent = "Salvar";
      settingsPanel.classList.add("hidden");
    }, 1000);
  });

  // Resumir página atual
  btnSummarizeCurrent.addEventListener("click", async () => {
    if (!currentActiveTab || !currentActiveTab.url) return;

    // Tenta extrair direto da página (evita bloqueios 403)
    const extracted = await extractContentFromActiveTab(currentActiveTab.id);

    if (extracted && extracted.text) {
      await summarize({
        url: currentActiveTab.url,
        title: extracted.title || currentActiveTab.title,
        text: extracted.text,
      });
    } else {
      // Fallback enviando a URL para o servidor buscar
      await summarize({ url: currentActiveTab.url });
    }
  });

  // Resumo manual
  btnSummarizeManual.addEventListener("click", async () => {
    const url = inputManualUrl.value.trim();
    if (!url) return;
    await summarize({ url });
  });

  // Tentar novamente
  btnRetry.addEventListener("click", async () => {
    if (lastRequestPayload) {
      await summarize(lastRequestPayload);
    } else {
      showState("prompt");
    }
  });

  // Abas
  tabBtnSummary.addEventListener("click", () => switchTab("summary"));
  tabBtnTwitter.addEventListener("click", () => switchTab("twitter"));

  // Copiar
  btnCopySummary.addEventListener("click", () => {
    if (!currentArticleData) return;
    const textToCopy = `${currentArticleData.title || ""}\n\n${currentArticleData.summary || ""}`;
    copyText(textToCopy, btnCopySummary);
  });

  btnCopyTwitter.addEventListener("click", () => {
    if (!currentArticleData) return;
    copyText(currentArticleData.summaryTwitter || "", btnCopyTwitter);
  });

  // Resetar
  btnReset.addEventListener("click", () => {
    showState("prompt");
  });
}
