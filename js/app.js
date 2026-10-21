// ===== 1) DADOS =====
const bairros = [
  { nome: "Centro",       mil: 28, pontos: "250,150 340,140 370,210 320,260 240,250 220,200" },
  { nome: "Oficinas",     mil: 32, pontos: "120,190 220,200 240,250 210,320 110,300 80,240" },
  { nome: "Uvaranas",     mil: 45, pontos: "370,210 470,190 540,260 520,350 400,340 320,260" },
  { nome: "Nova Rússia",  mil: 22, pontos: "130,70 230,60 250,150 220,200 120,190 90,120" },
  { nome: "Órfãs",        mil: 26, pontos: "340,140 430,70 520,100 510,170 470,190 370,210" },
  { nome: "Jd. Carvalho", mil: 20, pontos: "80,240 110,300 90,370 40,330 40,270" },
  { nome: "Contorno",     mil: 18, pontos: "210,320 240,250 320,260 400,340 360,390 240,385" },
  { nome: "Boa Vista",    mil: 15, pontos: "230,60 330,40 430,70 340,140 250,150" }
];

const negocios = {
  "padaria":    { ideal: 2500,  concorrentes: [14, 11, 12, 5, 6, 6, 4, 3], palavras: ["padaria", "pao"] },
  "lavanderia": { ideal: 12000, concorrentes: [3, 2, 2, 0, 1, 1, 0, 0],    palavras: ["lavanderia", "lavar"] },
  "academia":   { ideal: 5000,  concorrentes: [9, 7, 8, 3, 4, 3, 2, 2],    palavras: ["academia", "treino"] },
  "pet shop":   { ideal: 4000,  concorrentes: [7, 6, 9, 3, 4, 3, 2, 1],    palavras: ["pet", "animal", "cachorro"] },
  "cafeteria":  { ideal: 5000,  concorrentes: [12, 4, 5, 2, 3, 2, 1, 1],   palavras: ["cafe", "cafeteria"] }
};


// ===== 2) ESTADO (o que está selecionado agora) =====
let negocioAtual = "cafeteria";
let bairroSelecionado = -1;   // -1 = nenhum



// ===== 3) FUNÇÕES AUXILIARES =====
function pegar(id) {
  return document.getElementById(id);
}

function corDoBairro(pontos) {
  if (pontos >= 70) return "var(--alto)";
  if (pontos >= 45) return "var(--medio)";
  return "var(--baixo)";
}

function centro(i) {
  const pares = bairros[i].pontos.split(" ");
  let somaX = 0;
  let somaY = 0;
  for (const par of pares) {
    const [x, y] = par.split(",").map(Number);
    somaX += x;
    somaY += y;
  }
  return [somaX / pares.length, somaY / pares.length];
}



// ===== 4) CÁLCULO DA PONTUAÇÃO =====
function calcular() {
  const lista = [];
  for (let i = 0; i < bairros.length; i++) {
    const moradores = bairros[i].mil * 1000;
    const conc = negocios[negocioAtual].concorrentes[i];
    const habPorConc = moradores / Math.max(conc, 0.5);
    let pontos = Math.round(habPorConc / negocios[negocioAtual].ideal * 55);
    pontos = Math.max(5, Math.min(98, pontos));
    lista.push({ nome: bairros[i].nome, moradores: moradores, conc: conc, habPorConc: habPorConc, pontos: pontos });
  }
  return lista;
}



// ===== 5) DESENHO DO MAPA =====
function desenharMapa() {
  const dados = calcular();
  let html = "";
  for (let i = 0; i < bairros.length; i++) {
    const [cx, cy] = centro(i);
    const sel = (i === bairroSelecionado) ? "selecionado" : "";
    html += `<polygon class="bairro ${sel}" data-i="${i}" points="${bairros[i].pontos}" style="fill:${corDoBairro(dados[i].pontos)}"></polygon>`;
    html += `<text x="${cx}" y="${cy}" class="rotulo">${bairros[i].nome}</text>`;
    html += `<text x="${cx}" y="${cy + 16}" class="rotulo-nota">${dados[i].pontos}</text>`;
  }
  pegar("mapa").innerHTML = html + '<g id="pulsos"></g>';
}


// ===== 6) TEXTOS E RESPOSTA =====
function formatar(numero) {
  return Math.round(numero).toLocaleString("pt-BR");
}

function rotulo(pontos) {
  if (pontos >= 70) return "com espaço para crescer";
  if (pontos >= 45) return "equilibrado";
  return "saturado";
}

function indiceMelhor() {
  const lista = calcular();
  let melhor = 0;
  for (let i = 1; i < lista.length; i++) {
    if (lista[i].pontos > lista[melhor].pontos) {
      melhor = i;
    }
  }
  return melhor;
}

function textoResposta(i) {
  const lista = calcular();
  const x = lista[i];
  const melhor = lista[indiceMelhor()];
  let conselho = "";

  if (x.pontos >= 70) {
    conselho = "Vale visitar pontos comerciais na região.";
  } else if (x.pontos >= 45) {
    conselho = "Você precisa de um diferencial para se destacar.";
  } else {
    conselho = `O melhor bairro para este negócio é ${melhor.nome} (${melhor.pontos}).`;
  }

  const palavra = (x.conc === 1) ? "concorrente" : "concorrentes";
  return `${x.nome} está ${rotulo(x.pontos)} para ${negocioAtual}. Pontuação ${x.pontos}. Há ${x.conc} ${palavra} para ${formatar(x.moradores / 1000)} mil moradores. ${conselho}`;
}

// ===== 7) DESENHO DOS BOTÕES E NÚMEROS =====
function desenharTipos() {
  let html = "";
  for (const nome in negocios) {
    const ativo = (nome === negocioAtual) ? "ativo" : "";
    html += `<button type="button" class="chip ${ativo}" data-tipo="${nome}">${nome}</button>`;
  }
  pegar("tipos").innerHTML = html;
}

function desenharKpis() {
  if (bairroSelecionado < 0) {
    pegar("kpis").innerHTML = "";
    return;
  }
  const x = calcular()[bairroSelecionado];
  const itens = [
    ["Moradores (est.)", formatar(x.moradores)],
    ["Concorrentes", x.conc],
    ["Hab. por concorrente", x.conc ? formatar(x.habPorConc) : "nenhum"],
    ["Referência saudável", formatar(negocios[negocioAtual].ideal)]
  ];
  let html = "";
  for (const [nome, valor] of itens) {
    html += `<div class="col-6"><div class="kpi"><span>${nome}</span><b>${valor}</b></div></div>`;
  }
  pegar("kpis").innerHTML = html;
}

function atualizarTudo() {
  desenharTipos();
  desenharMapa();
  desenharKpis();
  if (bairroSelecionado >= 0) {
    pegar("resposta").textContent = textoResposta(bairroSelecionado);
  }
}

// ===== 8) CLIQUES =====
document.addEventListener("click", function (evento) {
  const botaoTipo = evento.target.closest("[data-tipo]");
  const poligono = evento.target.closest("[data-i]");

  if (botaoTipo) {
    negocioAtual = botaoTipo.dataset.tipo;
    atualizarTudo();
  }
  if (poligono) {
    bairroSelecionado = Number(poligono.dataset.i);
    atualizarTudo();
  }
});

// ===== 9) PERGUNTA EM LINGUAGEM NATURAL =====
function normalizar(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function perguntar(texto) {
  if (texto.trim() === "") return;

  const palavrasDoTexto = normalizar(texto).split(/\W+/);
  const textoLimpo = normalizar(texto);
  let tipoAchado = null;
  let bairroAchado = -1;

  for (const nome in negocios) {
    for (const palavra of negocios[nome].palavras) {
      for (const p of palavrasDoTexto) {
        if (p.startsWith(palavra)) {
          tipoAchado = nome;
        }
      }
    }
  }

  for (let i = 0; i < bairros.length; i++) {
    const nomeBairro = normalizar(bairros[i].nome).replace("jd. ", "");
    if (textoLimpo.includes(nomeBairro)) {
      bairroAchado = i;
    }
  }

  let aviso = "";
  if (tipoAchado !== null) {
    negocioAtual = tipoAchado;
  } else {
    aviso = `Não identifiquei o tipo de negócio, então usei “${negocioAtual}”. `;
  }

  bairroSelecionado = (bairroAchado >= 0) ? bairroAchado : indiceMelhor();
  atualizarTudo();
  pegar("resposta").textContent = aviso + textoResposta(bairroSelecionado);
}

// ===== 10) EXEMPLOS CLICÁVEIS =====
const exemplos = [
  "Onde abrir uma cafeteria?",
  "Vale abrir uma academia em Uvaranas?",
  "Qual bairro está saturado de padarias?",
  "Preciso de uma lavanderia no Centro"
];

function desenharExemplos() {
  let html = "";
  for (const texto of exemplos) {
    html += `<button type="button" class="chip chip-escuro" data-pergunta="${texto}">${texto}</button>`;
  }
  pegar("exemplos").innerHTML = html;
}

document.addEventListener("click", function (evento) {
  const exemplo = evento.target.closest("[data-pergunta]");
  if (exemplo) {
    pegar("pergunta").value = exemplo.dataset.pergunta;
    perguntar(exemplo.dataset.pergunta);
  }
});

pegar("btn-perguntar").addEventListener("click", function () {
  perguntar(pegar("pergunta").value);
});

pegar("pergunta").addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") {
    perguntar(pegar("pergunta").value);
  }
});


// ===== INICIALIZAÇÃO (sempre no FIM do arquivo) =====
desenharExemplos();
atualizarTudo();
