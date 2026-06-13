import { supabaseClient } from "./supabase-config.js";

/*
  ============================================
  ELEMENTOS DO HTML
  ============================================
*/

const formCategoria            = document.getElementById("formCategoria");
const tabelaCategorias         = document.getElementById("tabelaCategorias");
const tabelaProdutos           = document.getElementById("tabelaProdutos");
const mensagem                 = document.getElementById("mensagem");

const categoriaIdInput         = document.getElementById("categoriaId");
const descricaoCategoriaInput  = document.getElementById("descricaoCategoria");

const btnSalvar                = document.getElementById("btnSalvar");
const btnCancelarEdicao        = document.getElementById("btnCancelarEdicao");
const btnCriarCategoria        = document.getElementById("btnCriarCategoria");
const btnLimpar                = formCategoria?.querySelector('[type="reset"]');

const campoBusca               = document.getElementById("campoBusca");

// Variáveis de Estado e Memória Local de Cache
let listaCategorias    = [];
let listaProdutos      = [];
let categoriaSelecionada = null;
let modoAtual          = null; // "criar" | "visualizar" | "editar" | "excluir"

/*
  ============================================
  INTERAÇÕES COM O DRAWER
  ============================================
*/

function abrirDrawer() {
  document.getElementById('drawer')?.classList.add('open');
  document.getElementById('overlay')?.classList.add('active');
  document.body.classList.add("sem-rolagem");
}

function fecharDrawer() {
  document.getElementById('drawer')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('active');
  document.body.classList.remove("sem-rolagem");
}

document.getElementById('overlay')?.addEventListener('click', cancelarEdicao);
document.addEventListener('keydown', e => { 
  if (e.key === 'Escape' && modoAtual) cancelarEdicao(); 
});

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
  SELECIONAR UMA CATEGORIA NA TABELA
  ============================================
*/

function selecionarCategoria(categoria, linha) {
  tabelaCategorias.querySelectorAll("tr").forEach(function(tr) {
    tr.classList.remove("linha-selecionada");
  });

  // Deseleciona caso clique no mesmo registro ativo
  if (categoriaSelecionada && categoriaSelecionada.categoriaprodutoid === categoria.categoriaprodutoid) {
    categoriaSelecionada = null;
    atualizarPainelAcoes();
    filtrarProdutosPorCategoria(null); // Remove o filtro cruzado de produtos
    return;
  }

  categoriaSelecionada = categoria;
  linha.classList.add("linha-selecionada");
  atualizarPainelAcoes();
  filtrarProdutosPorCategoria(categoria.categoriaprodutoid); // Filtro cruzado inteligente
}

/*
  ============================================
  ATUALIZAR PAINEL DE AÇÕES (CARD LATERAL)
  ============================================
*/

function atualizarPainelAcoes() {
  const temSelecao = categoriaSelecionada !== null;

  const btnVisualizarCard = document.getElementById("btnVisualizar");
  const btnEditarCard     = document.getElementById("btnEditarCard");
  const btnExcluirCard    = document.getElementById("btnExcluirCard");

  if (btnVisualizarCard) btnVisualizarCard.disabled = !temSelecao;
  if (btnEditarCard)     btnEditarCard.disabled     = !temSelecao;
  if (btnExcluirCard)    btnExcluirCard.disabled    = !temSelecao;

  const badgeStatus   = document.getElementById("badgeStatus");
  const infoCodigo    = document.getElementById("infoCodigo");
  const infoDescricao = document.getElementById("infoDescricao");

  if (temSelecao) {
    if (badgeStatus)   badgeStatus.textContent = "Selecionado";
    if (infoCodigo)    infoCodigo.textContent   = categoriaSelecionada.categoriaprodutoid;
    if (infoDescricao) infoDescricao.textContent = categoriaSelecionada.ds_categoria_produto;
  } else {
    if (badgeStatus)   badgeStatus.textContent = "Selecionar";
    if (infoCodigo)    infoCodigo.textContent   = "—";
    if (infoDescricao) infoDescricao.textContent = "—";
  }
}

/*
  ============================================
  RENDERIZAR TABELA DE CATEGORIAS
  ============================================
*/

function renderizarTabelaCategorias(lista) {
  if (!tabelaCategorias) return;
  tabelaCategorias.innerHTML = "";

  if (lista.length === 0) {
    tabelaCategorias.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; padding: var(--espaco-4);">Nenhuma categoria encontrada.</td>
      </tr>
    `;
    return;
  }

  lista.forEach(function(categoria) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td style="color:var(--texto-terciario); font-size:var(--tamanho-xs);">${categoria.categoriaprodutoid}</td>
      <td style="font-weight:500; color:var(--texto-primario);">${categoria.ds_categoria_produto}</td>
    `;

    row.addEventListener("click", function() {
      selecionarCategoria(categoria, row);
    });

    if (categoriaSelecionada && categoriaSelecionada.categoriaprodutoid === categoria.categoriaprodutoid) {
      row.classList.add("linha-selecionada");
      categoriaSelecionada = categoria;
    }

    tabelaCategorias.appendChild(row);
  });
}

/*
  ============================================
  RENDERIZAR TABELA DE PRODUTOS
  ============================================
*/

function renderizarTabelaProdutos(lista) {
  if (!tabelaProdutos) return;
  tabelaProdutos.innerHTML = "";

  if (lista.length === 0) {
    tabelaProdutos.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: var(--espaco-4);">Nenhum produto correspondente encontrado.</td>
      </tr>
    `;
    return;
  }

  lista.forEach(function(produto) {
    const row = document.createElement("tr");
    
    // Busca amigável do nome da categoria usando a lista em cache
    const catCorrespondente = listaCategorias.find(c => c.categoriaprodutoid === produto.categoriaprodutoid);
    const nomeCategoria     = catCorrespondente ? catCorrespondente.ds_categoria_produto : `ID: ${produto.categoriaprodutoid}`;

    row.innerHTML = `
      <td style="color:var(--texto-terciario); font-size:var(--tamanho-xs);">${produto.produtoid}</td>
      <td style="font-size:var(--tamanho-sm); color:var(--texto-secundario);">${nomeCategoria}</td>
      <td style="font-weight:500; color:var(--texto-primario);">${produto.ds_produto}</td>
      <td style="color:var(--texto-secundario);">${produto.obs_produto || "—"}</td>
      <td style="font-weight:600; color:var(--texto-primario);">R$ ${Number(produto.vl_venda_produto).toFixed(2).replace(".", ",")}</td>
      <td>
        <span class="badge ${produto.status_produto === 'A' ? 'status-ativo' : 'status-expirado'}">
          ${produto.status_produto === 'A' ? 'Ativo' : 'Inativo'}
        </span>
      </td>
    `;
    tabelaProdutos.appendChild(row);
  });
}

/*
  ============================================
  CARREGAR DADOS DO SUPABASE
  ============================================
*/

async function carregarCategorias() {
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid, ds_categoria_produto")
    .order("categoriaprodutoid", { ascending: true });

  if (error) {
    if (tabelaCategorias) tabelaCategorias.innerHTML = `<tr><td colspan="3" style="text-align: center;">Erro ao carregar categorias.</td></tr>`;
    mostrarMensagem("Erro ao buscar categorias: " + error.message, "erro");
    return;
  }

  listaCategorias = data || [];
  renderizarTabelaCategorias(listaCategorias);
}

async function carregarProdutos() {
  const { data, error } = await supabaseClient
    .from("produto")
    .select("produtoid, categoriaprodutoid, ds_produto, obs_produto, vl_venda_produto, status_produto")
    .order("produtoid", { ascending: true });

  if (error) {
    if (tabelaProdutos) tabelaProdutos.innerHTML = `<tr><td colspan="6" style="text-align: center;">Erro ao carregar produtos.</td></tr>`;
    return;
  }

  listaProdutos = data || [];
  renderizarTabelaProdutos(listaProdutos);
}

/*
  ============================================
  FILTRO CRUZADO INTELIGENTE (PRODUTOS) (Não utilizado)
  ============================================
*/

function filtrarProdutosPorCategoria(categoriaId) {
  if (!categoriaId) {
    renderizarTabelaProdutos(listaProdutos); // Se nulo, restaura lista total
    return;
  }
  const filtrados = listaProdutos.filter(p => p.categoriaprodutoid === categoriaId);
  renderizarTabelaProdutos(filtrados);
}

/*
  ============================================
  PREPARAR OPERAÇÕES (CRIAR / VER / EDITAR / EXCLUIR)
  ============================================
*/

if (btnCriarCategoria) {
  btnCriarCategoria.addEventListener("click", function() {
    modoAtual = "criar";
    abrirDrawer();

    if (formCategoria) formCategoria.reset();
    
    if (categoriaIdInput)        categoriaIdInput.value = "";
    if (descricaoCategoriaInput) descricaoCategoriaInput.readOnly = false;

    if (btnSalvar) {
      btnSalvar.textContent = "Salvar";
      btnSalvar.className   = "btn btn-primario";
      btnSalvar.style.display = "inline-block";
    }
    if (btnLimpar) btnLimpar.style.display = "inline-block";
    if (btnCancelarEdicao) btnCancelarEdicao.style.display = "inline-block";

  });
}

async function prepararVisualizacao(categoria) {
  modoAtual = "visualizar";
  abrirDrawer();

  if (categoriaIdInput)        categoriaIdInput.value = categoria.categoriaprodutoid;
  if (descricaoCategoriaInput) {
    descricaoCategoriaInput.value = categoria.ds_categoria_produto;
    descricaoCategoriaInput.readOnly = true;
  }

  if (btnSalvar)           btnSalvar.style.display = "none";
  if (btnLimpar)           btnLimpar.style.display = "none";
  if (btnCancelarEdicao) {
    btnCancelarEdicao.textContent = "Fechar";
    btnCancelarEdicao.style.display = "inline-block";
  }
}

async function prepararEdicao(categoria) {
  modoAtual = "editar";
  abrirDrawer();

  if (categoriaIdInput)        categoriaIdInput.value = categoria.categoriaprodutoid;
  if (descricaoCategoriaInput) {
    descricaoCategoriaInput.value = categoria.ds_categoria_produto;
    descricaoCategoriaInput.readOnly = false;
  }

  if (btnSalvar) {
    btnSalvar.textContent = "Atualizar";
    btnSalvar.className   = "btn btn-primario";
    btnSalvar.style.display = "inline-block";
  }
  if (btnLimpar)         btnLimpar.style.display = "none";
  if (btnCancelarEdicao) btnCancelarEdicao.style.display = "inline-block";

}

async function prepararExclusao(categoria) {
  modoAtual = "excluir";
  abrirDrawer();

  if (categoriaIdInput)        categoriaIdInput.value = categoria.categoriaprodutoid;
  if (descricaoCategoriaInput) {
    descricaoCategoriaInput.value = categoria.ds_categoria_produto;
    descricaoCategoriaInput.readOnly = true;
  }

  if (btnSalvar) {
    btnSalvar.textContent = "Confirmar e Excluir";
    btnSalvar.className   = "btn btn-perigo"; 
    btnSalvar.style.display = "inline-block";
  }
  if (btnLimpar)         btnLimpar.style.display = "none";
  if (btnCancelarEdicao) btnCancelarEdicao.style.display = "inline-block";

  mostrarMensagem("Atenção: A exclusão só será permitida se não houver produtos vinculados.", "erro");
}

/*
  ============================================
  PERSISTÊNCIA DE DADOS NO SUPABASE
  ============================================
*/

async function salvarCategoria() {
  const novaCategoria = {
    ds_categoria_produto: descricaoCategoriaInput.value.trim()
  };

  if (!novaCategoria.ds_categoria_produto) {
    mostrarMensagem("A descrição da categoria é obrigatória.", "erro");
    return;
  }

  const { error } = await supabaseClient
    .from("categoria_produto")
    .insert(novaCategoria);

  if (error) {
    mostrarMensagem("Erro ao salvar categoria: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Categoria cadastrada com sucesso!", "sucesso");
  cancelarEdicao();
  await carregarCategorias();
}

async function atualizarCategoria() {
  const categoriaId = categoriaIdInput.value;
  const dsCategoria = descricaoCategoriaInput.value.trim();

  if (!dsCategoria) {
    mostrarMensagem("A descrição não pode ficar vazia.", "erro");
    return;
  }

  const { error } = await supabaseClient
    .from("categoria_produto")
    .update({ ds_categoria_produto: dsCategoria })
    .eq("categoriaprodutoid", categoriaId);

  if (error) {
    mostrarMensagem("Erro ao atualizar categoria: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Categoria atualizada com sucesso!", "sucesso");
  cancelarEdicao();
  await carregarCategorias();
  await carregarProdutos(); // Atualiza nomes de categorias mapeados nos produtos
}

async function executarExclusao(categoriaId) {
  // Validação de Integridade antes da tentativa de exclusão física
  const possuiProdutos = listaProdutos.some(p => p.categoriaprodutoid === categoriaId);
  if (possuiProdutos) {
    mostrarMensagem("Impossível excluir: Existem produtos vinculados a esta categoria.", "erro");
    return;
  }

  const { error } = await supabaseClient
    .from("categoria_produto")
    .delete()
    .eq("categoriaprodutoid", categoriaId);

  if (error) {
    mostrarMensagem("Erro ao excluir categoria: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Categoria removida com sucesso!", "sucesso");
  cancelarEdicao();
  await carregarCategorias();
}

/*
  ============================================
  CANCELAR EDIÇÃO / COMPORTAMENTO PADRÃO
  ============================================
*/

/*
  ============================================
  CANCELAR EDIÇÃO / COMPORTAMENTO PADRÃO
  ============================================
*/

function cancelarEdicao() {
  modoAtual = null;
  if (formCategoria) formCategoria.reset();

  if (categoriaIdInput)        categoriaIdInput.value = "";
  if (descricaoCategoriaInput) descricaoCategoriaInput.readOnly = false;

  if (btnSalvar) {
    btnSalvar.textContent = "Salvar";
    btnSalvar.className   = "btn btn-primario";
    btnSalvar.style.display = "inline-block";
  }
  if (btnLimpar)         btnLimpar.style.display = "inline-block";
  if (btnCancelarEdicao) {
    btnCancelarEdicao.textContent = "Cancelar edição";
    btnCancelarEdicao.style.display = "none";
  }

  categoriaSelecionada = null;
  fecharDrawer();
  atualizarPainelAcoes();
  filtrarProdutosPorCategoria(null); // Limpa filtros da tabela de produtos
}

/*
  ============================================
  MAPEAMENTO DOS EVENTOS DO CARD LATERAL
  ============================================
*/

document.getElementById("btnVisualizar")?.addEventListener("click", function() {
  if (categoriaSelecionada) prepararVisualizacao(categoriaSelecionada);
});

document.getElementById("btnEditarCard")?.addEventListener("click", function() {
  if (categoriaSelecionada) prepararEdicao(categoriaSelecionada);
});

document.getElementById("btnExcluirCard")?.addEventListener("click", function() {
  if (categoriaSelecionada) prepararExclusao(categoriaSelecionada);
});

/*
  ============================================
  EVENTOS DO FORMULÁRIO E BUSCA DINÂMICA
  ============================================
*/

formCategoria?.addEventListener("submit", async function(evento) {
  evento.preventDefault();

  if (modoAtual === "criar") {
    await salvarCategoria();
  } else if (modoAtual === "editar") {
    await atualizarCategoria();
  } else if (modoAtual === "excluir") {
    const catId = parseInt(categoriaIdInput.value);
    if (catId) await executarExclusao(catId);
  }
});

btnCancelarEdicao?.addEventListener("click", function() {
  cancelarEdicao();
});

// Filtro Dinâmico em tempo real de Contexto Duplo (Filtra ambas tabelas simultaneamente)
campoBusca?.addEventListener("input", function() {
  const termo = campoBusca.value.toLowerCase().trim();

  if (!termo) {
    renderizarTabelaCategorias(listaCategorias);
    renderizarTabelaProdutos(listaProdutos);
    if (categoriaSelecionada) filtrarProdutosPorCategoria(categoriaSelecionada.categoriaprodutoid);
    return;
  }

  // Filtragem da tabela de categorias
  const categoriasFiltradas = listaCategorias.filter(function(cat) {
    const idStr = String(cat.categoriaprodutoid).toLowerCase();
    const desc  = (cat.ds_categoria_produto || "").toLowerCase();
    return idStr.includes(termo) || desc.includes(termo);
  });
  renderizarTabelaCategorias(categoriasFiltradas);

  // Filtragem da tabela de produtos (Filtra por ID, Descrição ou Observação)
  const produtosFiltrados = listaProdutos.filter(function(prod) {
    const idStr = String(prod.produtoid).toLowerCase();
    const desc  = (prod.ds_produto || "").toLowerCase();
    const obs   = (prod.obs_produto || "").toLowerCase();
    return idStr.includes(termo) || desc.includes(termo) || obs.includes(termo);
  });
  renderizarTabelaProdutos(produtosFiltrados);
});

/*
  ============================================
  CARREGAMENTO INICIAL SINCRONIZADO
  ============================================
*/

async function inicializarPagina() {
  // Garante a carga ordenada para mapeamento correto de dependências relacionais
  await carregarCategorias();
  await carregarProdutos();
}

inicializarPagina();