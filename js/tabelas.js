// =========================================================
// ARQUIVO: js/tabelas.js
// Responsável: Felipe
// Depende de: js/armazenamento.js
// =========================================================

// 1. SELETORES DOS ELEMENTOS DO HTML
const mesa = document.querySelector(".mesa");
const btnAdicionarTabela = document.querySelector(".ad_tabelas");
const subTitulo = document.querySelector(".sub_titulo");

// Variável global para guardar o projeto que está aberto no momento
let projetoAtual = null;

// 2. INICIALIZAÇÃO: Pega o ID da URL e carrega o projeto
document.addEventListener("DOMContentLoaded", () => {
    const parametrosUrl = new URLSearchParams(window.location.search);
    const idDoProjeto = parametrosUrl.get("id");

    if (!idDoProjeto) {
        alert("Nenhum projeto selecionado! Voltando para a tela inicial.");
        window.location.href = "index.html";
        return;
    }

    projetoAtual = buscaID(idDoProjeto); // Função do armazenamento.js

    if (!projetoAtual) {
        alert("Projeto não encontrado!");
        window.location.href = "index.html";
        return;
    }

    // Mostra o nome do projeto no subtítulo da barra superior
    if (subTitulo) {
        subTitulo.textContent = `Editando projeto: ${projetoAtual.nome}`;
    }

    // Garante que a estrutura de tabelas (nodes) existe
    if (!projetoAtual.dados) {
        projetoAtual.dados = { nodes: [], edges: [] };
    }

    renderizarTabelas();
});

// 3. FUNÇÃO PARA SALVAR ALTERAÇÕES NO LOCALSTORAGE
function salvarAlteracoes() {
    updateProject(projetoAtual.id, { dados: projetoAtual.dados }); // Função do armazenamento.js
}

// 4. RENDERIZAÇÃO: Desenha todas as tabelas na .mesa
function renderizarTabelas() {
    // Limpa as tabelas antigas/exemplos fixos da mesa
    mesa.innerHTML = "";

    const tabelas = projetoAtual.dados.nodes;

    tabelas.forEach(tabela => {
        const divTabela = document.createElement("div");
        // Mantém uma classe padrão "tabela_card" (e você pode estilizar no CSS junto com .tabela_usuario)
        divTabela.className = "tabela_usuario tabela_card";
        divTabela.dataset.id = tabela.id;

        // Cabeçalho da tabela
        const cabecalho = document.createElement("div");
        cabecalho.className = "t_tabela_usuario";
        cabecalho.innerHTML = `
            <h3 title="Duplo clique para renomear">${tabela.nome}</h3>
            <div>
                <button type="button" class="b_add_atributo" title="Adicionar coluna">+</button>
                <button type="button" class="b_excluir_tabela" title="Excluir tabela">X</button>
            </div>
        `;

        // Evento: Renomear tabela (duplo clique no título)
        cabecalho.querySelector("h3").addEventListener("dblclick", () => {
            editarNomeTabela(tabela.id);
        });

        // Evento: Adicionar atributo (botão +)
        cabecalho.querySelector(".b_add_atributo").addEventListener("click", () => {
            adicionarAtributo(tabela.id);
        });

        // Evento: Excluir tabela (botão X)
        cabecalho.querySelector(".b_excluir_tabela").addEventListener("click", () => {
            excluirTabela(tabela.id);
        });

        // Lista de atributos (colunas)
        const listaAtributos = document.createElement("ul");
        listaAtributos.className = "dados_tab_usuario";

        tabela.atributos.forEach(attr => {
            const item = document.createElement("li");
            item.title = "Clique para editar ou excluir este atributo";

            // Ícone de chave se for PK ou FK
            const iconeChave = (attr.marcacao === "PK" || attr.marcacao === "FK")
                ? `<i class="fa-solid fa-key"></i>`
                : "";

            item.innerHTML = `
                ${iconeChave}
                <span class="nome_campo">${attr.nome}</span>
                <span class="tipo_dado">${attr.tipo}</span>
                <span class="marcacao">${attr.marcacao}</span>
            `;

            // Evento: Editar ou excluir atributo ao clicar na linha
            item.addEventListener("click", () => {
                gerenciarAtributo(tabela.id, attr.id);
            });

            listaAtributos.appendChild(item);
        });

        divTabela.appendChild(cabecalho);
        divTabela.appendChild(listaAtributos);
        mesa.appendChild(divTabela);
    });
}

// 5. CRIAR NOVA TABELA
btnAdicionarTabela.addEventListener("click", () => {
    const nomeTabela = prompt("Digite o nome da nova tabela (ex: clientes, pedidos):");
    if (!nomeTabela || nomeTabela.trim() === "") return;

    const novaTabela = {
        id: "tab_" + Date.now(),
        nome: nomeTabela.trim(),
        x: 50, // Posição inicial (útil para quem for fazer o arrastar/mover)
        y: 50,
        atributos: [
            // Toda tabela já nasce com um campo 'id' padrão para facilitar
            {
                id: "attr_" + Date.now(),
                nome: "id",
                tipo: "INT",
                marcacao: "PK"
            }
        ]
    };

    projetoAtual.dados.nodes.push(novaTabela);
    salvarAlteracoes();
    renderizarTabelas();
});

// 6. EDITAR NOME DA TABELA
function editarNomeTabela(idTabela) {
    const tabela = projetoAtual.dados.nodes.find(t => t.id === idTabela);
    if (!tabela) return;

    const novoNome = prompt("Novo nome para a tabela:", tabela.nome);
    if (!novoNome || novoNome.trim() === "") return;

    tabela.nome = novoNome.trim();
    salvarAlteracoes();
    renderizarTabelas();
}

// 7. EXCLUIR TABELA
function excluirTabela(idTabela) {
    const tabela = projetoAtual.dados.nodes.find(t => t.id === idTabela);
    if (!tabela) return;

    const confirmar = confirm(`Deseja excluir a tabela "${tabela.nome}" e todos os seus atributos?`);
    if (!confirmar) return;

    projetoAtual.dados.nodes = projetoAtual.dados.nodes.filter(t => t.id !== idTabela);
    salvarAlteracoes();
    renderizarTabelas();
}

// 8. ADICIONAR ATRIBUTO (COLUNA) NA TABELA
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

    tabela.atributos.push(novoAtributo);
    salvarAlteracoes();
    renderizarTabelas();
}

// 9. EDITAR OU EXCLUIR ATRIBUTO EXISTENTE
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
        renderizarTabelas();
    } else if (acao === "2") {
        const confirmar = confirm(`Excluir o atributo "${atributo.nome}"?`);
        if (confirmar) {
            tabela.atributos = tabela.atributos.filter(a => a.id !== idAtributo);
            salvarAlteracoes();
            renderizarTabelas();
        }
    }
}
