// Background Service Worker - Corretor IA (Groq)
const DEFAULT_MODEL = 'qwen/qwen3.8-27b';
const DEFAULT_API_KEY = '';

// Inicialização segura
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.storage.local.get(['groqApiKey', 'groqModel'], (result) => {
      const toSave = {};
      if (result?.groqApiKey === undefined) toSave.groqApiKey = DEFAULT_API_KEY;
      if (!result?.groqModel) toSave.groqModel = DEFAULT_MODEL;
      if (Object.keys(toSave).length > 0) {
        chrome.storage.local.set(toSave);
      }
    });

    // Remove menus anteriores para evitar erro de ID duplicado e recria
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'corretor-groq-selection',
        title: '✨ Corrigir com IA (Groq)',
        contexts: ['selection']
      });
    });
  } catch (err) {
    console.warn('[Corretor IA] Erro no onInstalled:', err);
  }
});

// Clique no menu de contexto
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'corretor-groq-selection' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'TRIGGER_CORRECTION_FROM_CONTEXT_MENU',
      selectedText: info.selectionText
    }).catch((err) => {
      console.warn('[Corretor IA] Falha ao enviar mensagem para a aba:', err);
    });
  }
});

// Listener central de mensagens (com resposta assíncrona garantida)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CORRECT_TEXT') {
    handleCorrection(request.text)
      .then((data) => {
        sendResponse(data);
      })
      .catch((err) => {
        console.error('[Corretor IA] Erro em handleCorrection:', err);
        sendResponse({ success: false, error: err.message || 'Erro desconhecido ao processar correção.' });
      });
    return true; // Mantém a porta de comunicação aberta
  }

  if (request.action === 'GET_CONFIG') {
    getConfig().then((config) => sendResponse(config));
    return true;
  }

  if (request.action === 'SAVE_CONFIG') {
    const dataToSave = {
      groqApiKey: (request.apiKey || '').trim(),
      groqModel: (request.model || DEFAULT_MODEL).trim()
    };
    chrome.storage.local.set(dataToSave, () => {
      // Salva no sync também se disponível
      if (chrome.storage.sync) {
        chrome.storage.sync.set(dataToSave, () => {});
      }
      sendResponse({ success: true });
    });
    return true;
  }
});

/**
 * Recupera configurações de forma ultra-segura com timeout de 300ms
 */
function getConfig() {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ apiKey: DEFAULT_API_KEY, model: DEFAULT_MODEL });
    }, 300);

    try {
      chrome.storage.local.get(['groqApiKey', 'groqModel'], (data) => {
        clearTimeout(timer);
        const apiKey = (data?.groqApiKey || DEFAULT_API_KEY).trim();
        let model = (data?.groqModel || DEFAULT_MODEL).trim();

        // Se o modelo configurado for inválido ou antigo (ex: llama-3.3 que não está liberado nesta chave)
        if (!model || model.includes('llama-3.3') || model.includes('llama-3.1')) {
          model = DEFAULT_MODEL;
        }

        resolve({ apiKey: apiKey || DEFAULT_API_KEY, model: model || DEFAULT_MODEL });
      });
    } catch (e) {
      clearTimeout(timer);
      resolve({ apiKey: DEFAULT_API_KEY, model: DEFAULT_MODEL });
    }
  });
}

/**
 * Chamada à API Groq com timeout de 10s e tratamento de erros
 */
async function handleCorrection(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { success: false, error: 'Nenhum texto informado para correção.' };
  }

  const config = await getConfig();

  const systemPrompt = `Você é um corretor ortográfico e gramatical especialista em língua portuguesa do Brasil.
Sua única e estrita tarefa é corrigir erros ortográficos, concordância nominal e verbal, regência, acentuação, pontuação e sintaxe do texto fornecido.
Diretrizes fundamentais:
1. Mantenha fielmente o sentido original, tom e estilo pretendidos pelo autor.
2. Preserve quebras de linha e estrutura geral de parágrafos.
3. Não invente conteúdo novo e não resuma o texto.
4. Não inclua saudações, comentários, justificativas, notas ou explicações do que foi corrigido.
5. Não envolva a resposta entre aspas duplas ou simples (a não ser que já fizessem parte do texto original).
6. Retorne EXCLUSIVAMENTE o texto final corrigido, nada mais.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.1
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errMsg = `Erro ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) {
          errMsg = errJson.error.message;
        }
      } catch (e) {}
      return { success: false, error: errMsg };
    }

    const data = await response.json();
    const corrected = data?.choices?.[0]?.message?.content ?? '';

    return {
      success: true,
      original: text,
      corrected: corrected.trim(),
      model: config.model
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Tempo de resposta da API Groq esgotado (10s). Verifique sua conexão.'
      };
    }
    return {
      success: false,
      error: 'Falha ao conectar com o serviço Groq: ' + error.message
    };
  }
}
