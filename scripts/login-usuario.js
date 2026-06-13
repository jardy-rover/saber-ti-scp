import { supabaseClient } from "./supabase-config.js";

/*
  ============================================
  ELEMENTOS DO HTML
  ============================================
*/

const formLogin = document.getElementById("formLogin");
const mensagem = document.getElementById("mensagem");

const emailLoginInput = document.getElementById("emailLogin");
const passwordInput = document.getElementById("password");

/*
  ============================================
  FUNÇÕES DE FEEDBACK
  ============================================
*/

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

/*
  ============================================
  OPERAÇÕES DE LOGIN
  ============================================
*/

async function realizarLogin() {
  const email = emailLoginInput.value.trim().toLowerCase();
  const senha = passwordInput.value;

  try {
    const { data, error } = await supabaseClient
      .from("usuario")
      .select("*")
      .eq("email", email) // Verifica se o email corresponde
      .eq("senha", senha) // Verifica se a senha corresponde
      .single(); // Espera um único resultado

    if (error) {
      throw error;
    }

    const { error: updateError } = await supabaseClient
      .from("usuario")
      .update({
        dt_ultimo_login: new Date().toISOString() // Atualiza a data do último login para o horário atual
      })
      .eq("id", data.id);

    if (updateError) {
      throw updateError;
    }

    console.log("LOGIN:", data);

    mostrarMensagem(
      "Login realizado com sucesso!",
      "sucesso"
    );

    sessionStorage.setItem(
      "usuarioLogado",
      JSON.stringify({
        id: data.id,
        nome: data.nome,
        email: data.email,
        cargo: data.cargo
      })
    );

  window.location.href = "orcamentos.html"; // Redireciona para a página inicial após o login bem-sucedido

  } catch (err) {
    console.error("ERRO COMPLETO:", err);


    mostrarMensagem(
      "E-mail ou senha inválidos.",
      "erro"
    );

    return;
  }
}

/*
  ============================================
  EVENTO DE ENVIO DO FORMULÁRIO
  ============================================
*/

formLogin.addEventListener("submit", async function(evento) {
  evento.preventDefault();

  if (
    emailLoginInput.value.trim() === "" ||
    passwordInput.value.trim() === ""
  ) {
    mostrarMensagem(
      "Preencha e-mail e senha.",
      "erro"
    );
    return;
  }

  await realizarLogin();
});