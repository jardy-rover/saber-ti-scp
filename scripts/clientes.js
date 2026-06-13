import { supabaseClient } from "./supabase-config.js";
/*
  ============================================
  ELEMENTOS DO HTML
  ============================================
*/

const formCliente         = document.getElementById("formCliente");
const tabelaClientes      = document.getElementById("tabelaClientes");
const mensagem            = document.getElementById("mensagem");

const clienteIdInput      = document.getElementById("clienteId");
const tipoClienteInput    = document.getElementById("tipoCliente");
const cpfCnpjClienteInput = document.getElementById("cpfCnpjCliente");
const nomeClienteInput    = document.getElementById("nomeCliente");

const btnSalvar           = document.getElementById("btnSalvar");
const btnCancelarEdicao   = document.getElementById("btnCancelarEdicao");
const btnCriarCliente     = document.getElementById("btnCriarCliente");
const btnLimpar           = formCliente?.querySelector('[type="reset"]');

const campoBusca          = document.getElementById("campoBusca");

// Variáveis de Estado de Controle Global
let listaClientes      = [];
let clienteSelecionado = null;
let modoAtual = null; // "criar" | "visualizar" | "editar" | "excluir"


if (cpfCnpjClienteInput) {
  cpfCnpjClienteInput.addEventListener("input", function () {
    
    // Remove tudo o que não for número (letras, pontos, traços, espaços)
    let apenasNumeros = cpfCnpjClienteInput.value.replace(/\D/g, "");

    // Limita o teto máximo em 14 dígitos (tamanho de um CNPJ puro)
    if (apenasNumeros.length > 14) {
      apenasNumeros = apenasNumeros.substring(0, 14);
    }

    // Devolve os números limpos e limitados para o campo
    cpfCnpjClienteInput.value = apenasNumeros;
  });
}

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
  FUNÇÃO PARA FORMATAR O TIPO DO CLIENTE
  ============================================
*/

function formatarTipoCliente(tipoCliente) {
  if (tipoCliente === "F") return "Pessoa Física";
  if (tipoCliente === "J") return "Pessoa Jurídica";
  return "Não informado";
}

/*
  ============================================
  SELECIONAR UM CLIENTE DA TABELA
  ============================================
*/

function selecionarCliente(cliente, linha) {
  tabelaClientes.querySelectorAll("tr").forEach(function(tr) {
    tr.classList.remove("linha-selecionada");
  });

  // Se clicar no mesmo registro que já está selecionado, remove a seleção
  if (clienteSelecionado && clienteSelecionado.clienteid === cliente.clienteid) {
    clienteSelecionado = null;
    atualizarPainelAcoes();
    return;
  }

  clienteSelecionado = cliente;
  linha.classList.add("linha-selecionada");
  atualizarPainelAcoes();
}

/*
  ============================================
  ATUALIZAR PAINEL DE AÇÕES
  ============================================
*/

function atualizarPainelAcoes() {
  const temSelecao = clienteSelecionado !== null;

  const btnVisualizarCard = document.getElementById("btnVisualizar");
  const btnEditarCard     = document.getElementById("btnEditarCard");
  const btnExcluirCard    = document.getElementById("btnExcluirCard");

  if (btnVisualizarCard) btnVisualizarCard.disabled = !temSelecao;
  if (btnEditarCard)     btnEditarCard.disabled     = !temSelecao;
  if (btnExcluirCard)    btnExcluirCard.disabled    = !temSelecao;

  const badgeStatus  = document.getElementById("badgeStatus");
  const infoCodigo   = document.getElementById("infoCodigo");
  const infoDescricao = document.getElementById("infoDescricao");

  if (temSelecao) {
    if (badgeStatus) badgeStatus.textContent = "Selecionado";
    if (infoNome)    infoNome.textContent   = clienteSelecionado.nome_cliente;
    if (infoCodigo) infoCodigo.textContent = clienteSelecionado.clienteid;
    if (infoDocumento) infoDocumento.textContent   = clienteSelecionado.cpf_cnpj_cliente;
    if (infoTipo) infoTipo.textContent = formatarTipoCliente(clienteSelecionado.tipo_cliente);
  } else {
    if (badgeStatus) badgeStatus.textContent = "Selecionar";
    if (infoNome)    infoNome.textContent   = "—";
    if (infoCodigo) infoCodigo.textContent = "-";
    if (infoDocumento)    infoDocumento.textContent   = "-";
    if (infoTipo) infoTipo.textContent = "-";
  }
}

/*
  ============================================
  RENDERIZAR TABELA PRINCIPAL
  ============================================
*/

function renderizarTabela(lista) {
  if (!tabelaClientes) return;
  tabelaClientes.innerHTML = "";

  if (lista.length === 0) {
    tabelaClientes.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: var(--espaco-6);">Nenhum cliente encontrado.</td>
      </tr>
    `;
    return;
  }

  lista.forEach(function(cliente) {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td style="color:var(--texto-terciario); font-size:var(--tamanho-xs);">${cliente.clienteid}</td>
      <td>${formatarTipoCliente(cliente.tipo_cliente)}</td>
      <td>${cliente.cpf_cnpj_cliente}</td>
      <td style="font-weight:500; color:var(--texto-primario);">${cliente.nome_cliente}</td>
    `;

    linha.addEventListener("click", function() {
      selecionarCliente(cliente, linha);
    });

    // Mantém o estado visual ativo se a tabela recarregar com uma seleção ativa
    if (clienteSelecionado && clienteSelecionado.clienteid === cliente.clienteid) {
      linha.classList.add("linha-selecionada");
      clienteSelecionado = cliente; // Atualiza dados frescos do banco
    }

    tabelaClientes.appendChild(linha);
  });
}

/*
  ============================================
  CARREGAR CLIENTES DO SUPABASE
  ============================================
*/

async function carregarClientes() {
  const { data, error } = await supabaseClient
    .from("cliente")
    .select("clienteid, tipo_cliente, cpf_cnpj_cliente, nome_cliente")
    .order("clienteid", { ascending: true });

  if (error) {
    if (tabelaClientes) {
      tabelaClientes.innerHTML = `<tr><td colspan="5" style="text-align: center;">Erro ao carregar clientes.</td></tr>`;
    }
    mostrarMensagem("Erro ao buscar clientes: " + error.message, "erro");
    return;
  }

  listaClientes = data || [];
  renderizarTabela(listaClientes);
}

/*
  ============================================
  PREPARAR OPERAÇÕES (CRIAR / VER / EDITAR / EXCLUIR)
  ============================================
*/

if (btnCriarCliente) {
  btnCriarCliente.addEventListener("click", function() {
    modoAtual = "criar";
    abrirDrawer();

    if (formCliente) formCliente.reset();
    
    if (clienteIdInput)      clienteIdInput.value = "";
    if (tipoClienteInput)    tipoClienteInput.disabled = false;
    if (cpfCnpjClienteInput) cpfCnpjClienteInput.readOnly = false;
    if (nomeClienteInput)    nomeClienteInput.readOnly = false;

    if (btnSalvar) {
      btnSalvar.textContent = "Salvar";
      btnSalvar.className   = "btn btn-primario";
      btnSalvar.style.display = "inline-block";
    }
    if (btnLimpar) btnLimpar.style.display = "inline-block";
    if (btnCancelarEdicao) btnCancelarEdicao.style.display = "inline-block";

  });
}

async function prepararVisualizacao(cliente) {
  modoAtual = "visualizar";
  abrirDrawer();

  if (clienteIdInput)      clienteIdInput.value = cliente.clienteid;
  if (tipoClienteInput) {
    tipoClienteInput.value = cliente.tipo_cliente;
    tipoClienteInput.disabled = true;
  }
  if (cpfCnpjClienteInput) {
    cpfCnpjClienteInput.value = cliente.cpf_cnpj_cliente;
    cpfCnpjClienteInput.readOnly = true;
  }
  if (nomeClienteInput) {
    nomeClienteInput.value = cliente.nome_cliente;
    nomeClienteInput.readOnly = true;
  }

  if (btnSalvar) {
    btnSalvar.textContent = "Criar orçamento";
    btnSalvar.style.display = "inline-block";
  }

  if (btnLimpar) btnLimpar.style.display = "none";
  
  if (btnCancelarEdicao) {
    btnCancelarEdicao.textContent = "Fechar";
    btnCancelarEdicao.style.display = "inline-block";
  }
}

async function prepararEdicao(cliente) {
  modoAtual = "editar";
  abrirDrawer();

  if (clienteIdInput)      clienteIdInput.value = cliente.clienteid;
  
  if (tipoClienteInput) {
    tipoClienteInput.value = cliente.tipo_cliente;
    tipoClienteInput.disabled = true; // Mantido bloqueado para preservar a integridade do tipo de cadastro (Física/Jurídica)
  }
  
  if (cpfCnpjClienteInput) {
    cpfCnpjClienteInput.value = cliente.cpf_cnpj_cliente;
    cpfCnpjClienteInput.readOnly = false; // DESBLOQUEADO: Permite alteração de CPF/CNPJ
  }
  
  if (nomeClienteInput) {
    nomeClienteInput.value = cliente.nome_cliente;
    nomeClienteInput.readOnly = false;
  }

  if (btnSalvar) {
    btnSalvar.textContent = "Atualizar";
    btnSalvar.className   = "btn btn-primario";
    btnSalvar.style.display = "inline-block";
  }
  if (btnLimpar)         btnLimpar.style.display = "none";
  if (btnCancelarEdicao) btnCancelarEdicao.style.display = "inline-block";

}

async function prepararExclusao(cliente) {
  modoAtual = "excluir";
  abrirDrawer();

  if (clienteIdInput)      clienteIdInput.value = cliente.clienteid;
  if (tipoClienteInput) {
    tipoClienteInput.value = cliente.tipo_cliente;
    tipoClienteInput.disabled = true;
  }
  if (cpfCnpjClienteInput) {
    cpfCnpjClienteInput.value = cliente.cpf_cnpj_cliente;
    cpfCnpjClienteInput.readOnly = true;
  }
  if (nomeClienteInput) {
    nomeClienteInput.value = cliente.nome_cliente;
    nomeClienteInput.readOnly = true;
  }

  if (btnSalvar) {
    btnSalvar.textContent = "Confirmar e Excluir";
    btnSalvar.className   = "btn btn-perigo";
    btnSalvar.style.display = "inline-block";
  }
  if (btnLimpar)         btnLimpar.style.display = "none";
  if (btnCancelarEdicao) btnCancelarEdicao.style.display = "inline-block";

  mostrarMensagem("Atenção: Confirme a exclusão permanente deste cliente.", "erro");
}

/*
  ============================================
  SALVAR / ATUALIZAR / EXCLUIR NO SUPABASE
  ============================================
*/

async function salvarCliente() {
  const novoCliente = {
    tipo_cliente:     tipoClienteInput.value,
    cpf_cnpj_cliente: cpfCnpjClienteInput.value.trim(),
    nome_cliente:     nomeClienteInput.value.trim()
  };

  if (!novoCliente.nome_cliente) {
    mostrarMensagem("Informe o nome do cliente.", "erro");
    return;
  }

  const { error } = await supabaseClient
    .from("cliente")
    .insert(novoCliente);

  if (error) {
    mostrarMensagem("Erro ao salvar cliente: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Cliente salvo com sucesso!", "sucesso");
  cancelarEdicao();
  carregarClientes();
}

async function atualizarCliente() {
  const clienteId      = clienteIdInput.value;
  const nomeCliente    = nomeClienteInput.value.trim();
  const cpfcnpjCliente = cpfCnpjClienteInput.value.trim(); 

  if (!nomeCliente) {
    mostrarMensagem("O nome do cliente não pode ficar em branco.", "erro");
    return;
  }

  if (!cpfcnpjCliente) {
    mostrarMensagem("O documento do cliente não pode ficar em branco.", "erro");
    return;
  }

  // CORREÇÃO: Enviando tanto o nome quanto o CPF/CNPJ atualizados para o banco
  const { error } = await supabaseClient
    .from("cliente")
    .update({ 
      nome_cliente: nomeCliente,
      cpf_cnpj_cliente: cpfcnpjCliente 
    })
    .eq("clienteid", clienteId);

  if (error) {
    mostrarMensagem("Erro ao atualizar cliente: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Cliente atualizado com sucesso!", "sucesso");
  cancelarEdicao();
  carregarClientes();
}

async function executarExclusao(clienteId) {
  const { error } = await supabaseClient
    .from("cliente")
    .delete()
    .eq("clienteid", clienteId);

  if (error) {
    mostrarMensagem("Erro ao excluir cliente: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Cliente excluído com sucesso!", "sucesso");
  cancelarEdicao();
  carregarClientes();
}

/*
  ============================================
  CANCELAR EDIÇÃO / COMPORTAMENTO PADRÃO
  ============================================
*/

function cancelarEdicao() {
  modoAtual = null;
  if (formCliente) formCliente.reset();

  if (clienteIdInput)      clienteIdInput.value = "";
  if (tipoClienteInput)    tipoClienteInput.disabled = false;
  if (cpfCnpjClienteInput) cpfCnpjClienteInput.readOnly = false;
  if (nomeClienteInput)    nomeClienteInput.readOnly = false;

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

  if (mensagem) {
    mensagem.textContent = "";
    mensagem.className   = "mensagem";
  }

  clienteSelecionado = null;
  fecharDrawer();
  atualizarPainelAcoes();
}

/*
  ============================================
  EVENTOS DO CARD LATERAL
  ============================================
*/

document.getElementById("btnVisualizar")?.addEventListener("click", function() {
  if (clienteSelecionado) prepararVisualizacao(clienteSelecionado);
});

document.getElementById("btnEditarCard")?.addEventListener("click", function() {
  if (clienteSelecionado) prepararEdicao(clienteSelecionado);
});

document.getElementById("btnExcluirCard")?.addEventListener("click", function() {
  if (clienteSelecionado) prepararExclusao(clienteSelecionado);
});

/*
  ============================================
  EVENTOS DO FORMULÁRIO E BUSCA DINÂMICA
  ============================================
*/

formCliente?.addEventListener("submit", async function(evento) {
  evento.preventDefault();

  if (modoAtual === "criar") {
    await salvarCliente();
  } else if (modoAtual === "editar") {
    await atualizarCliente();
  } else if (modoAtual === "excluir") {
    const clienteId = parseInt(clienteIdInput.value);
    if (clienteId) await executarExclusao(clienteId);
  } else if (modoAtual === "visualizar") {

    // Captura o ID do cliente atual do input e redireciona apenas com o dado do cliente
    const clienteId = clienteIdInput.value;
    
    if (clienteId) {
      redirecionarParaNovoOrcamento({
        clienteId: clienteId
      });
    }
  }
});

btnCancelarEdicao?.addEventListener("click", function() {
  cancelarEdicao();
});

// Filtro em tempo real (Busca Dinâmica por Código, CPF/CNPJ ou Nome) (Substituir por pesquisa sob confirmação)
campoBusca?.addEventListener("input", function() {
  const termo = campoBusca.value.toLowerCase().trim();

  if (!termo) {
    renderizarTabela(listaClientes);
    return;
  }

  const filtrados = listaClientes.filter(function(cliente) {
    const idStr   = String(cliente.clienteid).toLowerCase();
    const nome    = (cliente.nome_cliente || "").toLowerCase();
    const doc     = (cliente.cpf_cnpj_cliente || "").toLowerCase();
    
    return idStr.includes(termo) || nome.includes(termo) || doc.includes(termo);
  });

  renderizarTabela(filtrados);
});

// Executa na inicialização da página de clientes
(function verificarGatilhoSidebarCliente() {
  const acao = localStorage.getItem("acao_automatica_sidebar");
  
  if (acao === "criar_cliente") {
    // Limpa o sinal do cache do navegador
    localStorage.removeItem("acao_automatica_sidebar");
    
    setTimeout(() => {
      if (typeof prepararCriacao === "function") {
        prepararCriacao();
        console.log("Drawer de novo cliente aberto automaticamente via atalho lateral.");
      } else {
        // Caso a sua função de criar em clientes tenha outro nome (ex: btnCriarCliente.click())
        document.getElementById("btnCriarCliente")?.click();
      }
    }, 300);
  }
})();

/*
  ============================================
  CARREGAMENTO INICIAL DA PÁGINA
  ============================================
*/

carregarClientes();