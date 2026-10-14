/**
 * Corretor IA - Groq
 * Content Script com Shadow DOM, Chamada Direta com Suporte a CORS e Fallback.
 */

(function () {
  const VERSION = '1.0.5';
  if (window.__GROQ_CORRETOR_VERSION__ === VERSION) return;
  window.__GROQ_CORRETOR_VERSION__ = VERSION;

  // Remove interfaces de versões antigas (scripts órfãos continuam vivos na aba após recarregar a extensão)
  document.querySelectorAll('#groq-corretor-root').forEach((el) => el.remove());

  const DEFAULT_MODEL = 'qwen/qwen3.8-27b';
  const DEFAULT_API_KEY = '';
  const DIRECT_TIMEOUT_MS = 8000;
  const BACKGROUND_TIMEOUT_MS = 8000;
  const WATCHDOG_MS = 18000;

  let currentSelectionContext = null;
  let isModalOpen = false;
  let lastMousePos = null;
  let selectionChangeTimeout = null;
  let activeRequestId = 0;

  // Criação do contêiner Shadow DOM isolado
  const hostElement = document.createElement('div');
  hostElement.id = 'groq-corretor-root';
  hostElement.dataset.version = VERSION;
  hostElement.style.all = 'initial';
  hostElement.style.position = 'fixed';
  hostElement.style.top = '0';
  hostElement.style.left = '0';
  hostElement.style.width = '100vw';
  hostElement.style.height = '100vh';
  hostElement.style.pointerEvents = 'none';
  hostElement.style.zIndex = '2147483647';
  document.documentElement.appendChild(hostElement);

  const shadow = hostElement.attachShadow({ mode: 'open' });

  // Estilos da interface da extensão
  const style = document.createElement('style');
  style.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* Botão Flutuante (Pill) */
    .corretor-pill {
      position: fixed;
      pointer-events: auto;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 14px;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.25);
      box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.25);
      cursor: pointer;
      user-select: none;
      transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s;
      z-index: 2147483647;
      animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .corretor-pill:hover {
      background: linear-gradient(135deg, #312e81 0%, #4338ca 100%);
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 14px 28px -4px rgba(79, 70, 229, 0.5), 0 6px 10px -2px rgba(0, 0, 0, 0.3);
    }

    .corretor-pill:active {
      transform: translateY(0) scale(0.98);
    }

    .corretor-pill .icon-sparkle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #a7f3d0;
      font-size: 14px;
    }

    /* Modal Principal */
    .corretor-modal-overlay {
      position: fixed;
      pointer-events: auto;
      z-index: 2147483647;
      animation: fadeIn 0.2s ease-out;
    }

    .corretor-modal {
      width: 450px;
      max-width: calc(100vw - 32px);
      background: #1e293b;
      border-radius: 14px;
      border: 1px solid #334155;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.65), 0 1px 3px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
    }

    /* Cabeçalho */
    .modal-header {
      padding: 12px 16px;
      background: #0f172a;
      border-bottom: 1px solid #334155;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .modal-title {
      font-size: 14px;
      font-weight: 700;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .badge-groq {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #064e3b;
      color: #34d399;
      border: 1px solid #059669;
      padding: 2px 7px;
      border-radius: 9999px;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 16px;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }

    .btn-close:hover {
      background: #334155;
      color: #f8fafc;
    }

    /* Conteúdo do Modal */
    .modal-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 480px;
      overflow-y: auto;
    }

    .text-box-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .text-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
    }

    .text-content-box {
      font-size: 13.5px;
      line-height: 1.55;
      padding: 10px 12px;
      border-radius: 8px;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 140px;
      overflow-y: auto;
    }

    .box-original {
      background: #0f172a;
      color: #94a3b8;
      border: 1px solid #334155;
    }

    .box-corrected {
      background: #064e3b;
      color: #a7f3d0;
      border: 1px solid #059669;
      font-weight: 500;
    }

    .box-same {
      background: #0c4a6e;
      color: #bae6fd;
      border: 1px solid #0284c7;
    }

    /* Loading */
    .loading-state {
      padding: 28px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      text-align: center;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #334155;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .loading-text {
      font-size: 13.5px;
      font-weight: 600;
      color: #e2e8f0;
    }

    .loading-subtext {
      font-size: 11.5px;
      color: #94a3b8;
    }

    /* Erro */
    .error-box {
      background: #450a0a;
      border: 1px solid #991b1b;
      border-radius: 8px;
      padding: 12px;
      font-size: 12.5px;
      color: #fca5a5;
      line-height: 1.45;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    /* Rodapé e Botões */
    .modal-footer {
      padding: 12px 16px;
      background: #0f172a;
      border-top: 1px solid #334155;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      font-size: 12.5px;
      font-weight: 600;
      border-radius: 7px;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      user-select: none;
    }

    .btn-secondary {
      background: #334155;
      color: #e2e8f0;
      border: 1px solid #475569;
    }

    .btn-secondary:hover {
      background: #475569;
      color: #ffffff;
    }

    .btn-primary {
      background: #059669;
      color: #ffffff;
    }

    .btn-primary:hover {
      background: #047857;
      box-shadow: 0 4px 10px rgba(5, 150, 105, 0.4);
    }

    .btn-indigo {
      background: #4f46e5;
      color: #ffffff;
    }

    .btn-indigo:hover {
      background: #4338ca;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.4);
    }

    .btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .feedback-toast {
      font-size: 11.5px;
      color: #34d399;
      font-weight: 600;
      margin-right: auto;
      display: flex;
      align-items: center;
      gap: 4px;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes popIn {
      0% {
        opacity: 0;
        transform: scale(0.85) translateY(4px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    @keyframes fadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  shadow.appendChild(style);

  const pillContainer = document.createElement('div');
  const modalContainer = document.createElement('div');
  shadow.appendChild(pillContainer);
  shadow.appendChild(modalContainer);

  function getDeepActiveElement() {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) {
      el = el.shadowRoot.activeElement;
    }
    return el;
  }

  function getActiveSelection(mousePos, targetCandidate) {
    const activeEl = getDeepActiveElement();
    const target = targetCandidate || activeEl;

    // 1. INPUT ou TEXTAREA
    const isTextInput =
      target &&
      (target.tagName === 'TEXTAREA' ||
        (target.tagName === 'INPUT' &&
          !/^(button|submit|reset|checkbox|radio|file|image|range|color|hidden)$/i.test(target.type)));

    if (isTextInput) {
      try {
        const start = target.selectionStart;
        const end = target.selectionEnd;
        if (typeof start === 'number' && typeof end === 'number' && start !== end) {
          const selStart = Math.min(start, end);
          const selEnd = Math.max(start, end);
          const text = target.value.substring(selStart, selEnd);
          if (text && text.trim().length >= 2) {
            return {
              type: 'input',
              element: target,
              start: selStart,
              end: selEnd,
              text: text,
              isEditable: !target.readOnly && !target.disabled,
              rect: target.getBoundingClientRect(),
              mouseX: mousePos?.clientX,
              mouseY: mousePos?.clientY
            };
          }
        }
      } catch (err) {}
    }

    // 2. DOM / ContentEditable / Rich Text
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const text = selection.toString();
      if (text && text.trim().length >= 2) {
        const range = selection.getRangeAt(0);
        let rect = range.getBoundingClientRect();

        if (!rect || (rect.width === 0 && rect.height === 0)) {
          const rects = range.getClientRects();
          if (rects.length > 0) rect = rects[0];
        }

        let node = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
        const isEditable = Boolean(
          node && (node.isContentEditable || node.closest?.('[contenteditable="true"]'))
        );

        return {
          type: isEditable ? 'contenteditable' : 'dom',
          element: node,
          range: range.cloneRange(),
          text: text,
          isEditable: isEditable,
          rect: rect,
          mouseX: mousePos?.clientX,
          mouseY: mousePos?.clientY
        };
      }
    }

    return null;
  }

  function showPill(context) {
    if (isModalOpen) return;
    currentSelectionContext = context;

    const pillWidth = 145;
    const pillHeight = 36;

    let posX = 0;
    let posY = 0;

    if (typeof context.mouseX === 'number' && typeof context.mouseY === 'number') {
      posX = context.mouseX - pillWidth / 2;
      posY = context.mouseY - pillHeight - 12;

      if (posY < 10) {
        posY = context.mouseY + 16;
      }
    } else if (context.rect && (context.rect.width > 0 || context.rect.height > 0)) {
      posX = context.rect.left + context.rect.width / 2 - pillWidth / 2;
      posY = context.rect.top - pillHeight - 10;

      if (posY < 10) {
        posY = context.rect.bottom + 10;
      }
    } else {
      posX = window.innerWidth / 2 - pillWidth / 2;
      posY = 30;
    }

    const maxLeft = window.innerWidth - pillWidth - 12;
    const minLeft = 12;
    posX = Math.max(minLeft, Math.min(posX, maxLeft));

    const maxTop = window.innerHeight - pillHeight - 12;
    const minTop = 10;
    posY = Math.max(minTop, Math.min(posY, maxTop));

    pillContainer.innerHTML = `
      <div class="corretor-pill" style="top: ${posY}px; left: ${posX}px;">
        <span class="icon-sparkle">✨</span>
        <span>Corrigir texto</span>
      </div>
    `;

    const pillEl = pillContainer.querySelector('.corretor-pill');
    pillEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    pillEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hidePill();
      triggerCorrection(currentSelectionContext);
    });
  }

  function hidePill() {
    pillContainer.innerHTML = '';
  }

  function hideModal() {
    modalContainer.innerHTML = '';
    isModalOpen = false;
  }

  /**
   * Obtém as configurações com fallback automático
   */
  async function getStoredConfig() {
    return new Promise((resolve) => {
      try {
        if (chrome?.storage?.local) {
          chrome.storage.local.get(['groqApiKey', 'groqModel'], (data) => {
            const key = (data?.groqApiKey || DEFAULT_API_KEY).trim();
            const model = (data?.groqModel || DEFAULT_MODEL).trim();
            resolve({
              apiKey: key || DEFAULT_API_KEY,
              model: model || DEFAULT_MODEL
            });
          });
          return;
        }
      } catch (e) {}
      resolve({ apiKey: DEFAULT_API_KEY, model: DEFAULT_MODEL });
    });
  }

  /**
   * Chamada Direta à API Groq (Suporta CORS total e responde em ~40ms)
   */
  async function callGroqDirect(text, config) {
    const systemPrompt = `Você é um corretor ortográfico e gramatical especialista em língua portuguesa do Brasil.
Sua única e estrita tarefa é corrigir erros ortográficos, concordância nominal e verbal, regência, acentuação, pontuação e sintaxe do texto fornecido.
Diretrizes fundamentais:
1. Mantenha fielmente o sentido original, tom e estilo pretendidos pelo autor.
2. Preserve quebras de linha e estrutura geral de parágrafos.
3. Não invente conteúdo novo e não resuma o texto.
4. Não inclua saudações, comentários, justificativas, notas ou explicações do que foi corrigido.
5. Não envolva a resposta entre aspas duplas ou simples (a não ser que já fizessem parte do texto original).
6. Retorne EXCLUSIVAMENTE o texto final corrigido, nada mais.`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DIRECT_TIMEOUT_MS);

    // Limita max_tokens com base no texto enviado para evitar estourar o limite OTPM gratuito da Groq
    const estimatedTokens = Math.ceil((text.length / 3.5) + 60);
    const maxTokens = Math.max(80, Math.min(estimatedTokens * 2, 600));

    const body = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
      max_tokens: maxTokens
    };

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!res.ok) {
      let errMsg = `Erro HTTP ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson?.error?.message) {
          errMsg = errJson.error.message;
        }
      } catch (e) {}
      throw new Error(errMsg);
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || '';
    return raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() || text;
  }

  /**
   * Dispara a correção de forma resiliente
   */
  async function triggerCorrection(context) {
    if (!context || !context.text) return;
    isModalOpen = true;
    const requestId = ++activeRequestId;
    const startedAt = Date.now();
    const isCurrent = () => requestId === activeRequestId && isModalOpen;
    let finished = false;
    const errors = [];

    renderModalLoading(context);

    const tick = setInterval(() => {
      if (!isCurrent() || finished) return clearInterval(tick);
      const el = modalContainer.querySelector('#loading-elapsed');
      if (el) el.textContent = `${Math.round((Date.now() - startedAt) / 1000)}s`;
    }, 500);

    const finish = (fn) => {
      if (finished || !isCurrent()) return;
      finished = true;
      clearInterval(tick);
      clearTimeout(watchdog);
      fn();
    };

    const watchdog = setTimeout(() => {
      finish(() =>
        renderModalError(
          context,
          'A Groq não respondeu a tempo. ' +
            (errors.length ? 'Detalhes: ' + errors.join(' | ') : 'Possível bloqueio de rede/proxy para api.groq.com.')
        )
      );
    }, WATCHDOG_MS);

    try {
      setLoadingStage('Lendo configurações...');
      const config = await withTimeout(getStoredConfig(), 800, { apiKey: DEFAULT_API_KEY, model: DEFAULT_MODEL });
      if (finished || !isCurrent()) return;

      if (!config.apiKey) {
        return finish(() =>
          renderModalError(
            context,
            'Chave de API da Groq não configurada. Clique no ícone da extensão no topo do Chrome para inserir sua chave.'
          )
        );
      }

      // Tentativa 1: chamada direta à Groq
      setLoadingStage('Conectando à Groq (direto)...');
      try {
        const corrected = await callGroqDirect(context.text, config);
        console.info('[Corretor IA] Correção direta OK em', Date.now() - startedAt, 'ms');
        return finish(() => renderModalResult(context, corrected));
      } catch (directError) {
        errors.push('direto: ' + (directError.name === 'AbortError' ? 'timeout' : directError.message));
        console.warn('[Corretor IA] Chamada direta falhou:', directError);
      }
      if (finished || !isCurrent()) return;

      // Tentativa 2: via service worker da extensão
      setLoadingStage('Tentando via extensão...');
      const response = await sendToBackground({ action: 'CORRECT_TEXT', text: context.text }, BACKGROUND_TIMEOUT_MS);
      if (response && response.success) {
        return finish(() => renderModalResult(context, response.corrected));
      }
      errors.push('extensão: ' + (response?.error || 'sem resposta'));
      finish(() => renderModalError(context, errors.join(' | ')));
    } catch (err) {
      console.error('[Corretor IA] Erro geral:', err);
      errors.push(err.message || String(err));
      finish(() => renderModalError(context, errors.join(' | ')));
    }
  }

  function withTimeout(promise, ms, fallbackValue) {
    return Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(fallbackValue), ms))]);
  }

  function sendToBackground(message, ms) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve({ success: false, error: 'timeout do service worker' }), ms);
      try {
        if (!chrome?.runtime?.id) {
          clearTimeout(timer);
          return resolve({ success: false, error: 'extensão foi recarregada — atualize a página (F5)' });
        }
        chrome.runtime.sendMessage(message, (response) => {
          clearTimeout(timer);
          const lastErr = chrome.runtime.lastError;
          if (lastErr) return resolve({ success: false, error: lastErr.message });
          resolve(response);
        });
      } catch (e) {
        clearTimeout(timer);
        resolve({ success: false, error: e.message });
      }
    });
  }

  function setLoadingStage(text) {
    const el = modalContainer.querySelector('#loading-stage');
    if (el) el.textContent = text;
  }

  function calculateModalPosition(context) {
    const modalWidth = 450;
    const modalEstimatedHeight = 280;

    let posX = 0;
    let posY = 0;

    if (typeof context.mouseX === 'number' && typeof context.mouseY === 'number') {
      posX = context.mouseX - modalWidth / 2;
      posY = context.mouseY + 15;

      if (posY + modalEstimatedHeight > window.innerHeight) {
        posY = Math.max(10, context.mouseY - modalEstimatedHeight - 15);
      }
    } else if (context.rect && (context.rect.width > 0 || context.rect.height > 0)) {
      posX = context.rect.left + context.rect.width / 2 - modalWidth / 2;
      posY = context.rect.bottom + 12;

      if (posY + modalEstimatedHeight > window.innerHeight) {
        posY = Math.max(10, context.rect.top - modalEstimatedHeight - 12);
      }
    } else {
      posX = window.innerWidth / 2 - modalWidth / 2;
      posY = window.innerHeight / 2 - modalEstimatedHeight / 2;
    }

    const maxLeft = window.innerWidth - modalWidth - 16;
    const minLeft = 16;
    posX = Math.max(minLeft, Math.min(posX, maxLeft));

    return { top: posY, left: posX };
  }

  function renderModalLoading(context) {
    const { top, left } = calculateModalPosition(context);

    modalContainer.innerHTML = `
      <div class="corretor-modal-overlay" style="top: ${top}px; left: ${left}px;">
        <div class="corretor-modal">
          <div class="modal-header">
            <div class="modal-title-group">
              <span class="modal-title">✨ Corretor IA</span>
              <span class="badge-groq">Groq</span>
            </div>
            <button class="btn-close" title="Fechar">✕</button>
          </div>
          <div class="modal-body">
            <div class="loading-state">
              <div class="spinner"></div>
              <div class="loading-text">Analisando ortografia e gramática com Groq...</div>
              <div class="loading-subtext"><span id="loading-stage">Iniciando...</span> · <span id="loading-elapsed">0s</span> · v${VERSION}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    setupModalCloseEvents();
  }

  function renderModalResult(context, correctedText) {
    try {
      const { top, left } = calculateModalPosition(context);
      const originalText = String(context.text || '');
      const cleanCorrected = String(correctedText || originalText).trim();
      const isSame = originalText.trim() === cleanCorrected;
      const canReplace = Boolean(context.isEditable);

      modalContainer.innerHTML = `
        <div class="corretor-modal-overlay" style="top: ${top}px; left: ${left}px;">
          <div class="corretor-modal">
            <div class="modal-header">
              <div class="modal-title-group">
                <span class="modal-title">✨ Correção Concluída</span>
                <span class="badge-groq">Groq</span>
              </div>
              <button class="btn-close" title="Fechar">✕</button>
            </div>
            <div class="modal-body">
              ${
                isSame
                  ? `
                <div class="text-content-box box-same">
                  <strong>Excelente!</strong> O texto selecionado já está correto ortográfica e gramaticalmente.
                </div>
              `
                  : ''
              }

              <div class="text-box-group">
                <span class="text-label">Texto Original</span>
                <div class="text-content-box box-original">${escapeHtml(originalText)}</div>
              </div>

              <div class="text-box-group">
                <span class="text-label">Versão Corrigida</span>
                <div class="text-content-box box-corrected">${escapeHtml(cleanCorrected)}</div>
              </div>
            </div>
            <div class="modal-footer">
              <div id="modal-feedback" class="feedback-toast" style="display: none;"></div>
              <button class="btn btn-secondary" id="btn-copy">
                📋 Copiar
              </button>
              <button class="btn btn-primary" id="btn-replace" ${!canReplace ? 'title="Disponível apenas em campos editáveis"' : ''}>
                ✍️ Substituir
              </button>
            </div>
          </div>
        </div>
      `;

      setupModalCloseEvents();

      const btnCopy = modalContainer.querySelector('#btn-copy');
      btnCopy?.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(cleanCorrected);
          showFeedback('✓ Copiado para a área de transferência!');
          btnCopy.innerHTML = '✓ Copiado!';
          setTimeout(() => {
            btnCopy.innerHTML = '📋 Copiar';
          }, 2000);
        } catch (err) {
          fallbackCopyText(cleanCorrected);
          showFeedback('✓ Copiado!');
        }
      });

      const btnReplace = modalContainer.querySelector('#btn-replace');
      btnReplace?.addEventListener('click', (e) => {
        e.stopPropagation();
        const replaced = applyReplacement(context, cleanCorrected);
        if (replaced) {
          showFeedback('✓ Texto substituído!');
          btnReplace.innerHTML = '✓ Substituído!';
          setTimeout(() => {
            hideModal();
          }, 1200);
        } else {
          showFeedback('Apenas campos editáveis podem ser substituídos. Use Copiar!');
        }
      });
    } catch (e) {
      console.error('[Corretor IA] Erro ao renderizar resultado:', e);
      renderModalError(context, 'Erro ao exibir correção: ' + e.message);
    }
  }

  function renderModalError(context, errorMessage) {
    try {
      const { top, left } = calculateModalPosition(context);

      modalContainer.innerHTML = `
        <div class="corretor-modal-overlay" style="top: ${top}px; left: ${left}px;">
          <div class="corretor-modal">
            <div class="modal-header">
              <div class="modal-title-group">
                <span class="modal-title" style="color: #f87171;">⚠️ Erro na Correção</span>
              </div>
              <button class="btn-close" title="Fechar">✕</button>
            </div>
            <div class="modal-body">
              <div class="error-box">
                <strong>Não foi possível concluir a correção:</strong>
                <span>${escapeHtml(String(errorMessage || 'Erro inesperado'))}</span>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-close-footer">Fechar</button>
              <button class="btn btn-indigo" id="btn-retry">Tentar novamente</button>
            </div>
          </div>
        </div>
      `;

      setupModalCloseEvents();

      modalContainer.querySelector('#btn-retry')?.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerCorrection(context);
      });

      modalContainer.querySelector('.btn-close-footer')?.addEventListener('click', (e) => {
        e.stopPropagation();
        hideModal();
      });
    } catch (e) {
      console.error('[Corretor IA] Falha crítica ao renderizar erro:', e);
    }
  }

  function showFeedback(msg) {
    const el = modalContainer.querySelector('#modal-feedback');
    if (el) {
      el.textContent = msg;
      el.style.display = 'flex';
    }
  }

  function setupModalCloseEvents() {
    modalContainer.querySelectorAll('.btn-close').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideModal();
      });
    });

    const overlay = modalContainer.querySelector('.corretor-modal-overlay');
    overlay?.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
  }

  function applyReplacement(context, newText) {
    if (!context) return false;

    // 1. Input ou Textarea
    if (context.type === 'input' && context.element) {
      const el = context.element;
      el.focus();
      el.setSelectionRange(context.start, context.end);

      let success = false;
      try {
        success = document.execCommand('insertText', false, newText);
      } catch (e) {
        success = false;
      }

      if (!success) {
        const val = el.value;
        const before = val.substring(0, context.start);
        const after = val.substring(context.end);
        const updated = before + newText + after;

        const proto =
          el instanceof HTMLTextAreaElement
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

        if (nativeSetter) {
          nativeSetter.call(el, updated);
        } else {
          el.value = updated;
        }

        const newPos = context.start + newText.length;
        el.setSelectionRange(newPos, newPos);

        el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      }
      return true;
    }

    // 2. ContentEditable ou Seleção DOM
    if (context.range) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(context.range);

      let success = false;
      try {
        success = document.execCommand('insertText', false, newText);
      } catch (e) {
        success = false;
      }

      if (!success && context.isEditable) {
        try {
          context.range.deleteContents();
          const textNode = document.createTextNode(newText);
          context.range.insertNode(textNode);
          context.range.setStartAfter(textNode);
          context.range.setEndAfter(textNode);
          sel.removeAllRanges();
          sel.addRange(context.range);

          const editableParent = context.element?.isContentEditable
            ? context.element
            : context.element?.closest?.('[contenteditable="true"]');
          editableParent?.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
          success = true;
        } catch (err) {
          success = false;
        }
      }

      return success;
    }

    return false;
  }

  function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {}
    document.body.removeChild(textArea);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- OUVINTES DE EVENTOS (CAPTURE PHASE) ---

  function handleMouseUp(e) {
    if (e.target === hostElement || hostElement.contains(e.target)) return;

    lastMousePos = { clientX: e.clientX, clientY: e.clientY };

    setTimeout(() => {
      if (isModalOpen) return;
      const context = getActiveSelection(lastMousePos, e.target);
      if (context) {
        showPill(context);
      } else {
        hidePill();
      }
    }, 25);
  }

  window.addEventListener('mouseup', handleMouseUp, true);
  document.addEventListener('mouseup', handleMouseUp, true);

  document.addEventListener(
    'keyup',
    (e) => {
      if (isModalOpen) {
        if (e.key === 'Escape') hideModal();
        return;
      }

      if (e.key === 'Escape') {
        hidePill();
        return;
      }

      if (e.shiftKey || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA'].includes(e.code)) {
        setTimeout(() => {
          if (isModalOpen) return;
          const context = getActiveSelection(lastMousePos, e.target);
          if (context) {
            showPill(context);
          } else {
            hidePill();
          }
        }, 30);
      }
    },
    true
  );

  document.addEventListener('selectionchange', () => {
    if (isModalOpen) return;
    clearTimeout(selectionChangeTimeout);
    selectionChangeTimeout = setTimeout(() => {
      if (isModalOpen) return;
      const context = getActiveSelection(lastMousePos);
      if (context) {
        showPill(context);
      } else {
        hidePill();
      }
    }, 120);
  });

  document.addEventListener(
    'mousedown',
    (e) => {
      if (e.composedPath && e.composedPath().includes(hostElement)) {
        return;
      }
      hidePill();
      if (isModalOpen) {
        hideModal();
      }
    },
    true
  );

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'TRIGGER_CORRECTION_FROM_CONTEXT_MENU') {
      const context = getActiveSelection(lastMousePos);
      if (context) {
        triggerCorrection(context);
      } else if (request.selectedText) {
        const dummyContext = {
          type: 'dom',
          text: request.selectedText,
          isEditable: false,
          rect: {
            top: window.innerHeight / 3,
            bottom: window.innerHeight / 3 + 40,
            left: window.innerWidth / 2 - 100,
            width: 200,
            height: 40
          }
        };
        triggerCorrection(dummyContext);
      }
    }
  });
})();
