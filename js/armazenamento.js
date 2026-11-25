// GERENCIADOR DE ARMAZENAMENTO DE DIAGRAMAS
const nome_armazenamento = "meus_diagramas";

// 1. RECUPERAÇÃO DE PROJETOS
function buscarProjetos() {
    const informacoes = localStorage.getItem(nome_armazenamento);
    return informacoes ? JSON.parse(informacoes) : []; // Corrigido de projetoRecuperado para informacoes
}

// 2. SALVAMENTO DE PROJETOS
function saveTabela(projetos) {
    localStorage.setItem(nome_armazenamento, JSON.stringify(projetos));
}

// 3. CRIAÇÃO DE PROJETOS
function criarProjeto(nomeDoProjeto) {
    const projetos = buscarProjetos();

    const novoProjeto = {
        id: 'proj_' + Date.now(),
        nome: nomeDoProjeto,
        dataCriacao: new Date().toISOString(),
        dataModificacao: new Date().toISOString(),
        preview: null,
        dados: { nodes: [], edges: [] } 
    };

    projetos.push(novoProjeto);
    saveTabela(projetos);

    return novoProjeto;
}

// 4. BUSCA POR ID
function buscaID(idDoProjeto) {
    const projetos = buscarProjetos();
    const projetoEncontrado = projetos.find(p => p.id === idDoProjeto);

    if (!projetoEncontrado) {
        console.warn(`Projeto com o ID ${idDoProjeto} não foi encontrado.`);
        return null;
    }

    return projetoEncontrado;
}

// 5. ATUALIZAÇÃO DE PROJETO 
function updateProject(idDoProjeto, novosDados) {
    const projetos = buscarProjetos(); // Corrigido de getProjects para buscarProjetos
    const index = projetos.findIndex(p => p.id === idDoProjeto);

    if (index === -1) {
        console.warn(`Projeto ${idDoProjeto} não encontrado para atualização.`);
        return false;
    }

    projetos[index] = {
        ...projetos[index],
        ...novosDados,
        dataModificacao: new Date().toISOString()
    };

    saveTabela(projetos);
    return projetos[index];
}

// 6. EXCLUSÃO DE PROJETO 
function apagarProjeto(idDoProjeto) {
    const projetos = buscarProjetos();
    const projetosFiltrados = projetos.filter(p => p.id !== idDoProjeto);

    if (projetos.length === projetosFiltrados.length) {
        console.warn(`Projeto ${idDoProjeto} não encontrado para exclusão.`);
        return false;
    }

    saveTabela(projetosFiltrados); // Corrigido de saveTable para saveTabela
    return true;
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Gerenciador de Diagramas carregado com sucesso!!!");
});