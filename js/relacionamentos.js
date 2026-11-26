
/*
 * Módulo de Relacionamentos
 * Responsável por criar, desenhar e remover conexões entre tabelas.
 *
 * Dependências disponibilizadas por tabelas.js:
 * - mesa
 * - projetoAtual
 * - modoAtual
 * - definirModo()
 * - salvarAlteracoes()
 * - renderizarTudo()
 */

const Relacionamentos = (() => {
    // Estado interno do módulo.
    let tabelaOrigemRelacao = null;
    let svgRelacoes = null;

    const CORES_RELACOES = {
        "1:1": "#3b82f6",
        "1:N": "#10b981",
        "N:M": "#a855f7"
    };

    const SVG_NS = "http://www.w3.org/2000/svg";

    // Configura os botões de relacionamento.
    function configurarBotoes() {
        const btnRelacao1p1 = document.querySelector(".relacao_1p1");
        const btnRelacao1pN = document.querySelector(".relacao_1pN");
        const btnRelacaoNpM = document.querySelector(".relacao_NpM");

        if (btnRelacao1p1) {
            btnRelacao1p1.addEventListener("click", () => {
                limparSelecao();
                definirModo("1:1", "crosshair");
                alert("Modo Relação 1:1 ativado! Clique na tabela de ORIGEM e depois na tabela de DESTINO.");
            });
        }

        if (btnRelacao1pN) {
            btnRelacao1pN.addEventListener("click", () => {
                limparSelecao();
                definirModo("1:N", "crosshair");
                alert("Modo Relação 1:N ativado! Clique na tabela de ORIGEM (lado 1) e depois na de DESTINO (lado N).");
            });
        }

        if (btnRelacaoNpM) {
            btnRelacaoNpM.addEventListener("click", () => {
                limparSelecao();
                definirModo("N:M", "crosshair");
                alert("Modo Relação N:M ativado! Clique na primeira tabela e depois na segunda tabela.");
            });
        }
    }

    // Inicializa a camada SVG.
    function inicializarCamada() {
        if (!mesa) {
            console.error("Elemento .mesa não encontrado.");
            return;
        }

        svgRelacoes = document.createElementNS(SVG_NS, "svg");
        svgRelacoes.style.position = "absolute";
        svgRelacoes.style.top = "0";
        svgRelacoes.style.left = "0";
        svgRelacoes.style.width = "100%";
        svgRelacoes.style.height = "100%";
        svgRelacoes.style.minWidth = "600px";
        svgRelacoes.style.minHeight = "100%";
        svgRelacoes.style.pointerEvents = "none";
        svgRelacoes.style.zIndex = "1";

        mesa.appendChild(svgRelacoes);
    }

    // Limpa a seleção da primeira tabela.
    function limparSelecao() {
        if (tabelaOrigemRelacao && mesa) {
            const tabelaSelecionada = mesa.querySelector(
                `[data-id="${tabelaOrigemRelacao}"]`
            );

            if (tabelaSelecionada) {
                tabelaSelecionada.style.outline = "";
            }
        }

        tabelaOrigemRelacao = null;
    }

    // Processa os cliques e cria o relacionamento.
    function processarCliqueRelacao(idTabela, elementoDiv) {
        if (!projetoAtual || !projetoAtual.dados) return;

        if (!Array.isArray(projetoAtual.dados.edges)) {
            projetoAtual.dados.edges = [];
        }

        if (!tabelaOrigemRelacao) {
            tabelaOrigemRelacao = idTabela;
            elementoDiv.style.outline = "3px solid #f59e0b";
            return;
        }

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

        limparSelecao();
        definirModo("selecionar", "default");
        renderizarTudo();
    }

    // Desenha novamente todas as relações.
    function desenharRelacoes() {
        if (!svgRelacoes || !projetoAtual || !projetoAtual.dados) return;

        svgRelacoes.innerHTML = "";

        const relacoes = Array.isArray(projetoAtual.dados.edges)
            ? projetoAtual.dados.edges
            : [];

        relacoes.forEach(rel => {
            const elOrigem = mesa.querySelector(`[data-id="${rel.origem}"]`);
            const elDestino = mesa.querySelector(`[data-id="${rel.destino}"]`);

            if (!elOrigem || !elDestino) return;

            const x1 = elOrigem.offsetLeft + elOrigem.offsetWidth / 2;
            const y1 = elOrigem.offsetTop + elOrigem.offsetHeight / 2;
            const x2 = elDestino.offsetLeft + elDestino.offsetWidth / 2;
            const y2 = elDestino.offsetTop + elDestino.offsetHeight / 2;

            const meioX = (x1 + x2) / 2;

            const caminho = `M ${x1} ${y1} L ${meioX} ${y1} L ${meioX} ${y2} L ${x2} ${y2}`;
            const cor = CORES_RELACOES[rel.tipo] || "#f59e0b";

            const path = document.createElementNS(SVG_NS, "path");

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
                    projetoAtual.dados.edges = projetoAtual.dados.edges.filter(
                        relacionamento => relacionamento.id !== rel.id
                    );

                    salvarAlteracoes();
                    renderizarTudo();
                }
            });

            svgRelacoes.appendChild(path);
        });
    }

    // Remove as relações associadas a uma tabela.
    function removerRelacoesDaTabela(idTabela) {
        if (!projetoAtual || !projetoAtual.dados) return;

        const relacoes = Array.isArray(projetoAtual.dados.edges)
            ? projetoAtual.dados.edges
            : [];

        projetoAtual.dados.edges = relacoes.filter(
            rel => rel.origem !== idTabela && rel.destino !== idTabela
        );
    }

    return {
        configurarBotoes,
        inicializarCamada,
        limparSelecao,
        processarCliqueRelacao,
        desenharRelacoes,
        removerRelacoesDaTabela
    };
})();
