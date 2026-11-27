// © 2026 | Todos os direitos reservados — Lauro Pimentel (@Lauro-Pimentel), Felipe de Oliveira Santos (@Gunter357) e Gabessx (@Gabessx).

// ======================================================
// 1. SELETORES DOS ELEMENTOS DO HTML
// ======================================================

const formPesquisa = document.querySelector(".barra_pesquisa");
const inputPesquisa = document.getElementById("pesquisa_projetos");
const btnCriarProjeto = document.getElementById("criar_projeto");
const btnUpload = document.getElementById("botao_upload");
const inputArquivo = document.getElementById("arquivo_projeto");
const galeria = document.querySelector(".galeria_projetos");


// ======================================================
// 2. INICIALIZAÇÃO DOS PROJETOS
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    if (!galeria) {
        console.error("Galeria de projetos não encontrada!");
        return;
    }

    const projetosSalvos = buscarProjetos();

    mostrarProjetosNaTela(projetosSalvos);

});


// ======================================================
// 3. RENDERIZAÇÃO DOS PROJETOS NA TELA
// ======================================================

function mostrarProjetosNaTela(listaDeProjetos) {

    if (!galeria) return;

    // Limpa os cards antigos, mantendo o botão de criar projeto
    const cardsAntigos = galeria.querySelectorAll(".projeto_feito");

    cardsAntigos.forEach(card => card.remove());

    listaDeProjetos.forEach(projeto => {

        // Formata a data para o padrão brasileiro
        const dataFormatada = projeto.dataModificacao
            ? new Date(projeto.dataModificacao).toLocaleDateString("pt-BR")
            : "Hoje";

        const card = document.createElement("article");

        card.className = "projeto_feito";

        card.innerHTML = `
            <div class="previsualizacao_projeto">
                <img
                    src="${gerarPreviewProjeto(projeto)}"
                    alt="Pré-visualização do diagrama do projeto ${projeto.nome}"
                >
            </div>

            <div class="informacoes_projeto">

                <h3>${projeto.nome}</h3>

                <div class="informacoes_finais">

                    <p>
                        <i class="fa-regular fa-clock" aria-hidden="true"></i>
                        Última modificação:
                        <time datetime="${projeto.dataModificacao || ""}">
                            ${dataFormatada}
                        </time>
                    </p>

                    <button
                        type="button"
                        class="btn-excluir"
                        title="Excluir projeto"
                        aria-label="Excluir projeto"
                    >
                        <i class="fa-solid fa-trash" aria-hidden="true" style="color: white;"></i>
                    </button>

                </div>

            </div>
        `;

        // Clique no card para abrir ou excluir o projeto
        card.addEventListener("click", (evento) => {

            // Verifica se o clique foi no botão de excluir
            if (evento.target.closest(".btn-excluir")) {

                const confirmar = confirm(
                    `Tem certeza que deseja excluir o projeto "${projeto.nome}"?`
                );

                if (confirmar) {

                    apagarProjeto(projeto.id);

                    mostrarProjetosNaTela(buscarProjetos());

                }

                return;
            }

            // Abre o projeto
            abrir_projeto(projeto.id);

        });

        galeria.appendChild(card);

    });

}


// ======================================================
// 4. ESCAPAR TEXTOS PARA UTILIZAÇÃO DENTRO DO SVG
// ======================================================

function escaparTextoSVG(texto) {

    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

}


// ======================================================
// 5. GERAR A PRÉ-VISUALIZAÇÃO DO DIAGRAMA
// ======================================================

function gerarPreviewProjeto(projeto) {

    const tabelas = projeto.dados?.nodes || [];
    const relacoes = projeto.dados?.edges || [];

    const largura = 600;
    const altura = 260;

    // Caso o projeto ainda não tenha tabelas
    if (tabelas.length === 0) {

        const svgVazio = `
            <svg xmlns="http://www.w3.org/2000/svg"
                 width="${largura}" height="${altura}"
                 viewBox="0 0 ${largura} ${altura}">

                <rect width="100%" height="100%" rx="12"
                      fill="#062650"/>

                <text x="300" y="125"
                      fill="#B9D0F2"
                      font-size="20"
                      text-anchor="middle">
                    Projeto vazio
                </text>

            </svg>
        `;

        return "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(svgVazio);
    }

    // Calcula o espaço ocupado pelas tabelas
    const posicoes = tabelas.map(tabela => {

        const x = Number(tabela.x) || 0;
        const y = Number(tabela.y) || 0;

        const alturaTabela = 44 +
            (Array.isArray(tabela.atributos)
                ? tabela.atributos.length * 20
                : 0);

        return {
            tabela,
            x,
            y,
            largura: 180,
            altura: alturaTabela
        };

    });

    const menorX = Math.min(...posicoes.map(p => p.x));
    const menorY = Math.min(...posicoes.map(p => p.y));

    const maiorX = Math.max(...posicoes.map(p => p.x + p.largura));
    const maiorY = Math.max(...posicoes.map(p => p.y + p.altura));

    const larguraDiagrama = maiorX - menorX;
    const alturaDiagrama = maiorY - menorY;

    // Calcula a escala para caber na miniatura
    const escala = Math.min(
        540 / larguraDiagrama,
        200 / alturaDiagrama,
        1
    );

    const deslocamentoX =
        (largura - larguraDiagrama * escala) / 2;

    const deslocamentoY =
        (altura - alturaDiagrama * escala) / 2;

    // Guarda as posições ajustadas das tabelas
    const posicoesAjustadas = {};

    posicoes.forEach(posicao => {

        posicoesAjustadas[posicao.tabela.id] = {

            x: deslocamentoX +
                (posicao.x - menorX) * escala,

            y: deslocamentoY +
                (posicao.y - menorY) * escala,

            largura: posicao.largura * escala,
            altura: posicao.altura * escala

        };

    });

    // Desenha os relacionamentos
    let desenhosRelacoes = "";

    relacoes.forEach(relacao => {

        const origem = posicoesAjustadas[relacao.origem];
        const destino = posicoesAjustadas[relacao.destino];

        if (!origem || !destino) return;

        const x1 = origem.x + origem.largura / 2;
        const y1 = origem.y + origem.altura / 2;

        const x2 = destino.x + destino.largura / 2;
        const y2 = destino.y + destino.altura / 2;

        const cor = {
            "1:1": "#3b82f6",
            "1:N": "#10b981",
            "N:M": "#a855f7"
        }[relacao.tipo] || "#f59e0b";

        desenhosRelacoes += `
            <line
                x1="${x1}" y1="${y1}"
                x2="${x2}" y2="${y2}"
                stroke="${cor}"
                stroke-width="2"
            />
        `;

    });

    // Desenha as tabelas
    let desenhosTabelas = "";

    posicoes.forEach(posicao => {

        const tabela = posicao.tabela;
        const ajustada = posicoesAjustadas[tabela.id];

        const cor = tabela.cor || "#2678FF";

        desenhosTabelas += `
            <g>

                <rect
                    x="${ajustada.x}"
                    y="${ajustada.y}"
                    width="${ajustada.largura}"
                    height="${ajustada.altura}"
                    rx="5"
                    fill="#062650"
                    stroke="${escaparTextoSVG(cor)}"
                    stroke-width="2"
                />

                <rect
                    x="${ajustada.x}"
                    y="${ajustada.y}"
                    width="${ajustada.largura}"
                    height="${25 * escala}"
                    rx="4"
                    fill="${escaparTextoSVG(cor)}"
                />

                <text
                    x="${ajustada.x + ajustada.largura / 2}"
                    y="${ajustada.y + 17 * escala}"
                    fill="#FFFFFF"
                    font-size="${12 * escala}"
                    text-anchor="middle"
                    font-weight="bold"
                >
                    ${escaparTextoSVG(tabela.nome)}
                </text>

                ${(tabela.atributos || []).slice(0, 5).map((atributo, i) => `
                    <text
                        x="${ajustada.x + 7 * escala}"
                        y="${ajustada.y + (42 + i * 20) * escala}"
                        fill="#B9D0F2"
                        font-size="${10 * escala}"
                    >
                        ${escaparTextoSVG(atributo.nome)}
                    </text>
                `).join("")}

            </g>
        `;

    });

    // Monta o SVG completo
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="${largura}" height="${altura}"
             viewBox="0 0 ${largura} ${altura}">

            <rect
                width="100%"
                height="100%"
                rx="12"
                fill="#031D3B"
            />

            ${desenhosRelacoes}
            ${desenhosTabelas}

        </svg>
    `;

    // Converte o SVG para uma imagem que o navegador consegue exibir
    return "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg);

}


// ======================================================
// 6. CRIAR NOVO PROJETO
// ======================================================

if (btnCriarProjeto) {

    btnCriarProjeto.addEventListener("click", () => {

        const nome_projeto = prompt(
            "Digite o nome do novo projeto:"
        );

        // Cancela se o usuário clicar em Cancelar ou deixar vazio
        if (!nome_projeto || nome_projeto.trim() === "") return;

        // Cria e salva o projeto
        const novo_projeto = criarProjeto(nome_projeto.trim());

        // Abre o projeto criado
        abrir_projeto(novo_projeto.id);

    });

}


// ======================================================
// 7. PESQUISA DE PROJETOS
// ======================================================

// Evita que a página recarregue ao apertar Enter
if (formPesquisa) {

    formPesquisa.addEventListener("submit", (evento) => {

        evento.preventDefault();

    });

}

// Pesquisa por nome ou data
if (inputPesquisa) {

    inputPesquisa.addEventListener("input", (evento) => {

        const termo = evento.target.value.toLowerCase().trim();

        const todosProjetos = buscarProjetos();

        const projetosFiltrados = todosProjetos.filter(projeto => {

            const dataFormatada = projeto.dataModificacao
                ? new Date(projeto.dataModificacao).toLocaleDateString("pt-BR")
                : "";

            return projeto.nome.toLowerCase().includes(termo) ||
                dataFormatada.includes(termo);

        });

        mostrarProjetosNaTela(projetosFiltrados);

    });

}


// ======================================================
// 8. ABRIR PROJETO
// ======================================================

function abrir_projeto(idDoProjeto) {

    const projetoEncontrado = buscaID(idDoProjeto);

    if (projetoEncontrado) {

        window.location.href =
            `editor.html?id=${projetoEncontrado.id}`;

    } else {

        alert("Erro: Não foi possível encontrar este projeto.");

    }

}


// ======================================================
// 9. UPLOAD / IMPORTAÇÃO DE PROJETO (.JSON)
// ======================================================

if (btnUpload && inputArquivo) {

    btnUpload.addEventListener("click", () => {

        inputArquivo.click();

    });

    inputArquivo.addEventListener("change", (evento) => {

        const arquivo = evento.target.files[0];

        if (!arquivo) return;

        const leitor = new FileReader();

        leitor.onload = (e) => {

            try {

                const projetoImportado = JSON.parse(e.target.result);

                // Validação básica do projeto
                if (!projetoImportado.nome || !projetoImportado.dados) {

                    throw new Error("Formato de projeto inválido.");

                }

                // Gera um novo ID e atualiza a data
                projetoImportado.id = "proj_" + Date.now();

                projetoImportado.dataModificacao =
                    new Date().toISOString();

                const projetos = buscarProjetos();

                projetos.push(projetoImportado);

                saveTabela(projetos);

                mostrarProjetosNaTela(buscarProjetos());

                alert(
                    `Projeto "${projetoImportado.nome}" importado com sucesso!`
                );

            } catch (erro) {

                console.error("Erro ao importar projeto:", erro);

                alert(
                    "Erro ao importar: verifique se o arquivo .json é um diagrama válido."
                );

            } finally {

                // Permite importar o mesmo arquivo novamente
                inputArquivo.value = "";

            }

        };

        leitor.readAsText(arquivo);

    });

}