import { supabaseClient } from "./supabase-config.js";

  /*
    ============================================
    ELEMENTOS DO HTML
    ============================================
  */

  const formOrcamento       = document.getElementById("formOrcamento");
  const tabelaOrcamentos    = document.getElementById("tabelaOrcamentos");
  const mensagem            = document.getElementById("mensagem");

  const orcamentoIdInput    = document.getElementById("orcamentoId");
  const clienteIdInput      = document.getElementById("clienteId");
  const dataOrcamentoInput  = document.getElementById("dataOrcamento");
  const dataValidadeInput   = document.getElementById("dataValidade");
  const totalOrcamentoEl    = document.getElementById("totalOrcamento");

  const itemProdutoIdInput  = document.getElementById("itemProdutoId");
  const itemDescricaoInput  = document.getElementById("itemDescricao");
  const itemQuantidadeInput = document.getElementById("itemQuantidade");
  const itemValorUnitInput  = document.getElementById("itemValorUnitario");

  const tbodyItens          = document.getElementById("tbodyItens");
  const btnAdicionarItem    = document.getElementById("btnAdicionarItem");
  const btnSalvar           = document.getElementById("btnSalvar");
  const btnCancelarEdicao   = document.getElementById("btnCancelarEdicao");
  const btnCriarOrcamento   = document.getElementById("btnCriarOrcamento");
  // FIX: botão reset (limpar) do formulário
  const btnLimpar           = document.getElementById("btnLimpar") || formOrcamento?.querySelector('[type="reset"]');

  const campoBusca          = document.getElementById("campoBusca");

  let listaProdutos   = [];
  let itensOrcamento  = [];

  let orcamentoSelecionado = null;
  let listaOrcamentos = [];
  // variável de controle do modo atual do drawer
  let modoAtual = null; // "criar" | "visualizar" | "editar" | "excluir"
  
// Garante que o código espera o HTML ser totalmente renderizado pelo navegador
document.addEventListener("DOMContentLoaded", async function () {
  
  // 1. Se você tiver funções que carregam dados do banco (como a lista de clientes para um <select>), execute-as primeiro:
  // await carregarClientesSelect(); 
  // await carregarListagemOrcamentos();

  // 2. AGORA SIM, com a tela pronta, chama a função global:
  if (typeof verificarEPreencherOrcamentoCompartilhado === "function") {
    verificarEPreencherOrcamentoCompartilhado();
  }
});


  /*
    ============================================
    INTERAÇÕES COM DRAWER
    ============================================
  */

  function abrirDrawer() {
    document.getElementById('drawer').classList.add('open');
    document.getElementById('overlay').classList.add('active');
    document.body.classList.add("sem-rolagem");
  }
  function fecharDrawer() {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
    document.body.classList.remove("sem-rolagem");
  }

  document.getElementById('overlay').addEventListener('click', fecharDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharDrawer(); });


  /*
    ============================================
    FUNÇÃO PARA MOSTRAR MENSAGEM NA TELA
    ============================================
  */

  function mostrarMensagem(texto, tipo) {
    if (mensagem) {
      mensagem.textContent = texto;
      mensagem.className = "mensagem " + tipo;
    }
  }

  /*
    ============================================
    FUNÇÃO PARA FORMATAR VALOR
    ============================================
  */

  function formatarValor(valor) {
    return "R$ " + Number(valor).toFixed(2).replace(".", ",");
  }

  /*
    ============================================
    FUNÇÃO PARA FORMATAR DATA
    ============================================
  */

  function formatarData(dataIso) {
    if (!dataIso) return "";
    const partes = dataIso.split("T")[0].split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
  }

  /*
    ============================================
    FUNÇÃO PARA FILTRAR ORÇAMENTOS ATIVOS
    ============================================
  */

  function estaAtivo(dtValidade) {
    if (!dtValidade) return false;
    return new Date(dtValidade) >= new Date();
  }

  /*
    ============================================
    SELECIONAR UM ORÇAMENTO NA TABELA
    ============================================
  */

  function selecionarOrcamento(orcamento, linha) {
    tabelaOrcamentos.querySelectorAll("tr").forEach(function(tr) {
      tr.classList.remove("linha-selecionada");
    });

    if (orcamentoSelecionado && orcamentoSelecionado.orcamentoid === orcamento.orcamentoid) {
      orcamentoSelecionado = null;
      atualizarPainelAcoes();
      return;
    }

    orcamentoSelecionado = orcamento;
    linha.classList.add("linha-selecionada");
    atualizarPainelAcoes();
  }

  /*
    ============================================
    ATUALIZAR PAINEL DE AÇÕES
    ============================================
  */

  function atualizarPainelAcoes() {
    const temSelecao = orcamentoSelecionado !== null;

    const btnVisualizarGlobal = document.getElementById("btnVisualizar");
    const btnEditarGlobal     = document.getElementById("btnEditar");
    const btnExcluirGlobal    = document.getElementById("btnExcluir");
    const btnImprimirGlobal   = document.getElementById("btnImprimir");
    const painelHint          = document.getElementById("painelHint");

    if (btnVisualizarGlobal) btnVisualizarGlobal.disabled = !temSelecao;
    if (btnEditarGlobal)     btnEditarGlobal.disabled     = !temSelecao;
    if (btnExcluirGlobal)    btnExcluirGlobal.disabled    = !temSelecao;
    if (btnImprimirGlobal)   btnImprimirGlobal.disabled   = !temSelecao;
    if (painelHint)          painelHint.style.display     = temSelecao ? "none" : "";

    const badgeStatus = document.getElementById("badgeStatus");
    const infoCodigo  = document.getElementById("infoCodigo");
    const infoValor   = document.getElementById("infoValor");
    const infoCliente = document.getElementById("infoCliente");
    const infoEmissao = document.getElementById("infoEmissao");
    const infoValidade= document.getElementById("infoValidade");

    if (temSelecao) {
      if (badgeStatus)  badgeStatus.textContent  = "Selecionado";
      if (infoCodigo)   infoCodigo.textContent   = orcamentoSelecionado.orcamentoid;
      if (infoValor)    infoValor.textContent     = formatarValor(orcamentoSelecionado.vl_total_orcamento);
      if (infoCliente)  infoCliente.textContent   = orcamentoSelecionado.cliente ? orcamentoSelecionado.cliente.nome_cliente : "—";
      if (infoEmissao)  infoEmissao.textContent   = formatarData(orcamentoSelecionado.dt_orcamento);
      if (infoValidade) infoValidade.textContent  = formatarData(orcamentoSelecionado.dt_validade_orcamento);
    } else {
      if (badgeStatus)  badgeStatus.textContent  = "Nenhum";
      if (infoCodigo)   infoCodigo.textContent   = "—";
      if (infoValor)    infoValor.textContent     = "—";
      if (infoCliente)  infoCliente.textContent   = "—";
      if (infoEmissao)  infoEmissao.textContent   = "—";
      if (infoValidade) infoValidade.textContent  = "—";
    }
  }

  /*
    ============================================
    CARREGAR CLIENTES
    ============================================
  */

  async function carregarClientes() {
    const { data, error } = await supabaseClient
      .from("cliente")
      .select("clienteid, nome_cliente")
      .order("nome_cliente", { ascending: true });

    if (error) {
      mostrarMensagem("Erro ao carregar clientes: " + error.message, "erro");
      return;
    }

    clienteIdInput.innerHTML = '<option value="">Selecione um cliente</option>';

    data.forEach(function(cliente) {
      const option = document.createElement("option");
      option.value = cliente.clienteid;
      option.textContent = cliente.nome_cliente;
      clienteIdInput.appendChild(option);
    });
  }

  /*
    ============================================
    CARREGAR PRODUTOS
    ============================================
  */

  async function carregarProdutos() {
    const { data, error } = await supabaseClient
      .from("produto")
      // inclui obs_produto no select
      .select("produtoid, ds_produto, obs_produto, vl_venda_produto")
      .eq("status_produto", true) // Filtra apenas produtos onde o booleano é verdadeiro
      .order("ds_produto", { ascending: true });

    if (error) {
      mostrarMensagem("Erro ao buscar produtos: " + error.message, "erro");
      return;
    }

    listaProdutos = data;

    itemProdutoIdInput.innerHTML = '<option value="">Selecione um produto</option>';

    data.forEach(function(produto) {
      const option = document.createElement("option");
      option.value = produto.produtoid;
      option.textContent = produto.ds_produto;
      itemProdutoIdInput.appendChild(option);
    });
  }

  /*
    ============================================
    PREENCHER DESCRIÇÃO E PREÇO AO SELECIONAR PRODUTO
    ============================================
  */

  if (itemProdutoIdInput) {
    itemProdutoIdInput.addEventListener("change", function() {
      const produtoId = parseInt(itemProdutoIdInput.value);
      const produto   = listaProdutos.find(function(p) { return p.produtoid === produtoId; });

      if (produto) {
        // FIX: descrição recebe obs_produto (observação), não ds_produto (que já é o nome)
        if (itemDescricaoInput)  itemDescricaoInput.value  = produto.obs_produto      || "";
        if (itemValorUnitInput)  itemValorUnitInput.value  = produto.vl_venda_produto || "";
        if (itemQuantidadeInput) itemQuantidadeInput.value = 1;
      } else {
        if (itemDescricaoInput)  itemDescricaoInput.value  = "";
        if (itemValorUnitInput)  itemValorUnitInput.value  = "";
        if (itemQuantidadeInput) itemQuantidadeInput.value = "";
      }
    });
  }

  /*
    ============================================
    ADICIONAR ITEM À LISTA
    ============================================
  */

  if (btnAdicionarItem) {
    btnAdicionarItem.addEventListener("click", function() {
      const produtoId  = itemProdutoIdInput   ? parseInt(itemProdutoIdInput.value)   : null;
      const descricao  = itemDescricaoInput   ? itemDescricaoInput.value.trim()       : "";
      const quantity   = itemQuantidadeInput  ? parseInt(itemQuantidadeInput.value)   : 0;
      const valorUnit  = itemValorUnitInput   ? parseFloat(itemValorUnitInput.value)  : 0;

      if (!produtoId) {
        mostrarMensagem("Selecione um produto.", "erro");
        return;
      }

      if (!quantity || quantity <= 0) {
        mostrarMensagem("Informe uma quantidade válida.", "erro");
        return;
      }

      if (!valorUnit || valorUnit <= 0) {
        mostrarMensagem("Informe um valor unitário válido.", "erro");
        return;
      }

      const produto = listaProdutos.find(function(p) { return p.produtoid === produtoId; });

      itensOrcamento.push({
        produto_id:     produtoId,
        nome_produto:   produto ? produto.ds_produto : "",
        descricao_item: descricao,
        quantidade:     quantity,
        valor_unitario: valorUnit,
        valor_total:    quantity * valorUnit
      });

      if (itemProdutoIdInput)  itemProdutoIdInput.value  = "";
      if (itemDescricaoInput)  itemDescricaoInput.value  = "";
      if (itemQuantidadeInput) itemQuantidadeInput.value = "";
      if (itemValorUnitInput)  itemValorUnitInput.value  = "";

      renderizarItens();
    });
  }

  /*
    ============================================
    RECALCULAR TOTAL DO ORÇAMENTO
    ============================================
  */

  function recalcularTotal() {
    const total = itensOrcamento.reduce(function(soma, item) {
      return soma + item.valor_total;
    }, 0);

    if (totalOrcamentoEl) totalOrcamentoEl.textContent = formatarValor(total);
  }

  /*
    ============================================
    RENDERIZAR TABELA PRINCIPAL
    ============================================
  */

  function renderizarTabela(lista) {
    if (!tabelaOrcamentos) return;
    tabelaOrcamentos.innerHTML = "";

    if (lista.length === 0) {
      tabelaOrcamentos.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;">Nenhum orçamento encontrado.</td>
        </tr>
      `;
      return;
    }

    lista.forEach(function(orcamento) {
      const linha = document.createElement("tr");
      const ativo = estaAtivo(orcamento.dt_validade_orcamento);
      const nomeCliente = orcamento.cliente ? orcamento.cliente.nome_cliente : "—";

      linha.innerHTML = `
        <td style="color:var(--texto-terciario);font-size:var(--tamanho-xs);">${orcamento.orcamentoid}</td>
        <td style="font-weight:500;color:var(--texto-primario);">${nomeCliente}</td>
        <td>${formatarData(orcamento.dt_orcamento)}</td>
        <td>${formatarData(orcamento.dt_validade_orcamento)}</td>
        <td style="font-weight:600;">${formatarValor(orcamento.vl_total_orcamento)}</td>
        <td>
          <span class="badge ${ativo ? "status-ativo" : "status-expirado"}">
            ${ativo ? "Ativo" : "Expirado"}
          </span>
        </td>
      `;

      linha.addEventListener("click", function() {
        selecionarOrcamento(orcamento, linha);
      });

       // FIX: restaura seleção visual se este orçamento ainda está selecionado
      if (orcamentoSelecionado && orcamentoSelecionado.orcamentoid === orcamento.orcamentoid) {
        linha.classList.add("linha-selecionada");
        // FIX: atualiza dados do painel com os dados frescos vindos do banco
        orcamentoSelecionado = orcamento;
      }

      tabelaOrcamentos.appendChild(linha);
    });
  }

  /*
    ============================================
    RENDERIZAR TABELA DE ITENS
    ============================================
  */

  // parâmetro "somenteLeitura" controla se botão Remover é exibido ou não
  function renderizarItens(somenteLeitura) {
    if (!tbodyItens) return;
    tbodyItens.innerHTML = "";

    if (itensOrcamento.length === 0) {
      tbodyItens.innerHTML = `
        <tr id="linhaVaziaItens">
          <td colspan="6" class="linha-vazia">Nenhum item adicionado.</td>
        </tr>
      `;
      recalcularTotal();
      return;
    }

    itensOrcamento.forEach(function(item, indice) {
      const linha = document.createElement("tr");

      linha.innerHTML = `
        <td>${item.nome_produto}</td>
        <td>${item.descricao_item}</td>
        <td>${item.quantidade}</td>
        <td>${formatarValor(item.valor_unitario)}</td>
        <td>${formatarValor(item.valor_total)}</td>
        <td class="coluna-acoes"></td>
      `;

      // só adiciona botão Remover se não for somente leitura
      if (!somenteLeitura) {
        const botaoRemover = document.createElement("button");
        botaoRemover.textContent = "Remover";
        botaoRemover.className = "btn btn-excluir";
        botaoRemover.type = "button";

        botaoRemover.addEventListener("click", function() {
          itensOrcamento.splice(indice, 1);
          renderizarItens();
        });

        linha.querySelector(".coluna-acoes").appendChild(botaoRemover);
      }

      tbodyItens.appendChild(linha);
    });

    recalcularTotal();
  }

  /*
    ============================================
    CARREGAR ITENS DO ORÇAMENTO DO BANCO
    ============================================
  */

  // centraliza o select de itens com ds_produto e obs_produto em um único lugar
  async function carregarItensOrcamento(orcamentoId) {
    const { data: itens, error } = await supabaseClient
      .from("orcamento_item")
      .select("produtoid, produtodesc, qt_produto, vl_unitario, vl_total, produto(ds_produto, obs_produto)")
      .eq("orcamentoid", orcamentoId);

    if (error) {
      mostrarMensagem("Erro ao carregar itens: " + error.message, "erro");
      return null;
    }

    return itens.map(function(item) {
      return {
        produto_id:     item.produtoid,
        // nome vem de ds_produto, descrição vem de obs_produto
        nome_produto:   item.produto ? item.produto.ds_produto  : "",
        descricao_item: item.produto ? item.produto.obs_produto : item.produtodesc,
        quantidade:     item.qt_produto,
        valor_unitario: item.vl_unitario,
        valor_total:    item.vl_total
      };
    });
  }

  /*
    ============================================
    CARREGAR ORÇAMENTOS DO SUPABASE
    ============================================
  */

  async function carregarOrcamentos() {
    const { data, error } = await supabaseClient
      .from("orcamento")
      .select("orcamentoid, clienteid, dt_orcamento, dt_validade_orcamento, vl_total_orcamento, cliente(nome_cliente)")
      .order("orcamentoid", { ascending: true });

    if (!tabelaOrcamentos) return;

    if (error) {
      tabelaOrcamentos.innerHTML = `<tr><td colspan="6">Erro ao carregar orçamentos.</td></tr>`;
      mostrarMensagem("Erro ao buscar orçamentos: " + error.message, "erro");
      return;
    }

    listaOrcamentos = data || [];
    renderizarTabela(listaOrcamentos);
  }

  /*
    ============================================
    PREPARAR CRIAÇÃO
    ============================================
  */

async function prepararCriacao() {
    modoAtual = "criar"; // define modo
    abrirDrawer();

    const containerItens = document.getElementById("itensOrcamento");
    if (containerItens) containerItens.style.display = "";

    if (formOrcamento) formOrcamento.reset();
    itensOrcamento = [];

    if (orcamentoIdInput) {
      orcamentoIdInput.value    = "";
      orcamentoIdInput.disabled = true;
    }

    if (clienteIdInput) {
      clienteIdInput.value    = "";
      clienteIdInput.disabled = false;
    }

    const hoje = new Date();
    if (dataOrcamentoInput) {
      dataOrcamentoInput.disabled = false;
      dataOrcamentoInput.value = hoje.toISOString().split("T")[0];
    }

    if (dataValidadeInput) {
      dataValidadeInput.disabled = false;
      const dataValidade = new Date();
      dataValidade.setDate(hoje.getDate() + 30);
      dataValidadeInput.value = dataValidade.toISOString().split("T")[0];
    }

    renderizarItens(false);

    if (btnSalvar) {
      btnSalvar.textContent = "Salvar";
      btnSalvar.className   = "btn btn-primario";
    }
    // exibe botão limpar em criação/edição
    if (btnLimpar) btnLimpar.style.display = "inline-block";
    if (btnCancelarEdicao) btnCancelarEdicao.style.display = "inline-block";

  }

  /*
    ============================================
    PREPARAR VISUALIZAÇÃO
    ============================================
  */

  async function prepararVisualizacao(orcamento) {
    modoAtual = "visualizar";
    abrirDrawer();

    const containerItens = document.getElementById("itensOrcamento");
    if (containerItens) containerItens.style.display = "none";

    if (orcamentoIdInput) {
      orcamentoIdInput.value    = orcamento.orcamentoid;
      orcamentoIdInput.disabled = true; // Desabilita campos
    }
    if (clienteIdInput) {
      clienteIdInput.value    = orcamento.clienteid;
      clienteIdInput.disabled = true;
    }
    if (dataOrcamentoInput) {
      dataOrcamentoInput.value    = orcamento.dt_orcamento ? orcamento.dt_orcamento.split("T")[0] : "";
      dataOrcamentoInput.disabled = true;
    }
    if (dataValidadeInput) {
      dataValidadeInput.value    = orcamento.dt_validade_orcamento ? orcamento.dt_validade_orcamento.split("T")[0] : "";
      dataValidadeInput.disabled = true;
    }

    // Usa helper centralizado com ds_produto + obs_produto
    const itens = await carregarItensOrcamento(orcamento.orcamentoid);
    if (itens === null) return;
    itensOrcamento = itens;

    // true = sem botão Remover
    renderizarItens(true);

    if (btnSalvar) {
      btnSalvar.textContent = "Imprimir";
      btnSalvar.className   = "btn btn-primario btn-imprimir-acao";
    }

    // oculta botão limpar na visualização
    if (btnLimpar) btnLimpar.style.display = "none";
    
    // Altera o texto e exibe o botão Cancelar
    if (btnCancelarEdicao) {
      btnCancelarEdicao.textContent = "Cancelar";
      btnCancelarEdicao.style.display = "inline-block";
    }
  }

  /*
    ============================================
    PREPARAR EDIÇÃO
    ============================================
  */

  async function prepararEdicao(orcamento) {
    modoAtual = "editar"; // FIX: define modo
    abrirDrawer();

    const containerItens = document.getElementById("itensOrcamento");
    if (containerItens) containerItens.style.display = "";

    if (orcamentoIdInput) {
      orcamentoIdInput.value    = orcamento.orcamentoid;
      orcamentoIdInput.disabled = true;
    }
    if (clienteIdInput) {
      clienteIdInput.value    = orcamento.clienteid;
      clienteIdInput.disabled = true;
    }
    if (dataOrcamentoInput) {
      dataOrcamentoInput.value    = orcamento.dt_orcamento ? orcamento.dt_orcamento.split("T")[0] : "";
      dataOrcamentoInput.disabled = false;
    }
    if (dataValidadeInput) {
      dataValidadeInput.value    = orcamento.dt_validade_orcamento ? orcamento.dt_validade_orcamento.split("T")[0] : "";
      dataValidadeInput.disabled = false;
    }

    //  usa helper centralizado com ds_produto + obs_produto
    const itens = await carregarItensOrcamento(orcamento.orcamentoid);
    if (itens === null) return;
    itensOrcamento = itens;

    renderizarItens(false);

    if (btnSalvar) {
      btnSalvar.textContent = "Atualizar";
      btnSalvar.className   = "btn btn-primario";
    }
    
    // oculta botão limpar na visualização
    if (btnLimpar) btnLimpar.style.display = "none";
    if (btnCancelarEdicao) btnCancelarEdicao.style.display = "inline-block";

  }

  /*
    ============================================
    PREPARAR EXCLUSÃO
    ============================================
  */

  async function prepararExclusao(orcamento) {
    modoAtual = "excluir"; // define modo
    abrirDrawer();

    const containerItens = document.getElementById("itensOrcamento");
    if (containerItens) containerItens.style.display = "none";

    if (orcamentoIdInput) {
      orcamentoIdInput.value    = orcamento.orcamentoid;
      orcamentoIdInput.disabled = true;
    }
    if (clienteIdInput) {
      clienteIdInput.value    = orcamento.clienteid;
      clienteIdInput.disabled = true;
    }
    if (dataOrcamentoInput) {
      dataOrcamentoInput.value    = orcamento.dt_orcamento ? orcamento.dt_orcamento.split("T")[0] : "";
      dataOrcamentoInput.disabled = true;
    }
    if (dataValidadeInput) {
      dataValidadeInput.value    = orcamento.dt_validade_orcamento ? orcamento.dt_validade_orcamento.split("T")[0] : "";
      dataValidadeInput.disabled = true;
    }

    // usa helper centralizado com ds_produto + obs_produto
    const itens = await carregarItensOrcamento(orcamento.orcamentoid);
    if (itens === null) return;
    itensOrcamento = itens;

    // true = sem botão Remover
    renderizarItens(true);

    if (btnSalvar) {
      btnSalvar.textContent = "Confirmar e Excluir";
      btnSalvar.className   = "btn btnConfirmarExcluir";
    }
    // oculta botão limpar na exclusão
    if (btnLimpar) btnLimpar.style.display = "none";
    if (btnCancelarEdicao) btnCancelarEdicao.style.display = "inline-block";

    mostrarMensagem("Atenção: Confirme a exclusão permanente deste orçamento.", "erro");
  }

  /*
    ============================================
    EXECUTAR EXCLUSÃO EFETIVA NO BANCO (Implementar lista de inativados)
    ============================================
  */

  async function executarExclusao(orcamentoId) {
    const { error: erroItens } = await supabaseClient
      .from("orcamento_item")
      .delete()
      .eq("orcamentoid", orcamentoId);

    if (erroItens) {
      mostrarMensagem("Erro ao excluir itens: " + erroItens.message, "erro");
      return;
    }

    const { error } = await supabaseClient
      .from("orcamento")
      .delete()
      .eq("orcamentoid", orcamentoId);

    if (error) {
      mostrarMensagem("Erro ao excluir orçamento: " + error.message, "erro");
      return;
    }

    mostrarMensagem("Orçamento excluído com sucesso!", "sucesso");
    cancelarEdicao();
    carregarOrcamentos();
  }

  /*
    ============================================
    FUNÇÃO IMPRIMIR ORÇAMENTO
    ============================================
  */

  function imprimirOrcamento(orcamento) {
    if (!orcamento) return;

    const janelaImpressao = window.open("", "_blank");

    let linhasItensHtml = "";
    itensOrcamento.forEach(function(item) {
      linhasItensHtml += `
        <tr>
          <td>${item.nome_produto}</td>
          <td>${item.descricao_item}</td>
          <td>${item.quantidade}</td>
          <td>${formatarValor(item.valor_unitario)}</td>
          <td>${formatarValor(item.valor_total)}</td>
        </tr>`;
    });

    // Formata html com dados para impressão
    janelaImpressao.document.write(`
      <html>
      <head>
        <title>Orçamento Nº ${orcamento.orcamentoid}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { text-align: right; font-weight: bold; margin-top: 20px; font-size: 1.2em; }
          .header-info { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h2>Orçamento Nº ${orcamento.orcamentoid}</h2>
        <div class="header-info">
          <p><strong>Cliente ID:</strong> ${orcamento.clienteid}</p>
          <p><strong>Data de Emissão:</strong> ${formatarData(orcamento.dt_orcamento)}</p>
          <p><strong>Válido Até:</strong> ${formatarData(orcamento.dt_validade_orcamento)}</p>
        </div>

        <h3>Itens do Orçamento</h3>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Descrição</th>
              <th>Qtd</th>
              <th>Vl. Unitário</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${linhasItensHtml}
          </tbody>
        </table>

        <div class="total">Total Geral: ${formatarValor(orcamento.vl_total_orcamento)}</div>

        <script>
          window.onload = function() { window.print(); window.close(); }
        <\/script>
      </body>
      </html>
    `);
    janelaImpressao.document.close();
  }

  /*
    ============================================
    CANCELAR EDIÇÃO - RETORNA AO PADRÃO DO DRAWER
    ============================================
  */

  function cancelarEdicao() {
    modoAtual = null; // limpa modo
    if (formOrcamento)      formOrcamento.reset();
    if (orcamentoIdInput)   orcamentoIdInput.value      = "";
    if (clienteIdInput)     clienteIdInput.disabled     = false;
    if (dataOrcamentoInput) dataOrcamentoInput.disabled = false;
    if (dataValidadeInput)  dataValidadeInput.disabled  = false;

    const containerItens = document.getElementById("itensOrcamento");
    if (containerItens) containerItens.style.display = "";

    itensOrcamento = [];
    renderizarItens(false);

    if (btnSalvar) {
      btnSalvar.textContent = "Salvar";
      btnSalvar.className   = "btn btn-primario";
    }
    // restaura visibilidade do botão limpar ao fechar
    if (btnLimpar)          btnLimpar.style.display         = "inline-block";
    if (btnCancelarEdicao)  btnCancelarEdicao.style.display = "none";

    if (mensagem) {
      mensagem.textContent = "";
      mensagem.className   = "mensagem";
    }

    orcamentoSelecionado = null;
    fecharDrawer();
    atualizarPainelAcoes();
  }

  /*
    ============================================
    SALVAR ORÇAMENTO
    ============================================
  */

  async function salvarOrcamento() {
    if (!clienteIdInput.value) {
      mostrarMensagem("Selecione um cliente.", "erro");
      return;
    }

    if (!dataOrcamentoInput.value || !dataValidadeInput.value) {
      mostrarMensagem("Informe as datas do orçamento.", "erro");
      return;
    }

    if (itensOrcamento.length === 0) {
      mostrarMensagem("Adicione pelo menos um item ao orçamento.", "erro");
      return;
    }

    const valorTotal = itensOrcamento.reduce(function(soma, item) {
      return soma + item.valor_total;
    }, 0);

    const novoOrcamento = {
      clienteid:             parseInt(clienteIdInput.value),
      dt_orcamento:          new Date(dataOrcamentoInput.value).toISOString(),
      dt_validade_orcamento: new Date(dataValidadeInput.value).toISOString(),
      vl_total_orcamento:    valorTotal
    };

    const { data: orcamentoSalvo, error: erroOrcamento } = await supabaseClient
      .from("orcamento")
      .insert(novoOrcamento)
      .select("orcamentoid")
      .single();

    if (erroOrcamento) {
      mostrarMensagem("Erro ao salvar orçamento: " + erroOrcamento.message, "erro");
      return;
    }

    const itensParaSalvar = itensOrcamento.map(function(item, indice) {
      return {
        orcamentoid:     orcamentoSalvo.orcamentoid,
        orcamentoitemid: indice + 1,
        produtoid:       item.produto_id,
        produtodesc:     item.descricao_item,
        qt_produto:      item.quantidade,
        vl_unitario:     item.valor_unitario,
        vl_total:        item.valor_total
      };
    });

    const { error: erroItens } = await supabaseClient
      .from("orcamento_item")
      .insert(itensParaSalvar);

    if (erroItens) {
      mostrarMensagem("Orçamento salvo, mas erro nos itens: " + erroItens.message, "erro");
      return;
    }

    mostrarMensagem("Orçamento salvo com sucesso!", "sucesso");
    itensOrcamento = [];
    if (formOrcamento) formOrcamento.reset();
    renderizarItens(false);
    fecharDrawer();
    carregarOrcamentos();
    
  }

  /*
    ============================================
    ATUALIZAR ORÇAMENTO
    ============================================
  */

  async function atualizarOrcamento() {
    const orcamentoId = parseInt(orcamentoIdInput.value);

    if (!dataOrcamentoInput.value || !dataValidadeInput.value) {
      mostrarMensagem("Informe as datas do orçamento.", "erro");
      return;
    }

    if (itensOrcamento.length === 0) {
      mostrarMensagem("Adicione pelo menos um item ao orçamento.", "erro");
      return;
    }

    const valorTotal = itensOrcamento.reduce(function(soma, item) {
      return soma + item.valor_total;
    }, 0);

    const { error: erroUpdate } = await supabaseClient
      .from("orcamento")
      .update({
        dt_orcamento:          new Date(dataOrcamentoInput.value).toISOString(),
        dt_validade_orcamento: new Date(dataValidadeInput.value).toISOString(),
        vl_total_orcamento:    valorTotal
      })
      .eq("orcamentoid", orcamentoId);

    if (erroUpdate) {
      mostrarMensagem("Erro ao atualizar orçamento: " + erroUpdate.message, "erro");
      return;
    }

    // Remove itens antigos e reinsere os atuais
    const { error: erroDeleteItens } = await supabaseClient
      .from("orcamento_item")
      .delete()
      .eq("orcamentoid", orcamentoId);

    if (erroDeleteItens) {
      mostrarMensagem("Erro ao remover itens antigos: " + erroDeleteItens.message, "erro");
      return;
    }

    const itensParaSalvar = itensOrcamento.map(function(item, indice) {
      return {
        orcamentoid:     orcamentoId,
        orcamentoitemid: indice + 1,
        produtoid:       item.produto_id,
        produtodesc:     item.descricao_item,
        qt_produto:      item.quantidade,
        vl_unitario:     item.valor_unitario,
        vl_total:        item.valor_total
      };
    });

    const { error: erroItens } = await supabaseClient
      .from("orcamento_item")
      .insert(itensParaSalvar);

    if (erroItens) {
      mostrarMensagem("Orçamento atualizado, mas erro nos itens: " + erroItens.message, "erro");
      return;
    }

    mostrarMensagem("Orçamento atualizado com sucesso!", "sucesso");
    itensOrcamento = [];
    renderizarItens(false);
    fecharDrawer();
    carregarOrcamentos();
  }


  /*
    ============================================
    EVENTOS E INICIALIZAÇÃO
    ============================================
  */

  if (formOrcamento) {
    formOrcamento.addEventListener("submit", async function(evento) {
      evento.preventDefault();

      // FIX: roteador baseado em modoAtual (confiável), não em className do botão
      if (modoAtual === "excluir") {
        const idParaDeletar = parseInt(orcamentoIdInput.value);
        await executarExclusao(idParaDeletar);
        return;
      }

      if (modoAtual === "visualizar") {
        imprimirOrcamento(orcamentoSelecionado);
        return;
      }

      if (modoAtual === "editar") {
        await atualizarOrcamento();
        return;
      }

      if (modoAtual === "criar") {
        await salvarOrcamento();
        return;
      }
    });

    formOrcamento.addEventListener("reset", function() {
      setTimeout(function() {
        itensOrcamento = [];
        renderizarItens(false);
        if (clienteIdInput) clienteIdInput.disabled = false;
      }, 0);
    });
  }

  if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener("click", function() {
      cancelarEdicao();
    });
  }

  if (btnCriarOrcamento) {
    btnCriarOrcamento.addEventListener("click", function() {
      prepararCriacao();
    });
  }

  /*
    ============================================
    FILTRO DE PESQUISA LOCAL
    ============================================
  */

  if (campoBusca) {
    campoBusca.addEventListener("input", function() {
      const termo = campoBusca.value.toLowerCase().trim();

      if (!termo) {
        renderizarTabela(listaOrcamentos);
        return;
      }

      const filtrado = listaOrcamentos.filter(function(orcamento) {
        const codigo  = String(orcamento.orcamentoid).toLowerCase();
        const cliente = orcamento.cliente ? orcamento.cliente.nome_cliente.toLowerCase() : "";
        return codigo.includes(termo) || cliente.includes(termo);
      });

      orcamentoSelecionado = null;
      atualizarPainelAcoes();
      renderizarTabela(filtrado);
    });
  }

  /*
    ============================================
    BOTÕES DE AÇÃO (VISUALIZAR, EDITAR, EXCLUIR, IMPRIMIR)
    ============================================
  */

  addEventListener("click", function(event) {
    const target = event.target;

    if (target.disabled || target.closest('button')?.disabled) {
      return;
    }

    if (target.matches(".btnVisualizar, #btnVisualizar")) {
      if (orcamentoSelecionado) prepararVisualizacao(orcamentoSelecionado);
    }

    if (target.matches(".btnEditar, #btnEditar")) {
      if (orcamentoSelecionado) prepararEdicao(orcamentoSelecionado);
    }

    if (target.matches(".btnExcluir, #btnExcluir")) {
      if (orcamentoSelecionado) prepararExclusao(orcamentoSelecionado);
    }

    if (target.matches(".btnImprimir, #btnImprimir")) {
      if (orcamentoSelecionado) imprimirOrcamento(orcamentoSelecionado);
    }

    if (target.matches(".btnConfirmarExcluir, #btnConfirmarExcluir")) {
      if (orcamentoSelecionado) executarExclusao(orcamentoSelecionado.orcamentoid);
    }
  });

  // Executa na inicialização da página de orçamentos
(function verificarGatilhoSidebarOrcamento() {
  const acao = localStorage.getItem("acao_automatica_sidebar");
  
  if (acao === "criar_orcamento") {

    // Remove imediatamente o sinal para não abrir o drawer em loops ao atualizar com F5
    localStorage.removeItem("acao_automatica_sidebar");
    
    // Aguarda um pequeno instante para garantir que o HTML e o Supabase carreguem antes
    setTimeout(() => {
      if (typeof prepararCriacao === "function") {
        prepararCriacao();
        console.log("Drawer de novo orçamento aberto automaticamente via atalho lateral.");
      }
    }, 300);
  }
})();

  carregarClientes();
  carregarProdutos();
  carregarOrcamentos();