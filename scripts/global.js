/**
 * Injeta a estrutura de estilos CSS necessária para os Toasts dinâmicos
 */
(function injetarEstilosToast() {
  if (document.getElementById("estilos-toast-global")) return;

  const estilo = document.createElement("style");
  estilo.id = "estilos-toast-global";
  estilo.textContent = `
    .container-toasts {
      position: fixed;
      bottom: var(--espaco-6, 24px);
      right: var(--espaco-6, 24px);
      display: flex;
      flex-direction: column;
      gap: var(--espaco-2, 8px);
      z-index: 9999;
      pointer-events: none;
    }

    .toast-popup {
      pointer-events: auto;
      background-color: #ffffff;
      color: var(--texto-primario, #1f2937);
      padding: var(--espaco-3, 12px) var(--espaco-5, 20px);
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      gap: var(--espaco-3, 12px);
      font-family: var(--fonte-base, sans-serif);
      font-size: var(--tamanho-sm, 14px);
      font-weight: 500;
      min-width: 280px;
      max-width: 420px;
      animation: toastEntrada 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: all 0.3s ease;
      border-left: 4px solid #d1d5db;
      position: relative;
    }

    .toast-popup.sucesso {
      border-left-color: #10b981;
      background-color: #f0fdf4;
      color: #14532d;
    }

    .toast-popup.erro {
      border-left-color: #ef4444;
      background-color: #fef2f2;
      color: #7f1d1d;
    }

    .toast-popup.saida {
      animation: toastSaida 0.3s ease forwards;
    }

    @keyframes toastEntrada {
      from { opacity: 0; transform: translateY(20px) scale(0.9); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes toastSaida {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to { opacity: 0; transform: translateY(-10px) scale(0.95); }
    }
  `;
  document.head.appendChild(estilo);
})();

/**
 * Sobrescreve ou define a função mostrarMensagem com Timer Auto-Resetável por instância
 */
function mostrarMensagem(texto, tipo) {
  const elementoMensagemOriginal = document.getElementById("mensagem");
  if (elementoMensagemOriginal) {
    elementoMensagemOriginal.textContent = texto;
    elementoMensagemOriginal.className = "mensagem " + tipo;
  }

  let container = document.querySelector(".container-toasts");
  if (!container) {
    container = document.createElement("div");
    container.className = "container-toasts";
    document.body.appendChild(container);
  }

  const toastsExistentes = Array.from(container.children);
  const toastDuplicado = toastsExistentes.find(t => t.querySelector('.toast-texto')?.textContent === texto);

  if (toastDuplicado) {
    clearTimeout(Number(toastDuplicado.dataset.timeoutId));
    const novoTimeoutId = setTimeout(() => dispararSaidaToast(toastDuplicado, container), 5000);
    toastDuplicado.dataset.timeoutId = String(novoTimeoutId);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast-popup ${tipo || ""}`;
  
  const icone = tipo === "sucesso" 
    ? `<span style="color: #10b981; font-size: 16px;">✓</span>` 
    : tipo === "erro" 
      ? `<span style="color: #ef4444; font-size: 16px;">⚠️</span>` 
      : `<span style="color: #3b82f6; font-size: 16px;">ℹ️</span>`;

  toast.innerHTML = `${icone} <span class="toast-texto">${texto}</span>`;
  container.appendChild(toast);

  const timeoutId = setTimeout(() => dispararSaidaToast(toast, container), 5000);
  toast.dataset.timeoutId = String(timeoutId);

  toast.addEventListener("mouseenter", () => {
    clearTimeout(Number(toast.dataset.timeoutId));
  });
  
  toast.addEventListener("mouseleave", () => {
    const novoTimeoutId = setTimeout(() => dispararSaidaToast(toast, container), 5000);
    toast.dataset.timeoutId = String(novoTimeoutId);
  });
}

function dispararSaidaToast(elementoToast, containerAlvo) {
  if (!elementoToast) return;
  
  elementoToast.classList.add("saida");
  elementoToast.addEventListener("animationend", () => {
    elementoToast.remove();
    if (containerAlvo && containerAlvo.children.length === 0) {
      containerAlvo.remove();
    }
  });
}

/**
 * ============================================================================
 * LÓGICA DE INTERCONEXÃO DE CONTEXTO E REDIRECIONAMENTOS
 * ============================================================================
 */

function redirecionarParaNovoOrcamento(dadosContexto) {
  if (!dadosContexto) return;
  localStorage.setItem("contexto_novo_orcamento", JSON.stringify(dadosContexto));
  window.location.href = "orcamentos.html";
}

/**
 * Preenche a tela de orçamentos vindo de links externos com dados cruzados (Clientes/Produtos)
 */
function verificarEPreencherOrcamentoCompartilhado() {
  const dadosString = localStorage.getItem("contexto_novo_orcamento");
  if (!dadosString) return;

  setTimeout(() => {
    try {
      const dados = JSON.parse(dadosString);
      localStorage.removeItem("contexto_novo_orcamento");

      if (typeof prepararCriacao === "function") {
        prepararCriacao();
      } else {
        document.getElementById("btnCriarOrcamento")?.click();
      }

      // Preenchimento de Cliente
      const valorClienteId = dados.clienteId || dados.clienteid || dados.cliente;
      if (valorClienteId) {
        const campoCliente = document.getElementById("clienteId") || document.getElementById("clienteid") || document.getElementById("cliente") || document.getElementById("buscaCliente");
        if (campoCliente) {
          campoCliente.value = valorClienteId;
          campoCliente.dispatchEvent(new Event('change', { bubbles: true }));
          campoCliente.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      // Preenchimento de Produto
      const valorProdutoId = dados.produtoId || dados.produtoid || dados.produto;
      if (valorProdutoId) {
        const campoProduto = document.getElementById("produtoId") || document.getElementById("produtoid") || document.getElementById("produto") || document.getElementById("buscaProduto");
        if (campoProduto) {
          campoProduto.value = valorProdutoId;
          campoProduto.dispatchEvent(new Event('change', { bubbles: true }));
          campoProduto.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

    } catch (erro) {
      console.error("Erro ao preencher orçamento:", erro);
    }
  }, 400);
}

/**
 * ============================================================================
 * GERENCIADOR DE INTERAÇÃO AUTOMÁTICA DA SIDEBAR
 * ============================================================================
 */

/**
 * Identifica a URL atual e destaca o gerenciador correto, ignorando botões de criação rápida
 */
function marcarPaginaAtivaSidebar() {
  const urlPath = window.location.pathname;
  const paginaAtual = urlPath.substring(urlPath.lastIndexOf("/") + 1);
  const linksSidebar = document.querySelectorAll(".sidebar-nav .nav-item");

  linksSidebar.forEach(link => link.classList.remove("destaque"));

  linksSidebar.forEach(link => {
    const hrefAtributo = link.getAttribute("href");
    const label = link.getAttribute("data-label") || "";
    
    // CORREÇÃO: Evita duplicidade visual ignorando itens que começam com "Registrar"
    if (hrefAtributo === paginaAtual && !label.startsWith("Registrar")) {
      link.classList.add("destaque");
    }
  });
}

// Inicializador Único do Ciclo de Vida da Página
document.addEventListener("DOMContentLoaded", function() {
  // 1. Marca visualmente qual página está ativa
  marcarPaginaAtivaSidebar();

  // 2. Mapeia cliques nos botões de atalho rápido "Registrar" da Sidebar
  const btnRegistrarOrcamento = document.querySelector('.sidebar-nav a[data-label="Registrar Orçamento"]');
  btnRegistrarOrcamento?.addEventListener("click", function() {
    localStorage.setItem("acao_automatica_sidebar", "criar_orcamento");
  });

  const btnRegistrarCliente = document.querySelector('.sidebar-nav a[data-label="Registrar Cliente"]');
  btnRegistrarCliente?.addEventListener("click", function() {
    localStorage.setItem("acao_automatica_sidebar", "criar_cliente");
  });

  // 3. Captura o estado da URL e checa ações pendentes
  const urlPath = window.location.pathname;
  const paginaAtual = urlPath.substring(urlPath.lastIndexOf("/") + 1);
  const acaoPendente = localStorage.getItem("acao_automatica_sidebar");

  // 4. Resolve os gatilhos automáticos de criação com tempo seguro de renderização (500ms)
  if (acaoPendente) {
    if (acaoPendente === "criar_orcamento" && paginaAtual === "orcamentos.html") {
      localStorage.removeItem("acao_automatica_sidebar");
      setTimeout(() => {
        if (typeof prepararCriacao === "function") {
          prepararCriacao();
          console.log("Sucesso: Drawer de orçamento aberto automaticamente.");
        } else {
          document.getElementById("btnCriarOrcamento")?.click();
        }
      }, 500);
    } 
    else if (acaoPendente === "criar_cliente" && paginaAtual === "clientes.html") {
      localStorage.removeItem("acao_automatica_sidebar");
      setTimeout(() => {
        if (typeof prepararCriacao === "function") {
          prepararCriacao();
          console.log("Sucesso: Drawer de cliente aberto automaticamente.");
        } else {
          document.getElementById("btnCriarCliente")?.click();
        }
      }, 500);
    }
  }

  // 5. Se estiver na tela de orçamentos, verifica se há dados enviados via fluxo de Clientes/Produtos
  if (paginaAtual === "orcamentos.html") {
    verificarEPreencherOrcamentoCompartilhado();
  }
});