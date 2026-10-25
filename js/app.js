// ===== 1) DADOS =====
// MUDANÇA: cada bairro agora tem lat/lng (mapa real) em vez de "pontos" (SVG)
const bairros = [
  { nome: "Centro",       mil: 28, lat: -25.0950, lng: -50.1620 },
  { nome: "Oficinas",     mil: 32, lat: -25.1080, lng: -50.1700 },
  { nome: "Uvaranas",     mil: 45, lat: -25.0960, lng: -50.1130 },
  { nome: "Nova Rússia",  mil: 22, lat: -25.0800, lng: -50.1900 },
  { nome: "Órfãs",        mil: 26, lat: -25.0780, lng: -50.1450 },
  { nome: "Jd. Carvalho", mil: 20, lat: -25.1230, lng: -50.1850 },
  { nome: "Contorno",     mil: 18, lat: -25.1130, lng: -50.1450 },
  { nome: "Boa Vista",    mil: 15, lat: -25.0680, lng: -50.1700 }
];

// MUDANÇA: nichos generalizados (a ordem dos números segue a ordem dos bairros acima)
const negocios = {
  "Gastronomia":       { ideal: 2500, concorrentes: [30, 22, 24, 9, 10, 8, 6, 5],
    palavras: ["gastronom", "restaurante", "cafe", "padaria", "lanchonete", "pizza"] },
  "Imobiliário":       { ideal: 6000, concorrentes: [8, 5, 4, 1, 2, 1, 2, 1],
    palavras: ["imobiliaria", "imovel", "imoveis", "apartamento", "aluguel"] },
  "Academias e bem-estar": { ideal: 5000, concorrentes: [9, 7, 8, 3, 4, 3, 2, 2],
    palavras: ["academia", "treino", "fitness", "pilates"] },
  "Saúde e hospitais": { ideal: 4000, concorrentes: [12, 6, 7, 2, 3, 2, 2, 1],
    palavras: ["hospital", "clinica", "saude", "farmacia", "dentista"] }
};


// ===== 2) ESTADO (o que está selecionado agora) =====
let negocioAtual = "Gastronomia";
let bairroSelecionado = -1;   // -1 = nenhum



// ===== 3) FUNÇÕES AUXILIARES =====
function pegar(id) {
  return document.getElementById(id);
}

// MUDANÇA: o mapa Leaflet pinta com hexadecimal (não aceita var(--alto))
function corHex(pontos) {
  if (pontos >= 70) return "#1FAA6D";
  if (pontos >= 45) return "#FF9F43";
  return "#E11D48";
}

// (a função centro(i) foi apagada: o mapa real não precisa dela)



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



// ===== 5) MAPA REAL (Leaflet) =====
// Criado UMA vez só: centro em Ponta Grossa, zoom 12
const mapaLeaflet = L.map("mapa").setView([-25.095, -50.145], 12);

// Camada visual do mapa (as "fotos" das ruas)
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap"
}).addTo(mapaLeaflet);

// Camada onde ficam os círculos dos bairros (limpamos e redesenhamos)
const camada = L.layerGroup().addTo(mapaLeaflet);

function desenharMapa() {
  const dados = calcular();
  camada.clearLayers();   // apaga os círculos antigos

  bairros.forEach(function (b, i) {
    const selecionado = (i === bairroSelecionado);

    L.circle([b.lat, b.lng], {
      radius: 900,                                   // raio em metros
      color: selecionado ? "#24101A" : "#fff",       // borda
      weight: selecionado ? 4 : 2,
      fillColor: corHex(dados[i].pontos),            // cor pela pontuação
      fillOpacity: 0.6
    })
    .bindTooltip("<b>" + b.nome + "</b><br>" + dados[i].pontos,
                 { permanent: true, direction: "center", className: "rotulo-mapa" })
    .on("click", function () {
      bairroSelecionado = i;
      atualizarTudo();
    })
    .addTo(camada);
  });

  if (bairroSelecionado >= 0) {
    const b = bairros[bairroSelecionado];
    mapaLeaflet.panTo([b.lat, b.lng]);               // centraliza no bairro escolhido
  }
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
    conselho = `O melhor bairro para este setor é ${melhor.nome} (${melhor.pontos}).`;
  }

  const palavra = (x.conc === 1) ? "concorrente" : "concorrentes";
  // MUDANÇA: "para o setor de ..."
  return `${x.nome} está ${rotulo(x.pontos)} para o setor de ${negocioAtual.toLowerCase()}. Pontuação ${x.pontos}. Há ${x.conc} ${palavra} para ${formatar(x.moradores / 1000)} mil moradores. ${conselho}`;
}

// ===== 7) DESENHO DOS BOTÕES, NÚMEROS E RANKING =====
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
    pegar("kpis").innerHTML = '<p class="an-vazio">Toque em um bairro do mapa para ver os números dele.</p>';
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

// NOVO: painel "Exemplo de análise" (usa os dados reais do setor selecionado)
function nivelDaNota(pontos) {
  if (pontos >= 70) return "Alta oportunidade";
  if (pontos >= 45) return "Equilibrado";
  return "Saturado";
}

function desenharAnalise() {
  const ordem = calcular().slice().sort(function (a, b) {
    return b.pontos - a.pontos;                  // do maior para o menor
  });
  const topo = ordem[0];
  const cor = corHex(topo.pontos);
  const ideal = negocios[negocioAtual].ideal;

  // título, nota e anel
  pegar("an-setor").textContent = negocioAtual.toLowerCase();
  pegar("an-nota").textContent = topo.pontos;
  pegar("an-anel").style.background =
    `conic-gradient(${cor} ${topo.pontos}%, rgba(255,255,255,0.15) 0)`;

  // nome, veredito e frase em linguagem simples
  pegar("an-bairro").textContent = topo.nome;
  const nivel = pegar("an-nivel");
  nivel.textContent = nivelDaNota(topo.pontos);
  nivel.style.background = cor;
  pegar("an-frase").textContent =
    `${formatar(topo.moradores / 1000)} mil moradores para ${topo.conc} concorrentes.`;

  // números principais
  const itens = [
    ["Concorrentes", topo.conc],
    ["Moradores", formatar(topo.moradores / 1000) + " mil"],
    ["Mínimo saudável", formatar(ideal)]
  ];
  let stats = "";
  for (const [nome, valor] of itens) {
    stats += `<div class="col-4"><div class="kpi"><span>${nome}</span><b>${valor}</b></div></div>`;
  }
  pegar("an-stats").innerHTML = stats;

  // barra: quanto maior que a marca branca, melhor
  const razao = topo.habPorConc / ideal;                    // 1 = exatamente o ideal
  const largura = Math.min(razao / 1.5, 1) * 100;           // a marca fica em 66,7%
  pegar("an-barra-fill").style.width = largura + "%";
  pegar("an-barra-fill").style.background = cor;
  pegar("an-barra-valor").textContent =
    `${formatar(topo.habPorConc)} (mínimo ${formatar(ideal)})`;

  // ranking top 3
  let html = "";
  ordem.slice(0, 3).forEach(function (x, i) {
    html += `<li><span>${i + 1}. ${x.nome}</span><b style="color:${corHex(x.pontos)}">${x.pontos}</b></li>`;
  });
  pegar("ranking").innerHTML = html;
}

function atualizarTudo() {
  desenharTipos();
  desenharMapa();
  desenharKpis();
  desenharAnalise();   // NOVO
  if (bairroSelecionado >= 0) {
    pegar("resposta").textContent = textoResposta(bairroSelecionado);
  }
}

// ===== 8) CLIQUES =====
// MUDANÇA: o clique no bairro agora é tratado dentro do Leaflet (.on("click")),
// então aqui sobrou só o clique nos botões de setor.
document.addEventListener("click", function (evento) {
  const botaoTipo = evento.target.closest("[data-tipo]");

  if (botaoTipo) {
    negocioAtual = botaoTipo.dataset.tipo;
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
    aviso = `Não identifiquei o setor, então usei “${negocioAtual}”. `;
  }

  bairroSelecionado = (bairroAchado >= 0) ? bairroAchado : indiceMelhor();
  atualizarTudo();
  pegar("resposta").textContent = aviso + textoResposta(bairroSelecionado);
}

// ===== 10) EXEMPLOS CLICÁVEIS =====
// MUDANÇA: só 3, genéricos (cada um tem uma palavra-chave dos setores)
const exemplos = [
  "Onde abrir um restaurante?",
  "Vale abrir uma imobiliária em Uvaranas?",
  "Qual bairro precisa de uma clínica?"
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