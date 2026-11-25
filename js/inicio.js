const formPesquisa = document.querySelector(".barra_pesquisa");
const inputPesquisa = document.getElementById("pesquisa_projetos");
const btnCriarProjeto = document.getElementById("criar_projeto");
const btnUpload = document.getElementById("botao_upload");
const inputArquivo = document.getElementById("arquivo_projeto");
const galeria = document.querySelector(".galeria_projetos");

// INICIALIZAÇÃO: Carrega os projetos salvos assim que a tela abre
document.addEventListener("DOMContentLoaded", () => {
    const projetosSalvos = buscarProjetos(); // Função do armazenamento.js
    mostrarProjetosNaTela(projetosSalvos);
});

// RENDERIZAÇÃO: Desenha os cards dos projetos na galeria
function mostrarProjetosNaTela(listaDeProjetos) {
    // Limpa os cards fixos do HTML, mantendo apenas o botão "+ Criar novo projeto"
    const cardsAntigos = galeria.querySelectorAll(".projeto_feito");
    cardsAntigos.forEach(card => card.remove());

    listaDeProjetos.forEach(projeto => {
        // Converte a data ISO salva para o formato brasileiro (DD/MM/AAAA)
        const dataFormatada = projeto.dataModificacao 
            ? new Date(projeto.dataModificacao).toLocaleDateString("pt-BR") 
            : "Hoje";

        const card = document.createElement("article");
        card.className = "projeto_feito";

        card.innerHTML = `
            <div class="previsualizacao_projeto">
                <img 
                    src="${projeto.preview || 'img/teste11.png'}" 
                    alt="Pré-visualização do diagrama do projeto ${projeto.nome}"
                >
            </div>
            <div class="informacoes_projeto">
                <h3>${projeto.nome}</h3>
                <div class="informacoes_finais">
                    <p>
                        <i class="fa-regular fa-clock" aria-hidden="true"></i>
                        Última modificação:
                        <time datetime="${projeto.dataModificacao}">${dataFormatada}</time>
                    </p>
                    <button type="button" class="btn-excluir" title="Excluir projeto" aria-label="Excluir projeto">
                        <i class="fa-solid fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `;

        // Clique no card (para abrir ou excluir)
        card.addEventListener("click", (evento) => {
            // Verifica se o clique foi no botão da lixeira
            if (evento.target.closest(".btn-excluir")) {
                const confirmar = confirm(`Tem certeza que deseja excluir o projeto "${projeto.nome}"?`);
                if (confirmar) {
                    apagarProjeto(projeto.id); // Função do armazenamento.js
                    mostrarProjetosNaTela(buscarProjetos()); // Atualiza a galeria
                }
                return;
            }

            // Se clicou no restante do card, abre o projeto
            abrir_projeto(projeto.id);
        });

        galeria.appendChild(card);
    });
}

// CRIAR NOVO PROJETO
btnCriarProjeto.addEventListener("click", () => {
    const nome_projeto = prompt("Digite o nome do novo projeto:");

    // Cancela se o usuário clicar em Cancelar ou deixar vazio
    if (!nome_projeto || nome_projeto.trim() === "") return;

    // Usa a função do armazenamento.js para criar e salvar no localStorage
    const novo_projeto = criarProjeto(nome_projeto.trim());

    // Redireciona para a tela de edição já com o novo projeto aberto
    abrir_projeto(novo_projeto.id);
});

// PESQUISA DE PROJETOS (por nome ou data)
// Evita que a página recarregue se o usuário apertar Enter na barra de busca
formPesquisa.addEventListener("submit", (evento) => {
    evento.preventDefault();
});

inputPesquisa.addEventListener("input", (evento) => {
    const termo = evento.target.value.toLowerCase().trim();
    const todosProjetos = buscarProjetos();

    const projetosFiltrados = todosProjetos.filter(projeto => {
        const dataFormatada = projeto.dataModificacao 
            ? new Date(projeto.dataModificacao).toLocaleDateString("pt-BR") 
            : "";

        return projeto.nome.toLowerCase().includes(termo) || dataFormatada.includes(termo);
    });

    mostrarProjetosNaTela(projetosFiltrados);
});

// ABRIR PROJETO
function abrir_projeto(idDoProjeto) {
    const projetoEncontrado = buscaID(idDoProjeto); // Função do armazenamento.js

    if (projetoEncontrado) {
        // IMPORTANTE: Troque "editor.html" abaixo pelo nome exato do arquivo HTML da tela de tabelas
        window.location.href = `editor.html?id=${projetoEncontrado.id}`;
    } else {
        alert("Erro: Não foi possível encontrar este projeto.");
    }
}

// UPLOAD / IMPORTAÇÃO DE PROJETO (.JSON)
btnUpload.addEventListener("click", () => {
    inputArquivo.click();
});

inputArquivo.addEventListener("change", (evento) => {
    const arquivo = evento.target.files[0]; // Pega o primeiro arquivo selecionado
    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onload = (e) => {
        try {
            const projetoImportado = JSON.parse(e.target.result);

            // Validação básica para garantir que é um projeto válido
            if (!projetoImportado.nome || !projetoImportado.dados) {
                throw new Error("Formato de projeto inválido.");
            }

            // Gera um ID único e atualiza a data para não conflitar com projetos existentes
            projetoImportado.id = 'proj_' + Date.now();
            projetoImportado.dataModificacao = new Date().toISOString();

            const projetos = buscarProjetos();
            projetos.push(projetoImportado);
            saveTabela(projetos); // Função do armazenamento.js

            mostrarProjetosNaTela(buscarProjetos());
            alert(`Projeto "${projetoImportado.nome}" importado com sucesso!`);
        } catch (erro) {
            alert("Erro ao importar: verifique se o arquivo .json é um diagrama válido.");
        } finally {
            // Limpa o input para permitir importar o mesmo arquivo novamente se precisar
            inputArquivo.value = "";
        }
    };

    leitor.readAsText(arquivo);
});
