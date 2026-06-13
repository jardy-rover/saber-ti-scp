import { supabaseClient } from "./supabase-config.js";

/*
  ============================================
  ELEMENTOS HTML
  ============================================
*/
const formProduto = document.getElementById("formProduto");
const tabelaProdutos = document.getElementById("tabelaProdutos");
const mensagem = document.getElementById("mensagem");
const campoBusca = document.getElementById("campoBusca");

const produtoIdInput = document.getElementById("produtoId");
const categoriaProdutoInput = document.getElementById("categoriaProduto");
const valorVendaProdutoInput = document.getElementById("valor_venda_produto");
const observacaoProdutoInput = document.getElementById("observacaoProduto");
const descricaoProdutoInput = document.getElementById("descricaoProduto");
const dataCadastroProdutoInput = document.getElementById("data_cadastro_produto");
const statusProdutoInput = document.getElementById("statusProduto");

const btnSalvar = document.getElementById("btnSalvar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
const btnCriarProduto = document.getElementById("btnCriarProduto");
const btnLimpar = document.getElementById("btnLimpar") || formProduto?.querySelector('[type="reset"]');

// Variáveis de Estado
let listaProdutos = [];
let produtoSelecionado = null;

// Variáveis de modo
let modoAtual = null; // "criar" | "visualizar" | "editar" | "excluir"

/*
  ============================================
  INTERAÇÕES COM O DRAWER
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

document.getElementById('overlay').addEventListener('click', cancelarEdicao);
document.addEventListener('keydown', e => { if (e.key === 'Escape') cancelarEdicao(); });

/*
  ============================================
  FUNÇÕES UTILITÁRIAS
  ============================================
*/
function mostrarMensagem(texto, tipo) {
  if (mensagem) {
    mensagem.textContent = texto;
    mensagem.className = "mensagem " + tipo;
  }
}

function formatarValor(valor) {
  return "R$ " + Number(valor).toFixed(2).replace(".", ",");
}

function formatarData(dataIso) {
  if (!dataIso) return "";
  const partes = dataIso.split("T")[0].split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

/*
  ============================================
  SELEÇÃO E PAINEL DE AÇÕES
  ============================================
*/
function selecionarProduto(produto, linha) {
  tabelaProdutos.querySelectorAll("tr").forEach(tr => tr.classList.remove("linha-selecionada"));

  if (produtoSelecionado && produtoSelecionado.produtoid === produto.produtoid) {
    produtoSelecionado = null;
    atualizarPainelAcoes();
    return;
  }

  produtoSelecionado = produto;
  linha.classList.add("linha-selecionada");
  atualizarPainelAcoes();
}

function atualizarPainelAcoes() {
  const temSelecao = produtoSelecionado !== null;

  const btnVisualizar = document.getElementById("btnVisualizar");
  const btnEditar = document.getElementById("btnEditar");
  const btnExcluir = document.getElementById("btnExcluir");
  const dadosProdutoSelecionado = document.getElementById("dadosProdutoSelecionado");

  if (btnVisualizar) btnVisualizar.disabled = !temSelecao;
  if (btnEditar) btnEditar.disabled = !temSelecao;
  if (btnExcluir) btnExcluir.disabled = !temSelecao;
  if (dadosProdutoSelecionado) dadosProdutoSelecionado.style.display = temSelecao ? "" : "none";

  const badgeStatus = document.getElementById("badgeStatus");
  const infoDescricaoProduto = document.getElementById("infoDescricaoProduto");
  const infoPrecoProduto = document.getElementById("infoPrecoProduto");

  if (temSelecao) {
    if (badgeStatus) badgeStatus.textContent = produtoSelecionado.status_produto ? "Ativo" : "Inativo";
    if (infoDescricaoProduto) infoDescricaoProduto.textContent = produtoSelecionado.ds_produto;
    if (infoPrecoProduto) infoPrecoProduto.textContent = formatarValor(produtoSelecionado.vl_venda_produto);
  } else {
    if (badgeStatus) badgeStatus.textContent = "Nenhum";
    if (infoDescricaoProduto) infoDescricaoProduto.textContent = "—";
    if (infoPrecoProduto) infoPrecoProduto.textContent = "—";
  }
}

/*
  ============================================
  CARGA DE DADOS DO BANCO
  ============================================
*/
async function carregarCategoriasProduto() {
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid, ds_categoria_produto")
    .order("ds_categoria_produto", { ascending: true });

  if (error) return console.error("Erro ao carregar categorias:", error);

  categoriaProdutoInput.innerHTML = '<option value="">Selecione uma categoria</option>';
  data.forEach(categoria => {
    const option = document.createElement("option");
    option.value = categoria.categoriaprodutoid;
    option.textContent = categoria.ds_categoria_produto;
    categoriaProdutoInput.appendChild(option);
  });
}

async function carregarProdutos() {
  const { data, error } = await supabaseClient
    .from("produto")
    .select("produtoid, categoriaprodutoid, ds_produto, obs_produto, vl_venda_produto, dt_cadastro_produto, status_produto, categoria_produto ( ds_categoria_produto )")
    // FIX: removido .eq("status_produto", true) — filtragem feita localmente por aplicarFiltros()
    .order("produtoid", { ascending: true });

  if (error) {
    tabelaProdutos.innerHTML = `<tr><td colspan="5">Erro ao carregar produtos.</td></tr>`;
    mostrarMensagem("Erro ao buscar produtos: " + error.message, "erro");
    return;
  }

  listaProdutos = data || [];
  aplicarFiltros(); // substituído renderizarTabela(listaProdutos)
}

/*
  ============================================
  RENDERIZAR E FILTRAR TABELA
  ============================================
*/
function renderizarTabela(lista) {
  if (!tabelaProdutos) return;
  tabelaProdutos.innerHTML = "";

  if (lista.length === 0) {
    tabelaProdutos.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum produto encontrado.</td></tr>`;
    return;
  }

  lista.forEach(produto => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${produto.produtoid}</td>
      <td>${produto.ds_produto}</td>
      <td>${produto.categoria_produto ? produto.categoria_produto.ds_categoria_produto : "—"}</td>
      <td>${formatarValor(produto.vl_venda_produto)}</td>
      <td><span class="badge ${produto.status_produto ? "status-ativo" : "status-expirado"}">${produto.status_produto ? "Ativo" : "Inativo"}</span></td>
    `;

    // restaura seleção visual após recarregar tabela
    if (produtoSelecionado && produtoSelecionado.produtoid === produto.produtoid) {
      row.classList.add("linha-selecionada");
      produtoSelecionado = produto;
    }

    row.addEventListener("click", () => selecionarProduto(produto, row));
    tabelaProdutos.appendChild(row);
  });
}

// Função centralizada para aplicar os filtros de busca E de status ao mesmo tempo
function aplicarFiltros() {
  const termo = campoBusca ? campoBusca.value.toLowerCase().trim() : "";
  const apenasInativos = switchVerExcluidos ? switchVerExcluidos.checked : false;

  const produtosFiltrados = listaProdutos.filter(p => {

    // Converte o status do banco para um True/False absoluto
    const isAtivo = (p.status_produto === true || p.status_produto === 1 || p.status_produto === "1");

    // Controle do filtro switch
    //const atendeStatus = apenasInativos ? !isAtivo : isAtivo; // Apenas inativos
    const atendeStatus = apenasInativos ? true : isAtivo; // Lista completa

    // Filtro do Campo de Busca
    const atendeBusca = p.ds_produto.toLowerCase().includes(termo) ||
                        (p.categoria_produto && p.categoria_produto.ds_categoria_produto.toLowerCase().includes(termo)) ||
                        p.produtoid.toString().includes(termo);

    return atendeStatus && atendeBusca;
  });

  renderizarTabela(produtosFiltrados);
}

if (campoBusca) {
  campoBusca.addEventListener("input", aplicarFiltros); // FIX: era renderizarTabela filtrada inline
}

// listener do switch, caso ainda não exista
if (switchVerExcluidos) {
  switchVerExcluidos.addEventListener("change", aplicarFiltros);
}

/*
  ============================================
  FLUXOS DO FORMULÁRIO (PREPARADORES)
  ============================================
*/
if (btnCriarProduto) {
  btnCriarProduto.addEventListener("click", prepararCriacao);
}

function prepararCriacao() {
  modoAtual = "criar"; // FIX
  abrirDrawer();
  if (formProduto) formProduto.reset();

  produtoIdInput.value = "";
  produtoIdInput.disabled = true;

  alterarEstadoCamposForm(false);
  dataCadastroProdutoInput.value = new Date().toISOString().split("T")[0];

  btnSalvar.textContent = "Salvar";
  btnSalvar.className = "btn btn-primario";
  btnSalvar.style.display = "inline-block";
  // exibe limpar na criação
  if (btnLimpar) btnLimpar.style.display = "inline-block";
  btnCancelarEdicao.style.display = "inline-block";
}

function prepararVisualizacao() {
  if (!produtoSelecionado) return;
  modoAtual = "visualizar"; // FIX
  abrirDrawer();
  preencherCamposForm(produtoSelecionado);
  alterarEstadoCamposForm(true);

  // Altera o texto e exibe o botão CancelarEdicao com segurança
  if (btnCancelarEdicao) {
    btnCancelarEdicao.textContent = "Cancelar";
    btnCancelarEdicao.style.display = "inline-block";
  }

  // Oculta o botão limpar na visualização
  if (btnLimpar) {
    btnLimpar.style.display = "none";
  }

  // Oculta o botão salvar na visualização
  if (btnCancelarEdicao) {
    btnCancelarEdicao.textContent = "Cancelar";
    btnCancelarEdicao.style.display = "inline-block";
  }
}

function prepararEdicao() {
  if (!produtoSelecionado) return;
  modoAtual = "editar";
  abrirDrawer();
  preencherCamposForm(produtoSelecionado);
  alterarEstadoCamposForm(false);

  btnSalvar.textContent = "Atualizar";
  btnSalvar.className = "btn btn-primario";
  btnSalvar.style.display = "inline-block";
  // oculta limpar na edição
  if (btnLimpar) btnLimpar.style.display = "none";
  btnCancelarEdicao.style.display = "inline-block";
}

function prepararExclusao() {
  if (!produtoSelecionado) return;
  modoAtual = "excluir"; // FIX
  abrirDrawer();
  preencherCamposForm(produtoSelecionado);
  alterarEstadoCamposForm(true);

  btnSalvar.textContent = "Confirmar e Desativar";// inativa produto ao vez de excluir
  btnSalvar.className = "btn btn-excluir-confirmacao";
  btnSalvar.style.display = "inline-block";
  //  oculta limpar na exclusão
  if (btnLimpar) btnLimpar.style.display = "none";
  btnCancelarEdicao.style.display = "inline-block";
  mostrarMensagem("Atenção: Confirme a desativação do produto.", "erro");
}

// Helpers de Formulário
function preencherCamposForm(produto) {
  produtoIdInput.value = produto.produtoid;
  categoriaProdutoInput.value = produto.categoriaprodutoid || "";
  descricaoProdutoInput.value = produto.ds_produto;
  observacaoProdutoInput.value = produto.obs_produto || "";
  valorVendaProdutoInput.value = produto.vl_venda_produto;
  dataCadastroProdutoInput.value = produto.dt_cadastro_produto ? produto.dt_cadastro_produto.split("T")[0] : "";

  if (statusProdutoInput.type === "checkbox") {
    statusProdutoInput.checked = Boolean(produto.status_produto);
  } else {
    statusProdutoInput.value = produto.status_produto !== null ? produto.status_produto.toString() : "";
  }
}

function alterarEstadoCamposForm(bloquear) {
  categoriaProdutoInput.disabled = bloquear;
  descricaoProdutoInput.disabled = bloquear;
  observacaoProdutoInput.disabled = bloquear;
  valorVendaProdutoInput.disabled = bloquear;
  dataCadastroProdutoInput.disabled = bloquear;
  statusProdutoInput.disabled = bloquear;
}

function cancelarEdicao() {
  modoAtual = null; // FIX
  if (formProduto) formProduto.reset();
  produtoIdInput.value = "";
  alterarEstadoCamposForm(false);

  btnSalvar.textContent = "Salvar";
  btnSalvar.className = "btn btn-primario";
  btnSalvar.style.display = "inline-block";
  // FIX: restaura visibilidade do limpar ao fechar
  if (btnLimpar) btnLimpar.style.display = "inline-block";
  btnCancelarEdicao.style.display = "none";
  mensagem.textContent = "";
  mensagem.className = "mensagem";

  produtoSelecionado = null;
  fecharDrawer();
  atualizarPainelAcoes();
  renderizarTabela(listaProdutos);
}

/*
  ============================================
  PERSISTÊNCIA DE DADOS (C R U D)
  ============================================
*/
async function salvarProduto() {
  let statusAtual = statusProdutoInput.type === "checkbox" ? statusProdutoInput.checked : (statusProdutoInput.value === "true");

  const novoProduto = {
    categoriaprodutoid: categoriaProdutoInput.value !== "" ? parseInt(categoriaProdutoInput.value) : null,
    ds_produto: descricaoProdutoInput.value,
    obs_produto: observacaoProdutoInput.value,
    vl_venda_produto: valorVendaProdutoInput.value !== "" ? parseFloat(valorVendaProdutoInput.value) : 0,
    dt_cadastro_produto: dataCadastroProdutoInput.value ? new Date(dataCadastroProdutoInput.value).toISOString() : new Date().toISOString(),
    status_produto: statusAtual
  };

  const { error } = await supabaseClient.from("produto").insert(novoProduto);

  if (error) return mostrarMensagem("Erro ao salvar produto: " + error.message, "erro");

  mostrarMensagem("Produto cadastrado com sucesso!", "sucesso");
  cancelarEdicao();
  carregarProdutos();
}

async function atualizarProduto() {
  let statusAtual = statusProdutoInput.type === "checkbox" ? statusProdutoInput.checked : (statusProdutoInput.value === "true");

  const produtoAtualizado = {
    categoriaprodutoid: categoriaProdutoInput.value !== "" ? parseInt(categoriaProdutoInput.value) : null,
    ds_produto: descricaoProdutoInput.value,
    obs_produto: observacaoProdutoInput.value,
    vl_venda_produto: valorVendaProdutoInput.value !== "" ? parseFloat(valorVendaProdutoInput.value) : 0,
    dt_cadastro_produto: dataCadastroProdutoInput.value ? new Date(dataCadastroProdutoInput.value).toISOString() : null,
    status_produto: statusAtual
  };

  const { error } = await supabaseClient
    .from("produto")
    .update(produtoAtualizado)
    .eq("produtoid", parseInt(produtoIdInput.value));

  if (error) return mostrarMensagem("Erro ao atualizar produto: " + error.message, "erro");

  mostrarMensagem("Produto atualizado com sucesso!", "sucesso");
  cancelarEdicao();
  carregarProdutos();
}

// FIX: inativa o produto (status_produto = false) em vez de deletar
async function executarExclusao(produtoId) {
  const { error } = await supabaseClient
    .from("produto")
    .update({ status_produto: false })
    .eq("produtoid", produtoId);

  if (error) return mostrarMensagem("Erro ao desativar produto: " + error.message, "erro");

  mostrarMensagem("Produto desativado com sucesso!", "sucesso");
  produtoSelecionado = null; // FIX: produto saiu da lista ativa, zera seleção
  fecharDrawer();
  atualizarPainelAcoes();
  carregarProdutos();
}

/*
  ============================================
  EVENTOS DOS BOTÕES E INICIALIZAÇÃO
  ============================================
*/
formProduto.addEventListener("submit", async function(evento) {
  evento.preventDefault();

  // FIX: roteador por modoAtual, não por className
  if (modoAtual === "excluir") {
    await executarExclusao(parseInt(produtoIdInput.value));
    return;
  }

  if (modoAtual === "editar") {
    await atualizarProduto();
    return;
  }

  if (modoAtual === "criar") {
    await salvarProduto();
    return;
  }
});

btnCancelarEdicao.addEventListener("click", cancelarEdicao);

// Vínculo dos botões do Painel de Ações Globais
document.getElementById("btnVisualizar")?.addEventListener("click", prepararVisualizacao);
document.getElementById("btnEditar")?.addEventListener("click", prepararEdicao);
document.getElementById("btnExcluir")?.addEventListener("click", prepararExclusao);

// Inicialização
carregarProdutos();
carregarCategoriasProduto();