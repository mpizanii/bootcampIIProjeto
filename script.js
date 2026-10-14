const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

const form = document.getElementById("form-busca");
const campoPrato = document.getElementById("campo-prato");
const botaoBuscar = document.getElementById("botao-buscar");
const botaoAleatorio = document.getElementById("botao-aleatorio");
const statusEl = document.getElementById("status");
const listaResultadosEl = document.getElementById("lista-resultados");
const detalheEl = document.getElementById("detalhe");
const listaFavoritosEl = document.getElementById("lista-favoritos");
const statusFavoritosEl = document.getElementById("status-favoritos");

// Autenticação
const clienteSupabase = window.clienteSupabase;
let usuarioAtual = null;
let idsFavoritos = new Set();

if (!clienteSupabase && statusFavoritosEl) {
  statusFavoritosEl.textContent =
    "Favoritos indisponíveis: configuração do Supabase ausente.";
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

async function buscarPorId(id) {
  const resposta = await fetch(`${BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`);
  if (!resposta.ok) throw new Error("A API respondeu com erro");
  const dados = await resposta.json();
  return dados.meals?.[0];
}

async function carregarFavoritos() {
  if (!listaFavoritosEl || !usuarioAtual) return;
  statusFavoritosEl.textContent = "Carregando favoritos…";
  const { data, error } = await clienteSupabase
    .from("favorites")
    .select("id, meal_id, meal_name, meal_thumb")
    .eq("user_id", usuarioAtual.id)
    .order("created_at", { ascending: false });

  if (error) {
    statusFavoritosEl.textContent = "Não foi possível carregar seus favoritos.";
    console.error("Falha ao carregar favoritos:", error);
    return;
  }

  idsFavoritos = new Set(data.map((favorito) => favorito.meal_id));
  statusFavoritosEl.textContent = data.length
    ? `${data.length} receita(s) favorita(s).`
    : "Você ainda não favoritou nenhuma receita.";
  listaFavoritosEl.innerHTML = data
    .map(
      (favorito) => `
        <article class="card-favorito">
          <button type="button" class="abrir-favorito" data-meal-id="${favorito.meal_id}">
            <img src="${favorito.meal_thumb}" alt="" loading="lazy">
            <span>${favorito.meal_name}</span>
          </button>
          <button type="button" class="remover-favorito" data-meal-id="${favorito.meal_id}" aria-label="Remover ${favorito.meal_name} dos favoritos">×</button>
        </article>
      `
    )
    .join("");
}

async function alternarFavorito(receita, botao) {
  if (!usuarioAtual) {
    botao.textContent = "Faça login para favoritar";
    return;
  }

  botao.disabled = true;
  const favorito = idsFavoritos.has(receita.idMeal);
  const resultado = favorito
    ? await clienteSupabase
        .from("favorites")
        .delete()
        .eq("user_id", usuarioAtual.id)
        .eq("meal_id", receita.idMeal)
    : await clienteSupabase.from("favorites").insert({
        user_id: usuarioAtual.id,
        meal_id: receita.idMeal,
        meal_name: receita.strMeal,
        meal_thumb: receita.strMealThumb,
      });

  botao.disabled = false;
  if (resultado.error) {
    botao.textContent = "Não foi possível atualizar o favorito";
    console.error("Falha ao atualizar favorito:", resultado.error);
    return;
  }

  await carregarFavoritos();
  renderizarDetalhe(receita);
}

listaFavoritosEl?.addEventListener("click", async (evento) => {
  const botao = evento.target.closest("button[data-meal-id]");
  if (!botao) return;
  const receita = await buscarPorId(botao.dataset.mealId);
  if (!receita) return;
  if (botao.classList.contains("remover-favorito")) {
    await alternarFavorito(receita, botao);
    return;
  }
  renderizarDetalhe(receita);
});

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
        <button type="button" class="botao-favorito" id="botao-favorito">
          ${idsFavoritos.has(receita.idMeal) ? "★ Remover dos favoritos" : "☆ Adicionar aos favoritos"}
        </button>

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
  document.getElementById("botao-favorito").addEventListener("click", (evento) => {
    alternarFavorito(receita, evento.currentTarget);
  });
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

if (clienteSupabase) {
  clienteSupabase.auth.getSession().then(async ({ data, error }) => {
    if (error) {
      statusFavoritosEl.textContent = "Não foi possível verificar sua sessão.";
      return;
    }
    usuarioAtual = data.session?.user || null;
    await carregarFavoritos();
  });
}