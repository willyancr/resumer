// popup.js - Lógica da Interface da Extensão

document.addEventListener('DOMContentLoaded', () => {
  // Elementos das abas
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Elementos de Configuração
  const configForm = document.getElementById('config-form');
  const apiKeyInput = document.getElementById('api-key');
  const modelSelect = document.getElementById('model-select');
  const btnToggleKey = document.getElementById('btn-toggle-key');
  const configStatus = document.getElementById('config-status');

  // Elementos de Teste
  const testInput = document.getElementById('test-input');
  const btnRunTest = document.getElementById('btn-run-test');
  const testResultContainer = document.getElementById('test-result-container');
  const testOutput = document.getElementById('test-output');
  const btnCopyTest = document.getElementById('btn-copy-test');

  // Alternar abas
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      btn.classList.add('active');
      const targetTab = document.getElementById(btn.getAttribute('data-tab'));
      targetTab?.classList.add('active');
    });
  });

  // Mostrar / Ocultar Chave de API
  btnToggleKey?.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      btnToggleKey.textContent = '🔒';
    } else {
      apiKeyInput.type = 'password';
      btnToggleKey.textContent = '👁️';
    }
  });

  // Carregar configurações salvas
  chrome.runtime.sendMessage({ action: 'GET_CONFIG' }, (response) => {
    if (response) {
      if (response.apiKey) {
        apiKeyInput.value = response.apiKey;
      }
      if (response.model) {
        modelSelect.value = response.model;
      }
    }
  });

  // Salvar configurações
  configForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value.trim();

    chrome.runtime.sendMessage({ action: 'SAVE_CONFIG', apiKey, model }, (response) => {
      if (response && response.success) {
        showStatus('Configurações salvas com sucesso!', 'success');
      } else {
        showStatus('Erro ao salvar configurações.', 'error');
      }
    });
  });

  function showStatus(msg, type) {
    if (!configStatus) return;
    configStatus.textContent = msg;
    configStatus.className = `toast-status ${type}`;
    setTimeout(() => {
      configStatus.className = 'toast-status';
    }, 3000);
  }

  // Executar teste rápido de correção
  btnRunTest?.addEventListener('click', () => {
    const text = testInput.value.trim();
    if (!text) {
      alert('Digite ou cole um texto para testar.');
      return;
    }

    btnRunTest.disabled = true;
    btnRunTest.querySelector('.btn-text').textContent = 'Corrigindo com Groq...';
    testResultContainer.style.display = 'none';

    chrome.runtime.sendMessage({ action: 'CORRECT_TEXT', text }, (response) => {
      btnRunTest.disabled = false;
      btnRunTest.querySelector('.btn-text').textContent = 'Corrigir Texto Agora';

      if (response && response.success) {
        testOutput.textContent = response.corrected;
        testResultContainer.style.display = 'block';
      } else {
        alert('Erro ao corrigir texto: ' + (response?.error || 'Erro desconhecido'));
      }
    });
  });

  // Copiar resultado do teste
  btnCopyTest?.addEventListener('click', async () => {
    const text = testOutput.textContent;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      btnCopyTest.textContent = '✓ Copiado!';
      setTimeout(() => {
        btnCopyTest.textContent = '📋 Copiar';
      }, 2000);
    } catch (err) {
      // Fallback
      testInput.select();
      document.execCommand('copy');
      btnCopyTest.textContent = '✓ Copiado!';
    }
  });
});
