const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

const form = document.getElementById("form-busca");
const campoPrato = document.getElementById("campo-prato");
const botaoBuscar = document.getElementById("botao-buscar");
const botaoAleatorio = document.getElementById("botao-aleatorio");
const statusEl = document.getElementById("status");
const listaResultadosEl = document.getElementById("lista-resultados");
const detalheEl = document.getElementById("detalhe");

// Autenticação
const SUPABASE_URL = "https://mkvgrqpytfynaevqkhhz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rdmdycXB5dGZ5bmFldnFraGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDA2MjcsImV4cCI6MjEwNzQxNjYyN30.OkVHV7fUWf2QV0fsFzcfO5cXfZZgcz1EcEuZzHjeEzc";
const clienteSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const formAuth = document.getElementById("form-auth");
if (formAuth) {
const authEmail = document.getElementById("auth-email");
const authSenha = document.getElementById("auth-senha");
const botaoAuth = document.getElementById("botao-auth");
const botaoAlternarAuth = document.getElementById("botao-alternar-auth");
const authStatus = document.getElementById("auth-status");
const authDesconectado = document.getElementById("auth-desconectado");
const authConectado = document.getElementById("auth-conectado");
const usuarioEmail = document.getElementById("usuario-email");
const botaoSair = document.getElementById("botao-sair");
const tituloAutenticacao = document.getElementById("titulo-autenticacao");
const descricaoAutenticacao = document.getElementById("descricao-autenticacao");
let modoCadastro = false;

function exibirAuthStatus(mensagem, ehErro = false) {
  authStatus.textContent = mensagem;
  authStatus.className = `auth-status${ehErro ? " erro" : ""}`;
}

function mensagemErroAuth(erro) {
  if (erro.message.includes("Invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (erro.message.includes("User already registered")) {
    return "Este e-mail já está cadastrado.";
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}

function atualizarTelaAuth(usuario) {
  const conectado = Boolean(usuario);
  authDesconectado.hidden = conectado;
  authConectado.hidden = !conectado;
  if (usuario) usuarioEmail.textContent = usuario.email;
}

async function inicializarAuth() {
  const { data, error } = await clienteSupabase.auth.getSession();
  if (error) {
    exibirAuthStatus("Não foi possível verificar sua sessão.", true);
    return;
  }
  atualizarTelaAuth(data.session?.user);
}

botaoAlternarAuth.addEventListener("click", () => {
  modoCadastro = !modoCadastro;
  tituloAutenticacao.textContent = modoCadastro
    ? "Crie sua conta"
    : "Entre no seu caderno";
  descricaoAutenticacao.textContent = modoCadastro
    ? "Cadastre-se para acessar seus dados em qualquer dispositivo."
    : "Acesse sua conta ou crie um cadastro para continuar.";
  botaoAuth.textContent = modoCadastro ? "Cadastrar" : "Entrar";
  botaoAlternarAuth.textContent = modoCadastro
    ? "Já tenho uma conta"
    : "Ainda não tenho uma conta";
  authSenha.autocomplete = modoCadastro ? "new-password" : "current-password";
  exibirAuthStatus("");
});

formAuth.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  botaoAuth.disabled = true;
  exibirAuthStatus(modoCadastro ? "Criando sua conta…" : "Entrando…");

  const email = authEmail.value.trim();
  const senha = authSenha.value;
  const resultado = modoCadastro
    ? await clienteSupabase.auth.signUp({ email, password: senha })
    : await clienteSupabase.auth.signInWithPassword({ email, password: senha });

  botaoAuth.disabled = false;
  if (resultado.error) {
    exibirAuthStatus(mensagemErroAuth(resultado.error), true);
    return;
  }

  if (modoCadastro && !resultado.data.session) {
    exibirAuthStatus("Cadastro realizado. Verifique seu e-mail para confirmar a conta.");
    formAuth.reset();
    return;
  }

  exibirAuthStatus("Login realizado com sucesso.");
  formAuth.reset();
});

botaoSair.addEventListener("click", async () => {
  const { error } = await clienteSupabase.auth.signOut();
  if (error) {
    exibirAuthStatus("Não foi possível sair da conta.", true);
    return;
  }
  atualizarTelaAuth(null);
});

clienteSupabase.auth.onAuthStateChange((_evento, sessao) => {
  atualizarTelaAuth(sessao?.user);
});

inicializarAuth();
}

// Chamadas à API
async function buscarPorNome(termo) {
  const resposta = await fetch(
    `${BASE_URL}/search.php?s=${encodeURIComponent(termo)}`
  );
  if (!resposta.ok) throw new Error("A API respondeu com erro");
  const dados = await resposta.json();
  return dados.meals; 
}

async function buscarAleatoria() {
  const resposta = await fetch(`${BASE_URL}/random.php`);
  if (!resposta.ok) throw new Error("A API respondeu com erro");
  const dados = await resposta.json();
  return dados.meals;
}

// Renderização de elementos
function definirCarregando(carregando, mensagem = "") {
  botaoBuscar.disabled = carregando;
  botaoAleatorio.disabled = carregando;
  statusEl.className = "status";
  statusEl.textContent = mensagem;
}

function renderizarLista(receitas, idSelecionado) {
  listaResultadosEl.innerHTML = "";

  receitas.forEach((receita) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className =
      "card-resultado" + (receita.idMeal === idSelecionado ? " selecionado" : "");
    item.innerHTML = `
      <img src="${receita.strMealThumb}" alt="" loading="lazy">
      <span>
        <span class="nome">${receita.strMeal}</span><br>
        <span class="categoria">${receita.strCategory || ""}</span>
      </span>
    `;
    item.addEventListener("click", () => {
      renderizarDetalhe(receita);
      renderizarLista(receitas, receita.idMeal);
    });
    listaResultadosEl.appendChild(item);
  });
}

function extrairIngredientes(receita) {
  const ingredientes = [];
  for (let i = 1; i <= 20; i++) {
    const ingrediente = receita[`strIngredient${i}`];
    const medida = receita[`strMeasure${i}`];
    if (!ingrediente || !ingrediente.trim()) break;
    ingredientes.push({ ingrediente, medida: medida?.trim() || "" });
  }
  return ingredientes;
}

function renderizarDetalhe(receita) {
  const ingredientes = extrairIngredientes(receita);

  detalheEl.innerHTML = `
    <article class="receita">
      <img class="capa" src="${receita.strMealThumb}" alt="Foto do prato ${receita.strMeal}">
      <div class="miolo">
        <h2>${receita.strMeal}</h2>
        <div class="etiquetas">
          ${receita.strCategory ? `<span class="etiqueta">${receita.strCategory}</span>` : ""}
          ${receita.strArea ? `<span class="etiqueta origem">${receita.strArea}</span>` : ""}
        </div>

        <h3>Ingredientes</h3>
        <ul class="lista-ingredientes">
          ${ingredientes
            .map(
              (item) =>
                `<li><strong>${item.medida}</strong> ${item.ingrediente}</li>`
            )
            .join("")}
        </ul>

        <h3>Modo de preparo</h3>
        <p class="instrucoes">${receita.strInstructions || "Instruções não informadas."}</p>

        ${
          receita.strYoutube
            ? `<a class="link-youtube" href="${receita.strYoutube}" target="_blank" rel="noopener">▶ Assistir no YouTube</a>`
            : ""
        }
      </div>
    </article>
  `;
}

function mostrarMensagem(texto, ehErro = false) {
  detalheEl.innerHTML = `<p class="mensagem${ehErro ? " erro" : ""}">${texto}</p>`;
}

// Fluxos
async function executarBusca(termo) {
  definirCarregando(true, `Buscando "${termo}"…`);
  listaResultadosEl.innerHTML = "";
  mostrarMensagem("Buscando…");

  try {
    const receitas = await buscarPorNome(termo);

    if (!receitas) {
      mostrarMensagem(
        `Nenhum prato encontrado para "${termo}". Tente outro nome ou ingrediente (em inglês costuma funcionar melhor, ex: "chicken").`
      );
      definirCarregando(false, "");
      return;
    }

    renderizarLista(receitas, receitas[0].idMeal);
    renderizarDetalhe(receitas[0]);
    definirCarregando(false, `${receitas.length} resultado(s) encontrado(s).`);
  } catch (erro) {
    console.error("Falha na busca:", erro);
    mostrarMensagem(
      "Não foi possível falar com a API de receitas agora. Verifique sua conexão e tente novamente.",
      true
    );
    definirCarregando(false, "");
  }
}

async function executarAleatorio() {
  definirCarregando(true, "Sorteando um prato…");
  listaResultadosEl.innerHTML = "";
  mostrarMensagem("Sorteando…");

  try {
    const receitas = await buscarAleatoria();
    renderizarLista(receitas, receitas[0].idMeal);
    renderizarDetalhe(receitas[0]);
    definirCarregando(false, "Bom apetite!");
  } catch (erro) {
    console.error("Falha ao sortear prato:", erro);
    mostrarMensagem(
      "Não foi possível falar com a API de receitas agora. Tente novamente em instantes.",
      true
    );
    definirCarregando(false, "");
  }
}

// Dispara a busca quando o usuário envia o formulário
form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const termo = campoPrato.value.trim();
  if (!termo) return;
  executarBusca(termo);
});

botaoAleatorio.addEventListener("click", executarAleatorio);