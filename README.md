# SCP — Sistema de Controle de Produtos e Orçamentos

## Visão Geral

O SCP é um sistema web para gestão comercial desenvolvido com HTML5, CSS3 e JavaScript puro (ES6), utilizando Supabase como plataforma de backend e PostgreSQL como banco de dados.

O objetivo do sistema é centralizar o gerenciamento de clientes, produtos e orçamentos através de uma aplicação simples, de baixo custo operacional e fácil replicação.

Atualmente o sistema possui os seguintes módulos:

- Categorias de Produtos
- Produtos
- Clientes
- Usuários
- Orçamentos
- Itens de Orçamento

Toda a persistência de dados é realizada diretamente no Supabase, sem utilização de APIs próprias ou servidores intermediários.

---

# Arquitetura da Aplicação

A aplicação é composta por páginas independentes, cada uma responsável por um módulo de negócio.

Cada módulo contém sua própria lógica de:

- Consulta de dados
- Manipulação da interface
- Validação
- Persistência
- Atualização visual

Fluxo geral:

```text
Usuário
    ↓
HTML + CSS
    ↓
JavaScript
    ↓
Supabase API
    ↓
PostgreSQL
```

Todo o processamento da aplicação ocorre no navegador do usuário.

---

# Padrão Arquitetural dos Módulos

Todos os módulos seguem o mesmo padrão operacional.

## Carregamento Inicial

Ao abrir uma página, o sistema realiza todas as consultas necessárias para funcionamento daquele módulo.

Exemplo:

```javascript
carregarClientes();
carregarProdutos();
carregarOrcamentos();
```

---

## Cache Local

Os dados retornados pelo banco são armazenados em memória para reutilização durante a sessão.

Exemplo:

```javascript
let listaClientes = [];
let listaProdutos = [];
let listaOrcamentos = [];
let itensOrcamento = [];
```

Esse modelo reduz consultas repetidas e melhora a velocidade da interface.

---

## Renderização Manual

O sistema não utiliza frameworks de interface.

Toda atualização visual ocorre através da manipulação direta do DOM.

Exemplos:

```javascript
renderizarTabela(listaOrcamentos);
renderizarItens();
```

Sempre que ocorre uma alteração nos dados, os componentes visuais são reconstruídos utilizando as listas locais.

---

## Controle de Estado

Os formulários operam através de estados explícitos.

Exemplo:

```javascript
let modoAtual = null;
```

Estados atualmente utilizados:

```javascript
"criar";
"visualizar";
"editar";
"excluir";
```

O comportamento dos formulários, botões e ações disponíveis depende desse estado.

---

# Estrutura do Banco de Dados

O sistema utiliza seis entidades principais.

## CATEGORIA_PRODUTO

Responsável pela classificação dos produtos.

Exemplos:

- Equipamentos
- Serviços
- Ferramentas

---

## PRODUTO

Catálogo de produtos disponíveis para orçamento.

Principais informações:

- Categoria
- Descrição
- Observações
- Valor de venda
- Status
- Data de cadastro

---

## CLIENTE

Cadastro de clientes físicos e jurídicos.

Principais informações:

- Nome
- CPF/CNPJ
- Tipo de cliente

---

## ORCAMENTO

Cabeçalho principal dos orçamentos.

Principais informações:

- Cliente
- Data de emissão
- Data de validade
- Valor total

---

## ORCAMENTO_ITEM

Itens vinculados a cada orçamento.

Principais informações:

- Produto
- Quantidade
- Valor unitário
- Valor total

Cada orçamento pode possuir múltiplos itens.

---

## USUARIO

Cadastro de operadores do sistema.

Principais informações:

- Usuário
- Nome completo
- Senha

---

# Estrutura do Módulo de Orçamentos

O módulo de orçamentos é o mais completo do sistema e serve como referência para os demais módulos.

Durante sua inicialização são carregadas informações de:

- Clientes
- Produtos
- Orçamentos
- Itens de orçamento

Esses dados permanecem armazenados localmente durante toda a sessão para evitar consultas repetidas.

---

# Fluxo de Criação de Orçamento

1. O usuário seleciona um cliente.
2. O sistema disponibiliza os produtos ativos.
3. Os produtos são adicionados à lista local de itens.
4. O total é calculado em memória.
5. O orçamento é salvo.
6. Os itens são vinculados ao orçamento criado.
7. A listagem principal é atualizada.

Fluxo simplificado:

```text
Cliente
    ↓
Adicionar Produtos
    ↓
itensOrcamento[]
    ↓
Calcular Total
    ↓
Salvar ORCAMENTO
    ↓
Salvar ORCAMENTO_ITEM
```

---

# Relacionamentos

O sistema utiliza relacionamentos nativos do PostgreSQL e recursos relacionais do Supabase para reduzir a quantidade de consultas necessárias.

Exemplo:

```javascript
.select(`
  orcamentoid,
  clienteid,
  cliente(nome_cliente)
`)
```

Esse padrão é amplamente utilizado em todo o projeto.

---

# Estratégia de Atualização

Após operações de criação, edição ou exclusão, os registros são novamente carregados do banco.

Exemplo:

```javascript
await carregarOrcamentos();
```

Essa abordagem garante sincronização entre:

- Banco de dados
- Cache local
- Interface visual

---

# Recriação Completa do Ambiente

## 1. Criar Projeto Supabase

Criar um novo projeto através do painel do Supabase.

Durante a criação serão definidos:

- Nome do projeto
- Região
- Senha do banco PostgreSQL

---

## 2. Criar Estrutura do Banco

Executar o script SQL detalhado em Estrutura Oficial do Banco de Dados para criação das tabelas do projeto.

Estrutura obrigatória:

- CATEGORIA_PRODUTO
- PRODUTO
- CLIENTE
- ORCAMENTO
- ORCAMENTO_ITEM
- USUARIO

Todos os relacionamentos, chaves primárias e chaves estrangeiras devem ser preservados.

---

## 3. Configurar Permissões

A aplicação utiliza operações diretas através da chave pública do Supabase.

As tabelas precisam permitir:

- SELECT
- INSERT
- UPDATE
- DELETE

Caso Row Level Security (RLS) esteja habilitado, as políticas adequadas deverão ser configuradas.

---

## 4. Obter Credenciais

No painel do Supabase acessar:

```text
Project Settings → API
```

Copiar:

- Project URL
- Publishable Key (Anon Key)

---

## 5. Configurar a Aplicação

Atualizar o arquivo de configuração "supabase-config.js" com os dados do banco de dados:

```javascript
const SUPABASE_URL = "https://seu-projeto.supabase.co";

const SUPABASE_ANON_KEY = "sua-chave-publica";
```

---

## 6. Inserir Dados Iniciais

Cadastrar inicialmente:

1. Usuários
2. Categorias
3. Produtos
4. Clientes

Após isso o módulo de orçamentos estará apto para utilização.

---

## 7. Publicação

A aplicação é composta exclusivamente por arquivos estáticos.

Pode ser hospedada em:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Hospedagens tradicionais

Não existe dependência de:

- Node.js
- Express
- PHP
- Java
- APIs próprias
- Servidores de aplicação

---

# Padrão Operacional

Todos os módulos seguem o mesmo ciclo:

```text
Carregar Dados
      ↓
Armazenar em Memória
      ↓
Renderizar Interface
      ↓
Interação do Usuário
      ↓
Persistir no Supabase
      ↓
Recarregar Dados
      ↓
Atualizar Interface
```

---

# Características Técnicas

- HTML5
- CSS3
- JavaScript ES6+
- PostgreSQL
- Supabase
- Supabase JavaScript SDK
- Arquitetura modular por página
- Cache local baseado em arrays JavaScript
- Renderização manual do DOM
- CRUD direto no banco de dados
- Sem frameworks front-end
- Sem backend próprio
- Sem ORM
- Sem gerenciamento de estado externo

---

# Estrutura Oficial do Banco de Dados

A modelagem abaixo representa a estrutura utilizada pelo sistema e deve ser executada integralmente ao recriar um ambiente Supabase.

```sql
CREATE TABLE CATEGORIA_PRODUTO (
    CATEGORIAPRODUTOID SERIAL,
    DS_CATEGORIA_PRODUTO VARCHAR(50) NOT NULL,
    PRIMARY KEY (CATEGORIAPRODUTOID)
);

CREATE TABLE CLIENTE (
    CLIENTEID SERIAL,
    TIPO_CLIENTE CHAR(1) NOT NULL,
    CPF_CNPJ_CLIENTE VARCHAR(18) NOT NULL,
    NOME_CLIENTE VARCHAR(100) NOT NULL,
    PRIMARY KEY (CLIENTEID)
);

CREATE TABLE PRODUTO (
    PRODUTOID SERIAL,
    CATEGORIAPRODUTOID INTEGER NOT NULL,
    DS_PRODUTO VARCHAR(50) NOT NULL,
    OBS_PRODUTO VARCHAR(300),
    VL_VENDA_PRODUTO NUMERIC(15,2) NOT NULL,
    DT_CADASTRO_PRODUTO TIMESTAMP NOT NULL,
    STATUS_PRODUTO BOOLEAN NOT NULL,
    PRIMARY KEY (PRODUTOID),
    FOREIGN KEY (CATEGORIAPRODUTOID)
        REFERENCES CATEGORIA_PRODUTO (CATEGORIAPRODUTOID)
);

CREATE TABLE ORCAMENTO (
    ORCAMENTOID SERIAL,
    CLIENTEID INTEGER NOT NULL,
    DT_ORCAMENTO TIMESTAMP NOT NULL,
    DT_VALIDADE_ORCAMENTO TIMESTAMP NOT NULL,
    VL_TOTAL_ORCAMENTO NUMERIC(15,2) NOT NULL,
    PRIMARY KEY (ORCAMENTOID),
    FOREIGN KEY (CLIENTEID)
        REFERENCES CLIENTE (CLIENTEID)
);

CREATE TABLE ORCAMENTO_ITEM (
    ORCAMENTOID INTEGER NOT NULL,
    ORCAMENTOITEMID INTEGER NOT NULL,
    PRODUTOID INTEGER NOT NULL,
    PRODUTODESC VARCHAR(50),
    QT_PRODUTO NUMERIC(15,2) NOT NULL,
    VL_UNITARIO NUMERIC(15,2) NOT NULL,
    VL_TOTAL NUMERIC(15,2) NOT NULL,
    PRIMARY KEY (ORCAMENTOID, ORCAMENTOITEMID),
    FOREIGN KEY (ORCAMENTOID)
        REFERENCES ORCAMENTO (ORCAMENTOID),
    FOREIGN KEY (PRODUTOID)
        REFERENCES PRODUTO (PRODUTOID)
);

CREATE TABLE USUARIO (
    ID SERIAL PRIMARY KEY,
    USUARIO VARCHAR(30),
    NOME_COMPLETO VARCHAR(60),
    SENHA VARCHAR(50)
);
```

## Relacionamentos

```text
CATEGORIA_PRODUTO
        │
        ▼
     PRODUTO
        │
        ▼
 ORCAMENTO_ITEM
        ▲
        │
    ORCAMENTO
        │
        ▼
     CLIENTE

USUARIO
```

Essa estrutura é utilizada diretamente pelas consultas relacionais do Supabase presentes na aplicação. Alterações nos nomes das tabelas, colunas ou relacionamentos exigirão ajustes correspondentes no código JavaScript.

# Objetivo do Projeto

O SCP foi desenvolvido como projeto prático durante o programa de formação SABER TI da ACCION, com o objetivo de consolidar conhecimentos em desenvolvimento web, modelagem de dados e integração com banco de dados na nuvem.
