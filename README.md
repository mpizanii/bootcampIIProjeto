# Autor
Matheus Pizani de Albuquerque - 22309128

# Descrição
Aplicação web que permite buscar pratos por nome e visualizar categoria,
origem, ingredientes com medidas e modo de preparo, consumindo dados em
tempo real de uma API pública de receitas. Também é possível sortear um
prato aleatório.

# API utilizada
- **Nome:** TheMealDB API (chave pública de teste `1`, sem cadastro)
- **Documentação:** https://www.themealdb.com/api.php
- **Endpoints consumidos:**
  - `GET https://www.themealdb.com/api/json/v1/1/search.php?s={termo}` — busca pratos por nome
  - `GET https://www.themealdb.com/api/json/v1/1/random.php` — sorteia um prato aleatório

# Funcionalidades
- Busca de pratos por nome ou ingrediente
- Lista de resultados clicável, com troca de receita em destaque sem nova requisição
- Exibição de categoria, origem, lista de ingredientes com medidas, modo de preparo e link para vídeo no YouTube (quando disponível)
- Botão "Aleatório" para sortear um prato ao acaso
- Tratamento de erros no frontend (mensagens amigáveis) quando acontece algum problema na requisição

# Como executar localmente
1. Clone o repositório: `git clone https://github.com/mpizanii/bootcampIIProjeto.git`
2. Abra o arquivo `index.html` no navegador (use a extensão Live Server do VS Code)

# Links
1. Repositorio Público: https://github.com/mpizanii/bootcampIIProjeto
2. Github Pages: https://mpizanii.github.io/bootcampIIProjeto/