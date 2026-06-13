// Configuração do Supabase
// Substitua os valores abaixo pelos dados do seu projeto.

const SUPABASE_URL = "https://seu-projeto.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sua_chave_publica_aqui";

// Cliente global do banco de dados
export const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);