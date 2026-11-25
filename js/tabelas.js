// 1. SELETORES DOS ELEMENTOS DO HTML
const mesa = document.querySelector(".mesa");
const btnAdicionarTabela = document.querySelector(".ad_tabelas");
const subTitulo = document.querySelector(".sub_titulo");

// Botões de Relações da barra esquerda
const btnRelacao1p1 = document.querySelector(".relacao_1p1");
const btnRelacao1pN = document.querySelector(".relacao_1pN");
const btnRelacaoNpM = document.querySelector(".relacao_NpM");

// Botões de Ações da barra esquerda
const btnSelecionar = document.querySelector(".selecionar");
const btnMover = document.querySelector(".mover");
const btnExcluirAcao = document.querySelector(".excluir");

// Paleta de cores do protótipo (Azul, Verde, Roxo, Laranja)
const CORES_TABELA = ["#1d72f3", "#10b981", "#8b5cf6", "#f59e0b"];

// Variáveis de controle de estado
let projetoAtual = null;
let modoAtual = "selecionar"; // "selecionar", "mover", "excluir", "1:1", "1:N", "N:M"
let tabelaOrigemRelacao = null;

// Variáveis para arraste (Drag & Drop)
let tabelaArrastando = null;
let dadosTabelaArrastando = null;
let offsetX = 0;
let offsetY = 0;

// Camada SVG para desenhar as linhas das relações
let svgRelacoes = null;

// 2. INICIALIZAÇÃO

// 2. INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", () => {
    const parametrosUrl = new URLSearchParams(window.location.search);
    const idDoProjeto = parametrosUrl.get("id");

    if (!idDoProjeto) {
        alert("Nenhum projeto selecionado!");
        window.location.href = "index.html";
        return;
    }

    // Busca o projeto no armazenamento
    projetoAtual = buscaID(idDoProjeto);

    if (!projetoAtual) {
        alert("Projeto não encontrado!");
        window.location.href = "index.html";
        return;
    }

    // Atualiza o subtítulo
    if (subTitulo) {
        subTitulo.textContent = `Editando projeto: ${projetoAtual.nome}`;
    }

    // Garante a existência dos dados
    if (!projetoAtual.dados) {
        projetoAtual.dados = {
            nodes: [],
            edges: []
        };
    }

    if (!Array.isArray(projetoAtual.dados.nodes)) {
        projetoAtual.dados.nodes = [];
    }

    if (!Array.isArray(projetoAtual.dados.edges)) {
        projetoAtual.dados.edges = [];
    }

    // Configuração da mesa
    if (!mesa) {
        console.error("Elemento .mesa não encontrado no HTML!");
        return;
    }

    mesa.style.position = "relative";
    mesa.style.minHeight = "calc(100vh - 80px)";
    mesa.style.minWidth = "600px";
    mesa.style.overflow = "auto";

    
    // Configura os botões da barra esquerda
    configurarBotoesBarraEsquerda();

    // Renderiza as tabelas e relações
    renderizarTudo();

    console.log("Projeto carregado:", projetoAtual);
});



// 3. CONFIGURAR BOTÕES DE RELAÇÕES E AÇÕES
function configurarBotoesBarraEsquerda() {
    if (btnSelecionar) {
        btnSelecionar.addEventListener("click", () => definirModo("selecionar", "default"));
    }
    if (btnMover) {
        btnMover.addEventListener("click", () => definirModo("mover", "grab"));
    }
    if (btnExcluirAcao) {
        btnExcluirAcao.addEventListener("click", () => definirModo("excluir", "not-allowed"));
    }

    if (btnRelacao1p1) {
        btnRelacao1p1.addEventListener("click", () => {
            definirModo("1:1", "crosshair");
            alert("Modo Relação 1:1 ativado! Clique na tabela de ORIGEM e depois na tabela de DESTINO.");
        });
    }
    if (btnRelacao1pN) {
        btnRelacao1pN.addEventListener("click", () => {
            definirModo("1:N", "crosshair");
            alert("Modo Relação 1:N ativado! Clique na tabela de ORIGEM (lado 1) e depois na de DESTINO (lado N).");
        });
    }
    if (btnRelacaoNpM) {
        btnRelacaoNpM.addEventListener("click", () => {
            definirModo("N:M", "crosshair");
            alert("Modo Relação N:M ativado! Clique na primeira tabela e depois na segunda tabela.");
        });
    }
}

function definirModo(novoModo, cursor) {
    modoAtual = novoModo;
    tabelaOrigemRelacao = null;
    mesa.style.cursor = cursor;
}

// 4. SALVAR ALTERAÇÕES NO LOCALSTORAGE
function salvarAlteracoes() {
    updateProject(projetoAtual.id, { dados: projetoAtual.dados });
}

// 5. RENDERIZAÇÃO GERAL (Tabelas + Linhas de Relação)


function renderizarTudo() {
    if (!mesa || !projetoAtual) {
        console.error("Mesa ou projeto não encontrado!");
        return;
    }

    // Limpa a mesa antes de reconstruir o diagrama
    mesa.innerHTML = "";

    // Cria a camada SVG das relações
    svgRelacoes = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svgRelacoes.style.position = "absolute";
    svgRelacoes.style.top = "0";
    svgRelacoes.style.left = "0";
    svgRelacoes.style.width = "100%";
    svgRelacoes.style.height = "100%";
    svgRelacoes.style.minWidth = "600px";
    svgRelacoes.style.minHeight = "100%";
    svgRelacoes.style.pointerEvents = "none";

    // Linhas ficam atrás das tabelas
    svgRelacoes.style.zIndex = "1";

    // Adiciona o SVG à mesa
    mesa.appendChild(svgRelacoes);

    // Renderiza as tabelas na frente das linhas
    renderizarTabelas();

    // Desenha as relações entre as tabelas
    desenharRelacoes();
}



// 6. DESENHAR TABELAS NA MESA
function renderizarTabelas() {
    const tabelas = projetoAtual.dados.nodes;

    tabelas.forEach((tabela, index) => {
        const divTabela = document.createElement("div");
        divTabela.className = "tabela_usuario tabela_card";
        divTabela.dataset.id = tabela.id;

        // Posicionamento livre na mesa
        const posX = typeof tabela.x === "number" ? tabela.x : 40 + (index % 3) * 280;
        const posY = typeof tabela.y === "number" ? tabela.y : 40 + Math.floor(index / 3) * 240;
        tabela.x = posX;
        tabela.y = posY;

        const corAtual = tabela.cor || CORES_TABELA[index % CORES_TABELA.length];
        tabela.cor = corAtual;

        divTabela.style.position = "absolute";
        divTabela.style.left = `${posX}px`;
        divTabela.style.top = `${posY}px`;
        divTabela.style.margin = "0";
        divTabela.style.minWidth = "220px";
        divTabela.style.zIndex = "5";

        // Cabeçalho com cor personalizada e botões
        const cabecalho = document.createElement("div");
        cabecalho.className = "t_tabela_usuario";
        cabecalho.style.backgroundColor = corAtual;
        cabecalho.style.cursor = "move";
        cabecalho.innerHTML = `
            <h3 title="Duplo clique para renomear">${tabela.nome}</h3>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button type="button" class="b_cor_tabela" title="Trocar cor da tabela" style="background: transparent; border: none; color: white; cursor: pointer;">
                    <i class="fa-solid fa-palette"></i>
                </button>
                <button type="button" class="b_add_atributo" title="Adicionar coluna">+</button>
                <button type="button" class="b_excluir_tabela" title="Excluir tabela">X</button>
            </div>
        `;

        cabecalho.querySelector(".b_cor_tabela").addEventListener("click", (e) => {
            e.stopPropagation();
            trocarCorTabela(tabela.id);
        });

        cabecalho.querySelector("h3").addEventListener("dblclick", () => {
            editarNomeTabela(tabela.id);
        });

        cabecalho.querySelector(".b_add_atributo").addEventListener("click", (e) => {
            e.stopPropagation();
            adicionarAtributo(tabela.id);
        });

        cabecalho.querySelector(".b_excluir_tabela").addEventListener("click", (e) => {
            e.stopPropagation();
            excluirTabela(tabela.id);
        });

        // Clique na tabela (Relação, Excluir ou Arrastar)
        divTabela.addEventListener("mousedown", (e) => {
            if (e.target.tagName === "BUTTON" || e.target.closest("button")) return;

            if (modoAtual === "1:1" || modoAtual === "1:N" || modoAtual === "N:M") {
                e.stopPropagation();
                processarCliqueRelacao(tabela.id, divTabela);
                return;
            }

            if (modoAtual === "excluir") {
                e.stopPropagation();
                excluirTabela(tabela.id);
                return;
            }

            if (e.target.closest(".t_tabela_usuario") || modoAtual === "mover") {
                tabelaArrastando = divTabela;
                dadosTabelaArrastando = tabela;

                const rectTabela = divTabela.getBoundingClientRect();
                offsetX = e.clientX - rectTabela.left;
                offsetY = e.clientY - rectTabela.top;
                divTabela.style.zIndex = "1000";
            }
        });

        // Lista de Atributos
        const listaAtributos = document.createElement("ul");
        listaAtributos.className = "dados_tab_usuario";

        const atributos = Array.isArray(tabela.atributos) ? tabela.atributos : [];
        atributos.forEach(attr => {
            const item = document.createElement("li");
            item.title = "Clique para editar ou excluir este atributo";

            const iconeChave = (attr.marcacao === "PK" || attr.marcacao === "FK")
                ? `<i class="fa-solid fa-key"></i>`
                : "";

            item.innerHTML = `
                ${iconeChave}
                <span class="nome_campo">${attr.nome}</span>
                <span class="tipo_dado">${attr.tipo}</span>
                <span class="marcacao">${attr.marcacao}</span>
            `;

            item.addEventListener("click", (e) => {
                if (modoAtual !== "selecionar") return;
                e.stopPropagation();
                gerenciarAtributo(tabela.id, attr.id);
            });

            listaAtributos.appendChild(item);
        });

        divTabela.appendChild(cabecalho);
        divTabela.appendChild(listaAtributos);
        mesa.appendChild(divTabela);
    });
}

// 7. TROCAR COR DA TABELA
function trocarCorTabela(idTabela) {
    const tabela = projetoAtual.dados.nodes.find(t => t.id === idTabela);
    if (!tabela) return;

    const indiceAtual = CORES_TABELA.indexOf(tabela.cor);
    const proximoIndice = (indiceAtual + 1) % CORES_TABELA.length;
    tabela.cor = CORES_TABELA[proximoIndice];

    salvarAlteracoes();
    renderizarTudo();
}

// 8. CRIAÇÃO DE RELAÇÕES (1:1, 1:N, N:M)
function processarCliqueRelacao(idTabela, elementoDiv) {
    if (!tabelaOrigemRelacao) {
        tabelaOrigemRelacao = idTabela;
        elementoDiv.style.outline = "3px solid #f59e0b";
    } else {
        if (tabelaOrigemRelacao === idTabela) {
            alert("Selecione uma tabela diferente para conectar!");
            return;
        }

        const novaRelacao = {
            id: "rel_" + Date.now(),
            origem: tabelaOrigemRelacao,
            destino: idTabela,
            tipo: modoAtual
        };

        projetoAtual.dados.edges.push(novaRelacao);
        salvarAlteracoes();
        definirModo("selecionar", "default");
        renderizarTudo();
    }
}

// 9. DESENHAR LINHAS LARANJAS E ETIQUETAS (1, N, M)

function desenharRelacoes() {
    if (!svgRelacoes) return;

    svgRelacoes.innerHTML = "";

    const relacoes = projetoAtual.dados.edges || [];

    // Cores dos tipos de relacionamento
    const CORES_RELACOES = {
        "1:1": "#3b82f6", // Azul
        "1:N": "#10b981", // Verde
        "N:M": "#a855f7"  // Roxo
    };

    relacoes.forEach(rel => {
        const elOrigem = mesa.querySelector(
            `[data-id="${rel.origem}"]`
        );

        const elDestino = mesa.querySelector(
            `[data-id="${rel.destino}"]`
        );

        if (!elOrigem || !elDestino) return;

        const x1 = elOrigem.offsetLeft + elOrigem.offsetWidth / 2;
        const y1 = elOrigem.offsetTop + elOrigem.offsetHeight / 2;

        const x2 = elDestino.offsetLeft + elDestino.offsetWidth / 2;
        const y2 = elDestino.offsetTop + elDestino.offsetHeight / 2;

        const meioX = (x1 + x2) / 2;

        const caminho = `
            M ${x1} ${y1}
            L ${meioX} ${y1}
            L ${meioX} ${y2}
            L ${x2} ${y2}
        `;

        const cor = CORES_RELACOES[rel.tipo] || "#f59e0b";

        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );

        path.setAttribute("d", caminho);
        path.setAttribute("stroke", cor);
        path.setAttribute("stroke-width", "3");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");

        path.style.pointerEvents = "stroke";
        path.style.cursor = "pointer";

        path.addEventListener("click", () => {
            if (
                modoAtual === "excluir" ||
                confirm(`Deseja remover esta relação (${rel.tipo})?`)
            ) {
                projetoAtual.dados.edges =
                    projetoAtual.dados.edges.filter(
                        r => r.id !== rel.id
                    );

                salvarAlteracoes();
                renderizarTudo();
            }
        });

        svgRelacoes.appendChild(path);
    });
}


// 10. MOVIMENTAÇÃO DO MOUSE
document.addEventListener("mousemove", (e) => {
    if (!tabelaArrastando || !dadosTabelaArrastando) return;

    const rectMesa = mesa.getBoundingClientRect();
    let novoX = e.clientX - rectMesa.left - offsetX + mesa.scrollLeft;
    let novoY = e.clientY - rectMesa.top - offsetY + mesa.scrollTop;

    novoX = Math.max(10, novoX);
    novoY = Math.max(10, novoY);

    tabelaArrastando.style.left = `${novoX}px`;
    tabelaArrastando.style.top = `${novoY}px`;

    dadosTabelaArrastando.x = novoX;
    dadosTabelaArrastando.y = novoY;

    desenharRelacoes();
});

document.addEventListener("mouseup", () => {
    if (tabelaArrastando) {
        tabelaArrastando.style.zIndex = "5";
        salvarAlteracoes();
        tabelaArrastando = null;
        dadosTabelaArrastando = null;
    }
});


// 11. CRIAR NOVA TABELA
if (btnAdicionarTabela) {
    btnAdicionarTabela.addEventListener("click", () => {

        // Verifica se o projeto foi carregado
        if (!projetoAtual) {
            alert("Nenhum projeto foi carregado!");
            return;
        }

        const nomeTabela = prompt(
            "Digite o nome da nova tabela (ex: clientes, pedidos):"
        );

        if (!nomeTabela || nomeTabela.trim() === "") {
            return;
        }

        const qtdAtual = projetoAtual.dados.nodes.length;

        const novaTabela = {
            id: "tab_" + Date.now(),
            nome: nomeTabela.trim(),
            cor: CORES_TABELA[qtdAtual % CORES_TABELA.length],

            x: 40 + (qtdAtual % 3) * 280,
            y: 40 + Math.floor(qtdAtual / 3) * 240,

            atributos: [
                {
                    id: "attr_" + Date.now(),
                    nome: "id",
                    tipo: "INT",
                    marcacao: "PK"
                }
            ]
        };

        // Adiciona a tabela ao projeto
        projetoAtual.dados.nodes.push(novaTabela);

        // Salva no armazenamento
        salvarAlteracoes();

        // Atualiza a mesa de edição
        renderizarTudo();

        console.log("Nova tabela criada:", novaTabela);
        console.log("Tabelas atuais:", projetoAtual.dados.nodes);
    });
} else {
    console.error("Botão .ad_tabelas não encontrado no HTML!");
}


// 13. EXCLUIR TABELA
function excluirTabela(idTabela) {
    const tabela = projetoAtual.dados.nodes.find(t => t.id === idTabela);
    if (!tabela) return;

    const confirmar = confirm(`Deseja excluir a tabela "${tabela.nome}" e todos os seus atributos?`);
    if (!confirmar) return;

    projetoAtual.dados.nodes = projetoAtual.dados.nodes.filter(t => t.id !== idTabela);
    projetoAtual.dados.edges = projetoAtual.dados.edges.filter(
        r => r.origem !== idTabela && r.destino !== idTabela
    );

    salvarAlteracoes();
    renderizarTudo();
}

// 14. ADICIONAR ATRIBUTO
function adicionarAtributo(idTabela) {
    const tabela = projetoAtual.dados.nodes.find(t => t.id === idTabela);
    if (!tabela) return;

    const nomeCampo = prompt("Nome do atributo/coluna (ex: nome, email, valor):");
    if (!nomeCampo || nomeCampo.trim() === "") return;

    const tipoDado = prompt("Tipo de dado (ex: INT, VARCHAR(100), TEXT, TIMESTAMP, DECIMAL):", "VARCHAR(100)");
    if (!tipoDado) return;

    const marcacao = prompt("Marcação opcional (digite PK, FK, UNIQUE ou deixe vazio):", "");

    const novoAtributo = {
        id: "attr_" + Date.now(),
        nome: nomeCampo.trim(),
        tipo: tipoDado.trim().toUpperCase(),
        marcacao: marcacao ? marcacao.trim().toUpperCase() : ""
    };

    if (!Array.isArray(tabela.atributos)) tabela.atributos = [];
    tabela.atributos.push(novoAtributo);
    salvarAlteracoes();
    renderizarTudo();
}

// 15. EDITAR OU EXCLUIR ATRIBUTO EXISTENTE
function gerenciarAtributo(idTabela, idAtributo) {
    const tabela = projetoAtual.dados.nodes.find(t => t.id === idTabela);
    if (!tabela) return;

    const atributo = tabela.atributos.find(a => a.id === idAtributo);
    if (!atributo) return;

    const acao = prompt(
        `Atributo: "${atributo.nome}" (${atributo.tipo})\n` +
        `Digite 1 para EDITAR ou 2 para EXCLUIR:`,
        "1"
    );

    if (acao === "1") {
        const novoNome = prompt("Novo nome do atributo:", atributo.nome);
        if (novoNome && novoNome.trim() !== "") atributo.nome = novoNome.trim();

        const novoTipo = prompt("Novo tipo de dado:", atributo.tipo);
        if (novoTipo && novoTipo.trim() !== "") atributo.tipo = novoTipo.trim().toUpperCase();

        const novaMarcacao = prompt("Nova marcação (PK, FK, UNIQUE ou vazio):", atributo.marcacao);
        if (novaMarcacao !== null) atributo.marcacao = novaMarcacao.trim().toUpperCase();

        salvarAlteracoes();
        renderizarTudo();
    } else if (acao === "2") {
        const confirmar = confirm(`Excluir o atributo "${atributo.nome}"?`);
        if (confirmar) {
            tabela.atributos = tabela.atributos.filter(a => a.id !== idAtributo);
            salvarAlteracoes();
            renderizarTudo();
        }
    }
}
