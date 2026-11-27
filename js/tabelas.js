// ======================================================
// 1. SELETORES DOS ELEMENTOS DO HTML
// ======================================================

const mesa = document.querySelector(".mesa");
const btnAdicionarTabela = document.querySelector(".ad_tabelas");
const subTitulo = document.querySelector(".sub_titulo");

// Botões de ações
const btnSelecionar = document.querySelector(".selecionar");
const btnMover = document.querySelector(".mover");
const btnExcluirAcao = document.querySelector(".excluir");

// Paleta de cores das tabelas
const CORES_TABELA = ["#1d72f3", "#10b981", "#8b5cf6", "#f59e0b"];


// ======================================================
// 2. VARIÁVEIS DE CONTROLE
// ======================================================

let projetoAtual = null;
let modoAtual = "selecionar";

// Variáveis para movimentação das tabelas
let tabelaArrastando = null;
let dadosTabelaArrastando = null;
let offsetX = 0;
let offsetY = 0;


// ======================================================
// 3. INICIALIZAÇÃO DO PROJETO
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const parametrosUrl = new URLSearchParams(window.location.search);
    const idDoProjeto = parametrosUrl.get("id");

    if (!idDoProjeto) {
        alert("Nenhum projeto selecionado!");
        window.location.href = "index.html";
        return;
    }

    // Busca o projeto
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

    // Verifica a mesa
    if (!mesa) {
        console.error("Elemento .mesa não encontrado no HTML!");
        return;
    }

    mesa.style.position = "relative";
    mesa.style.minHeight = "calc(100vh - 80px)";
    mesa.style.minWidth = "600px";
    mesa.style.overflow = "auto";

    // Configura os botões
    configurarBotoesBarraEsquerda();

    // Renderiza tabelas e relacionamentos
    renderizarTudo();

    console.log("Projeto carregado:", projetoAtual);
});


// ======================================================
// GERAR E BAIXAR SQL
// ======================================================

const btnGerarSQL = document.querySelector(".gerar_sql");
const campoScript = document.querySelector(".campo_script");

let ultimoSQLGerado = "";

if (btnGerarSQL && campoScript) {

    btnGerarSQL.addEventListener("click", () => {

        // Busca as tabelas do projeto atual
        const tabelas = projetoAtual.dados.nodes;

        if (tabelas.length === 0) {
            alert("Adicione pelo menos uma tabela!");
            return;
        }

        // Gera o SQL
        ultimoSQLGerado = exportarSQL(tabelas);

        // Exibe o resultado
        let resultado = campoScript.querySelector(".sql_resultado");

        if (!resultado) {
            resultado = document.createElement("pre");
            resultado.className = "sql_resultado";
            campoScript.appendChild(resultado);
        }

        resultado.textContent = ultimoSQLGerado;

        // Mostra o botão de download
        let btnBaixar = campoScript.querySelector(".botao_baixar");

        if (!btnBaixar) {

            btnBaixar = document.createElement("button");

            btnBaixar.type = "button";
            btnBaixar.className = "botao_baixar";
            btnBaixar.textContent = "Baixar SQL";

            campoScript.appendChild(btnBaixar);

            btnBaixar.addEventListener("click", () => {
                baixarSQL(ultimoSQLGerado);
            });

        }

        btnBaixar.hidden = false;

    });

}

// Configura o botão de copiar SQL
const botaoCopiar = document.querySelector(".botao_copiar");

if (botaoCopiar) {
    botaoCopiar.addEventListener("click", () => {

        if (!ultimoSQLGerado.trim()) {
            alert("Não há conteúdo SQL para copiar!");
            return;
        }

        copiarSQL(ultimoSQLGerado);

    });
}

// ======================================================
// 4. CONFIGURAR BOTÕES DA BARRA ESQUERDA
// ======================================================

function configurarBotoesBarraEsquerda() {

    if (btnSelecionar) {
        btnSelecionar.addEventListener("click", () => {
            definirModo("selecionar", "default");
        });
    }

    if (btnMover) {
        btnMover.addEventListener("click", () => {
            definirModo("mover", "grab");
        });
    }

    if (btnExcluirAcao) {
        btnExcluirAcao.addEventListener("click", () => {
            definirModo("excluir", "not-allowed");
        });
    }

    // Os botões de relacionamento são configurados
    // exclusivamente pelo módulo relacionamentos.js.
    if (typeof Relacionamentos !== "undefined") {
        Relacionamentos.configurarBotoes();
    } else {
        console.error("Módulo Relacionamentos não encontrado!");
    }
}


// ======================================================
// 5. DEFINIR MODO DE INTERAÇÃO
// ======================================================

function definirModo(novoModo, cursor) {

    modoAtual = novoModo;

    // Limpa a seleção pelo módulo de relacionamentos
    if (typeof Relacionamentos !== "undefined") {
        Relacionamentos.limparSelecao();
    }

    if (mesa) {
        mesa.style.cursor = cursor;
    }
}


// ======================================================
// 6. SALVAR ALTERAÇÕES
// ======================================================

function salvarAlteracoes() {

    if (!projetoAtual) {
        console.error("Não existe projeto para salvar!");
        return;
    }

    updateProject(projetoAtual.id, {
        dados: projetoAtual.dados
    });
}


// ======================================================
// 7. RENDERIZAÇÃO GERAL
// ======================================================

function renderizarTudo() {

    if (!mesa || !projetoAtual) {
        console.error("Mesa ou projeto não encontrado!");
        return;
    }

    if (typeof Relacionamentos === "undefined") {
        console.error("Módulo Relacionamentos não encontrado!");
        return;
    }

    // Limpa a mesa
    mesa.innerHTML = "";

    // Inicializa a camada SVG pelo módulo
    Relacionamentos.inicializarCamada();

    // Renderiza as tabelas
    renderizarTabelas();

    // Desenha os relacionamentos
    Relacionamentos.desenharRelacoes();
}


// ======================================================
// 8. RENDERIZAR TABELAS NA MESA
// ======================================================

function renderizarTabelas() {

    const tabelas = projetoAtual.dados.nodes;

    tabelas.forEach((tabela, index) => {

        const divTabela = document.createElement("div");

        divTabela.className = "tabela_usuario tabela_card";
        divTabela.dataset.id = tabela.id;

        // Posicionamento da tabela
        const posX = typeof tabela.x === "number"
            ? tabela.x
            : 40 + (index % 3) * 280;

        const posY = typeof tabela.y === "number"
            ? tabela.y
            : 40 + Math.floor(index / 3) * 240;

        tabela.x = posX;
        tabela.y = posY;

        // Cor da tabela
        const corAtual = tabela.cor ||
            CORES_TABELA[index % CORES_TABELA.length];

        tabela.cor = corAtual;

        divTabela.style.position = "absolute";
        divTabela.style.left = `${posX}px`;
        divTabela.style.top = `${posY}px`;
        divTabela.style.margin = "0";
        divTabela.style.minWidth = "220px";
        divTabela.style.zIndex = "5";


        // ----------------------------------------------
        // CABEÇALHO DA TABELA
        // ----------------------------------------------

        const cabecalho = document.createElement("div");

        cabecalho.className = "t_tabela_usuario";
        cabecalho.style.backgroundColor = corAtual;
        cabecalho.style.cursor = "move";

        cabecalho.innerHTML = `
            <h3 title="Duplo clique para renomear">${tabela.nome}</h3>

            <div style="display: flex; gap: 6px; align-items: center;">

                <button
                    type="button"
                    class="b_cor_tabela"
                    title="Trocar cor da tabela"
                    style="background: transparent; border: none; color: white; cursor: pointer;"
                >
                    <i class="fa-solid fa-palette"></i>
                </button>
                <button type="button" class="b_add_atributo" title="Adicionar coluna"><i class="fa-solid fa-circle-plus"></i></button>
                <button type="button" class="b_excluir_tabela" title="Excluir tabela">X</button>
            </div>
        `;


        // ----------------------------------------------
        // TROCAR COR DA TABELA
        // ----------------------------------------------

        cabecalho
            .querySelector(".b_cor_tabela")
            .addEventListener("click", (e) => {

                e.stopPropagation();
                trocarCorTabela(tabela.id);

            });


        // ----------------------------------------------
        // EDITAR NOME DA TABELA
        // ----------------------------------------------

        cabecalho
            .querySelector("h3")
            .addEventListener("dblclick", () => {

                editarNomeTabela(tabela.id);

            });


        // ----------------------------------------------
        // ADICIONAR ATRIBUTO
        // ----------------------------------------------

        cabecalho
            .querySelector(".b_add_atributo")
            .addEventListener("click", (e) => {

                e.stopPropagation();
                adicionarAtributo(tabela.id);

            });


        // ----------------------------------------------
        // EXCLUIR TABELA
        // ----------------------------------------------

        cabecalho
            .querySelector(".b_excluir_tabela")
            .addEventListener("click", (e) => {

                e.stopPropagation();
                excluirTabela(tabela.id);

            });


        // ----------------------------------------------
        // CLIQUE E MOVIMENTAÇÃO DA TABELA
        // ----------------------------------------------

        divTabela.addEventListener("mousedown", (e) => {

            // Ignora cliques nos botões
            if (
                e.target.tagName === "BUTTON" ||
                e.target.closest("button")
            ) {
                return;
            }

            // Modo de relacionamento
            if (
                modoAtual === "1:1" ||
                modoAtual === "1:N" ||
                modoAtual === "N:M"
            ) {

                e.stopPropagation();

                // Encaminha o clique para relacionamentos.js
                Relacionamentos.processarCliqueRelacao(
                    tabela.id,
                    divTabela
                );

                return;
            }

            // Modo de exclusão
            if (modoAtual === "excluir") {

                e.stopPropagation();
                excluirTabela(tabela.id);

                return;
            }

            // Modo de movimentação
            if (
                e.target.closest(".t_tabela_usuario") ||
                modoAtual === "mover"
            ) {

                tabelaArrastando = divTabela;
                dadosTabelaArrastando = tabela;

                const rectTabela = divTabela.getBoundingClientRect();

                offsetX = e.clientX - rectTabela.left;
                offsetY = e.clientY - rectTabela.top;

                divTabela.style.zIndex = "1000";
            }

        });


        // ----------------------------------------------
        // LISTA DE ATRIBUTOS
        // ----------------------------------------------

        const listaAtributos = document.createElement("ul");

        listaAtributos.className = "dados_tab_usuario";

        const atributos = Array.isArray(tabela.atributos)
            ? tabela.atributos
            : [];

        atributos.forEach(attr => {

            const item = document.createElement("li");

            item.title = "Clique para editar ou excluir este atributo";

            const iconeChave =
                (attr.marcacao === "PK" || attr.marcacao === "FK")
                    ? `<i class="fa-solid fa-key"></i>`
                    : "";

            item.innerHTML = `
                ${iconeChave}

                <span class="nome_campo">
                    ${attr.nome}
                </span>

                <span class="tipo_dado">
                    ${attr.tipo}
                </span>

                <span class="marcacao">
                    ${attr.marcacao}
                </span>
            `;

            // Editar ou excluir atributo
            item.addEventListener("click", (e) => {

                if (modoAtual !== "selecionar") return;

                e.stopPropagation();

                gerenciarAtributo(tabela.id, attr.id);

            });

            listaAtributos.appendChild(item);

        });


        // Adiciona elementos à tabela
        divTabela.appendChild(cabecalho);
        divTabela.appendChild(listaAtributos);

        mesa.appendChild(divTabela);

    });

}


// ======================================================
// 9. TROCAR COR DA TABELA
// ======================================================

function trocarCorTabela(idTabela) {

    const tabela = projetoAtual.dados.nodes.find(
        t => t.id === idTabela
    );

    if (!tabela) return;

    const indiceAtual = CORES_TABELA.indexOf(tabela.cor);

    const proximoIndice =
        (indiceAtual + 1) % CORES_TABELA.length;

    tabela.cor = CORES_TABELA[proximoIndice];

    salvarAlteracoes();
    renderizarTudo();
}



// ======================================================
// 10. MOVIMENTAÇÃO DO MOUSE
// ======================================================

document.addEventListener("mousemove", (e) => {

    if (!tabelaArrastando || !dadosTabelaArrastando) return;

    const rectMesa = mesa.getBoundingClientRect();

    // Calcula a nova posição da tabela
    let novoX =
        e.clientX - rectMesa.left - offsetX + mesa.scrollLeft;

    let novoY =
        e.clientY - rectMesa.top - offsetY + mesa.scrollTop;

    // Obtém as dimensões da mesa e da tabela
    const larguraMesa = mesa.clientWidth;
    const alturaMesa = mesa.clientHeight;

    const larguraTabela = tabelaArrastando.offsetWidth;
    const alturaTabela = tabelaArrastando.offsetHeight;

    // Impede que a tabela ultrapasse os limites da mesa
    novoX = Math.max(
        0,
        Math.min(novoX, larguraMesa - larguraTabela)
    );

    novoY = Math.max(
        0,
        Math.min(novoY, alturaMesa - alturaTabela)
    );

    // Atualiza a posição visual
    tabelaArrastando.style.left = `${novoX}px`;
    tabelaArrastando.style.top = `${novoY}px`;

    // Atualiza os dados da tabela
    dadosTabelaArrastando.x = novoX;
    dadosTabelaArrastando.y = novoY;

    // Atualiza as linhas pelo módulo de relacionamentos
    Relacionamentos.desenharRelacoes();

});

// ======================================================
// 11. FINALIZAR MOVIMENTAÇÃO
// ======================================================

document.addEventListener("mouseup", () => {

    if (tabelaArrastando) {

        tabelaArrastando.style.zIndex = "5";

        salvarAlteracoes();

        tabelaArrastando = null;
        dadosTabelaArrastando = null;

    }

});


// ======================================================
// 12. CRIAR NOVA TABELA
// ======================================================

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

            cor: CORES_TABELA[
                qtdAtual % CORES_TABELA.length
            ],

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

        // Atualiza a mesa
        renderizarTudo();

        console.log("Nova tabela criada:", novaTabela);
        console.log("Tabelas atuais:", projetoAtual.dados.nodes);

    });

} else {

    console.error("Botão .ad_tabelas não encontrado no HTML!");

}


// ======================================================
// 13. EXCLUIR TABELA
// ======================================================

function excluirTabela(idTabela) {

    const tabela = projetoAtual.dados.nodes.find(
        t => t.id === idTabela
    );

    if (!tabela) return;

    const confirmar = confirm(
        `Deseja excluir a tabela "${tabela.nome}" e todos os seus atributos?`
    );

    if (!confirmar) return;

    // Remove os relacionamentos associados à tabela
    // utilizando o módulo relacionamentos.js.
    Relacionamentos.removerRelacoesDaTabela(idTabela);

    // Remove a tabela do projeto
    projetoAtual.dados.nodes = projetoAtual.dados.nodes.filter(
        t => t.id !== idTabela
    );

    salvarAlteracoes();
    renderizarTudo();

}


// ======================================================
// 14. ADICIONAR ATRIBUTO
// ======================================================

function adicionarAtributo(idTabela) {

    const tabela = projetoAtual.dados.nodes.find(
        t => t.id === idTabela
    );

    if (!tabela) return;

    const nomeCampo = prompt(
        "Nome do atributo/coluna (ex: nome, email, valor):"
    );

    if (!nomeCampo || nomeCampo.trim() === "") return;

    const tipoDado = prompt(
        "Tipo de dado (ex: INT, VARCHAR(100), TEXT, TIMESTAMP, DECIMAL):",
        "VARCHAR(100)"
    );

    if (!tipoDado) return;

    const marcacao = prompt(
        "Marcação opcional (digite PK, FK, UNIQUE ou deixe vazio):",
        ""
    );

    const novoAtributo = {

        id: "attr_" + Date.now(),

        nome: nomeCampo.trim(),

        tipo: tipoDado.trim().toUpperCase(),

        marcacao: marcacao
            ? marcacao.trim().toUpperCase()
            : ""

    };

    if (!Array.isArray(tabela.atributos)) {
        tabela.atributos = [];
    }

    tabela.atributos.push(novoAtributo);

    salvarAlteracoes();
    renderizarTudo();

}


// ======================================================
// 15. EDITAR OU EXCLUIR ATRIBUTO EXISTENTE
// ======================================================

function gerenciarAtributo(idTabela, idAtributo) {

    const tabela = projetoAtual.dados.nodes.find(
        t => t.id === idTabela
    );

    if (!tabela) return;

    const atributo = tabela.atributos.find(
        a => a.id === idAtributo
    );

    if (!atributo) return;

    const acao = prompt(

        `Atributo: "${atributo.nome}" (${atributo.tipo})\n` +
        `Digite 1 para EDITAR ou 2 para EXCLUIR:`,

        "1"

    );


    // ----------------------------------------------
    // EDITAR ATRIBUTO
    // ----------------------------------------------

    if (acao === "1") {

        const novoNome = prompt(
            "Novo nome do atributo:",
            atributo.nome
        );

        if (novoNome && novoNome.trim() !== "") {
            atributo.nome = novoNome.trim();
        }

        const novoTipo = prompt(
            "Novo tipo de dado:",
            atributo.tipo
        );

        if (novoTipo && novoTipo.trim() !== "") {
            atributo.tipo = novoTipo.trim().toUpperCase();
        }

        const novaMarcacao = prompt(
            "Nova marcação (PK, FK, UNIQUE ou vazio):",
            atributo.marcacao
        );

        if (novaMarcacao !== null) {
            atributo.marcacao = novaMarcacao.trim().toUpperCase();
        }

        salvarAlteracoes();
        renderizarTudo();

    }


    // ----------------------------------------------
    // EXCLUIR ATRIBUTO
    // ----------------------------------------------

    else if (acao === "2") {

        const confirmar = confirm(
            `Excluir o atributo "${atributo.nome}"?`
        );

        if (confirmar) {

            tabela.atributos = tabela.atributos.filter(
                a => a.id !== idAtributo
            );

            salvarAlteracoes();
            renderizarTudo();

        }

    }

}