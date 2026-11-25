// Dados mockados (só em memória: recarregar a página volta ao original)
let livros = [
  { id: 1, titulo: "Dom Casmurro", autor: "Machado de Assis", local: "Estante 12, prateleira B", status: "Disponível", rara: false },
  { id: 2, titulo: "Memórias Póstumas de Brás Cubas", autor: "Machado de Assis", local: "Estante 12, prateleira B", status: "Disponível", rara: false },
  { id: 3, titulo: "Vidas Secas", autor: "Graciliano Ramos", local: "Estante 11, prateleira B", status: "Disponível", rara: false },
  { id: 4, titulo: "São Bernardo", autor: "Graciliano Ramos", local: "Estante 11, prateleira C", status: "Emprestado", rara: false },
  { id: 5, titulo: "Grande Sertão: Veredas", autor: "João Guimarães Rosa", local: "Estante 12, prateleira A", status: "Emprestado", rara: false },
  { id: 6, titulo: "Capitães da Areia", autor: "Jorge Amado", local: "Estante 11, prateleira A", status: "Disponível", rara: false },
  { id: 7, titulo: "A Hora da Estrela", autor: "Clarice Lispector", local: "Estante 11, prateleira C", status: "Perdido", rara: false },
  { id: 8, titulo: "Antologia Poética", autor: "Carlos Drummond de Andrade", local: "Estante 8, prateleira A", status: "Disponível", rara: false },
  { id: 9, titulo: "O Pequeno Príncipe", autor: "Antoine de Saint-Exupéry", local: "Estante 3, prateleira A", status: "Disponível", rara: false },
  { id: 10, titulo: "Reinações de Narizinho", autor: "Monteiro Lobato", local: "Estante 3, prateleira B", status: "Disponível", rara: true },
  { id: 11, titulo: "1984", autor: "George Orwell", local: "Estante 16, prateleira B", status: "Emprestado", rara: false },
  { id: 12, titulo: "Crime e Castigo", autor: "Fiódor Dostoiévski", local: "Estante 17, prateleira A", status: "Perdido", rara: false },
  { id: 13, titulo: "Os Sertões", autor: "Euclides da Cunha", local: "Estante 14, prateleira D", status: "Disponível", rara: true }
];

let proximoId = 14;
let idEdicao = null;

const $ = (id) => document.getElementById(id);
const limpar = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9 ]/g, " ").replace(/(\d)([a-z])/g, "$1 $2");

// Busca rápida: número = estante, letra sozinha = prateleira ("11 B", "11b", "estante 11 prateleira b").
function filtrar(termo) {
  const palavras = limpar(termo).split(" ").filter(Boolean);
  return livros.filter((l) => {
    const texto = limpar(`${l.titulo} ${l.autor} ${l.local}`);
    const [, estante, prateleira] = limpar(l.local).match(/(\d+)\D*\b([a-z])\s*$/) || [];
    return palavras.every((p) =>
      /^\d+$/.test(p) ? p === estante || texto.split(" ").includes(p)
      : p.length === 1 ? p === prateleira
      : texto.includes(p));
  });
}

function ficha(l, comAcoes) {
  const acoes = comAcoes ? `
    <div>
      <button class="btn-dourado" onclick="editar(${l.id})">Editar</button>
      ${l.status === "Perdido"
        ? `<button class="btn-verde" onclick="mudarStatus(${l.id}, 'Disponível')">Marcar Encontrado</button>`
        : `<button class="btn-bordo" onclick="mudarStatus(${l.id}, 'Perdido')">Marcar Perdido</button>`}
      <button class="btn-bordo" onclick="excluir(${l.id})">Excluir</button>
    </div>` : "";

  return `
    <div class="cartao ${l.rara ? "rara" : ""}">
      <strong>${l.titulo}</strong>${l.rara ? " · obra rara" : ""}<br>
      Autor: ${l.autor}<br>
      Localização: <strong>${l.local}</strong><br>
      Status: <span class="status ${l.status}">${l.status}</span>
      ${acoes}
    </div>`;
}

function lista(termo, comAcoes) {
  const achados = filtrar(termo);
  return achados.length ? achados.map((l) => ficha(l, comAcoes)).join("") : `<p><em>Não encontramos esse livro. Tente outro termo.</em></p>`;
}

function desenhar(msg) {
  const achados = filtrar($("busca-leitor").value);
  $("aviso-leitor").innerText = achados.length === 1
    ? `Encontramos seu livro: ${achados[0].local}`
    : achados.length ? `Encontramos ${achados.length} livros.` : "";
  $("lista-leitor").innerHTML = lista($("busca-leitor").value, false);
  $("lista-bibliotecario").innerHTML = lista($("busca-bibliotecario").value, true);
  $("total-perdidos").innerText = livros.filter((l) => l.status === "Perdido").length;
  $("aviso").innerText = msg || "";
}

function mostrarAba(nome) {
  $("tela-leitor").hidden = nome !== "leitor";
  $("tela-bibliotecario").hidden = nome === "leitor";
  $("aba-leitor").classList.toggle("ativa", nome === "leitor");
  $("aba-bibliotecario").classList.toggle("ativa", nome !== "leitor");
}

function salvarLivro() {
  const dados = {
    titulo: $("titulo").value.trim(),
    autor: $("autor").value.trim(),
    local: $("local").value.trim(),
    status: $("status").value,
    rara: $("rara").checked
  };
  if (!dados.titulo || !dados.autor || !dados.local) return desenhar("Preencha título, autor e localização.");

  if (idEdicao) {
    Object.assign(livros.find((l) => l.id === idEdicao), dados);
    limparForm();
    desenhar("Livro atualizado.");
  } else {
    livros.push({ id: proximoId++, ...dados });
    limparForm();
    desenhar("Livro cadastrado.");
  }
}

function editar(id) {
  const l = livros.find((l) => l.id === id);
  $("titulo").value = l.titulo;
  $("autor").value = l.autor;
  $("local").value = l.local;
  $("status").value = l.status;
  $("rara").checked = l.rara;
  idEdicao = id;
  $("btn-salvar").innerText = "Atualizar Livro";
  $("btn-cancelar").hidden = false;
  $("titulo").focus();
}

function limparForm() {
  ["titulo", "autor", "local"].forEach((c) => ($(c).value = ""));
  $("status").value = "Disponível";
  $("rara").checked = false;
  idEdicao = null;
  $("btn-salvar").innerText = "Salvar Livro";
  $("btn-cancelar").hidden = true;
}

function mudarStatus(id, status) {
  livros.find((l) => l.id === id).status = status;
  desenhar();
}

function excluir(id) {
  const l = livros.find((l) => l.id === id);
  if (!confirm(`Remover "${l.titulo}" do catálogo?`)) return;
  livros = livros.filter((x) => x.id !== id);
  if (idEdicao === id) limparForm();
  desenhar(`"${l.titulo}" removido.`);
}

desenhar();