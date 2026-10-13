(function () {
  const SUPABASE_URL = "https://mkvgrqpytfynaevqkhhz.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rdmdycXB5dGZ5bmFldnFraGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDA2MjcsImV4cCI6MjEwNzQxNjYyN30.OkVHV7fUWf2QV0fsFzcfO5cXfZZgcz1EcEuZzHjeEzc";
  const clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const formAuth = document.getElementById("form-auth");

  if (formAuth) {

  const authEmail = document.getElementById("auth-email");
  const authSenha = document.getElementById("auth-senha");
  const botaoAuth = document.getElementById("botao-auth");
  const botaoAlternarAuth = document.getElementById("botao-alternar-auth");
  const authStatus = document.getElementById("auth-status");
  const tituloAutenticacao = document.getElementById("titulo-autenticacao");
  const descricaoAutenticacao = document.getElementById("descricao-autenticacao");
  let modoCadastro = false;

  function exibirAuthStatus(mensagem, ehErro) {
    authStatus.textContent = mensagem;
    authStatus.className = `auth-status${ehErro ? " erro" : ""}`;
  }

  function mensagemErroAuth(erro) {
    if (erro.message.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
    if (erro.message.includes("User already registered")) return "Este e-mail já está cadastrado.";
    return "Não foi possível concluir a operação. Tente novamente.";
  }

  botaoAlternarAuth.addEventListener("click", function () {
    modoCadastro = !modoCadastro;
    tituloAutenticacao.textContent = modoCadastro ? "Crie sua conta" : "Entre no seu caderno";
    descricaoAutenticacao.textContent = modoCadastro
      ? "Cadastre-se para acessar seus dados em qualquer dispositivo."
      : "Acesse sua conta ou crie um cadastro para continuar.";
    botaoAuth.textContent = modoCadastro ? "Cadastrar" : "Entrar";
    botaoAlternarAuth.textContent = modoCadastro ? "Já tenho uma conta" : "Ainda não tenho uma conta";
    authSenha.autocomplete = modoCadastro ? "new-password" : "current-password";
    exibirAuthStatus("");
  });

  formAuth.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    botaoAuth.disabled = true;
    exibirAuthStatus(modoCadastro ? "Criando sua conta…" : "Entrando…");
    const resultado = modoCadastro
      ? await clienteSupabase.auth.signUp({ email: authEmail.value.trim(), password: authSenha.value })
      : await clienteSupabase.auth.signInWithPassword({ email: authEmail.value.trim(), password: authSenha.value });
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
    window.location.href = "app.html";
  });

  clienteSupabase.auth.getSession().then(function (resultado) {
    if (resultado.data.session) window.location.href = "app.html";
  });
} else {
  clienteSupabase.auth.getSession().then(function (resultado) {
    if (resultado.error || !resultado.data.session) window.location.href = "auth.html";
  });
  const botaoSair = document.getElementById("botao-sair");
  if (botaoSair) {
    botaoSair.addEventListener("click", async function () {
      const resultado = await clienteSupabase.auth.signOut();
      if (!resultado.error) window.location.href = "auth.html";
    });
  }
  }
  }());
