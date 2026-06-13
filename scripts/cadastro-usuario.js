import { supabaseClient } from "./supabase-config.js";

/*
  ============================================
  ELEMENTOS DO HTML
  ============================================
*/

// Globais da página e formulário
const formUsuario = document.getElementById("formUsuario");
const mensagem = document.getElementById("mensagem");

// Campos do formulário
const nomeCompletoInput = document.getElementById("nomeCompleto");
const emailInput = document.getElementById("email");
const cpfInput = document.getElementById("cpf");
const telefoneInput = document.getElementById("telefone");
const cargoInput = document.getElementById("cargo");

const senhaInput = document.getElementById("senha");
const confirmarSenhaInput = document.getElementById("confirmarSenha");

// Botões de ação
const btnCadastrar = document.getElementById("btnCadastrar");
const btnLimpar = document.getElementById("btnLimpar");
const btnVerificarSenha = document.getElementById("btnVerificarSenha");
const btnAvancar = document.getElementById("btnAvancar");


/*
  ============================================
  EVENTO DE ENVIO DO FORMULÁRIO
  ============================================
*/
formUsuario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  // 1. Validação de segurança: as senhas precisam ser iguais
  if (senhaInput.value !== confirmarSenhaInput.value) {
    mostrarMensagem("As senhas precisam ser iguais para concluir o registro.", "erro");
    return;
  }

  // 2. NOVA VALIDAÇÃO: Impede senhas menores que 8 caracteres
  if (senhaInput.value.length < 8) {
    mostrarMensagem("A senha deve conter no mínimo 8 caracteres.", "erro");
    senhaInput.focus();
    return;
  }

  // 3. Validação de campos obrigatórios
  if (
    nomeCompletoInput.value.trim() === "" ||
    emailInput.value.trim() === "" ||
    cpfInput.value.trim() === "" ||
    telefoneInput.value.trim() === "" ||
    cargoInput.value.trim() === ""
  ) {
    mostrarMensagem("Todos os campos devem ser preenchidos.", "erro");
    return;
  }

  console.log("Iniciando o processo de cadastro...");
  await salvarUsuario();
  console.log("Processo de cadastro concluído.");
});

// 1. Limitação e Máscara para o campo de CPF (Máximo 11 dígitos numéricos)
if (typeof cpfInput !== 'undefined' && cpfInput) {
  cpfInput.addEventListener("input", function () {
    let numeros = cpfInput.value.replace(/\D/g, "");
    if (numeros.length > 11) {
      numeros = numeros.substring(0, 11);
    }
    cpfInput.value = numeros;
  });
}

// 2. Higienização para o campo de E-mail (Remove espaços e força minúsculas)
if (typeof emailInput !== 'undefined' && emailInput) {
  emailInput.addEventListener("input", function () {
    emailInput.value = emailInput.value.replace(/\s/g, "").toLowerCase();
  });
}

// 3. Limitação e Máscara para o campo de Telefone (Máximo 11 dígitos: DDD + 9 dígitos)
if (typeof telefoneInput !== 'undefined' && telefoneInput) {
  telefoneInput.addEventListener("input", function () {
    let numeros = telefoneInput.value.replace(/\D/g, "");
    if (numeros.length > 11) {
      numeros = numeros.substring(0, 11);
    }
    telefoneInput.value = numeros;
  });
}

/*
  ============================================
  FUNÇÃO DE FEEDBACK
  ============================================
*/

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

/*
  ============================================
  OPERACÕES DO BANCO
  ============================================
*/

// Cadastra um novo usuário no banco
async function salvarUsuario() {
  const novoUsuario = {
    nome: nomeCompletoInput.value.trim(),
    cpf: cpfInput.value.replace(/\D/g, ""),
    email: emailInput.value.trim().toLowerCase(),
    telefone: telefoneInput.value.replace(/\D/g, ""),
    cargo: cargoInput.value.toUpperCase(),
    senha: senhaInput.value,
    ativo: true
  };

  try {
    const { data, error } = await supabaseClient
      .from("usuario")
      .insert(novoUsuario);

    if (error) throw error;

    mostrarMensagem("Usuário salvo com sucesso!", "sucesso");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);

  } catch (err) {
    // Especifica o erro dinamicamente para o usuário
    if (err.code === "23505") { // Código padrão do Postgres para duplicidade (Unique Constraint)
      mostrarMensagem("Este CPF ou E-mail já está cadastrado no sistema.", "erro");
    } else {
      mostrarMensagem("Não foi possível concluir o cadastro. Verifique os dados digitados.", "erro");
    }
    console.error("ERROR DETALHADO DO SISTEMA:", err);
  }
}

/*
  ============================================
  EVENTO DO BOTÃO LIMPAR
  ============================================
*/
formUsuario.addEventListener("reset", function (evento) {
  console.log("Formulário limpo com sucesso.");
});

/*
  ============================================
  EVENTO DO BOTÃO AVANÇAR
  ============================================
*/
btnAvancar.addEventListener("click", function (evento) {
  evento.preventDefault();
  if (senhaInput) {
    senhaInput.focus();
  }
  console.log("Avançando para a etapa final.");
});