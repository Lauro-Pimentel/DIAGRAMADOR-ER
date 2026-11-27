// © 2026 | Todos os direitos reservados — Lauro Pimentel (@Lauro-Pimentel), Felipe de Oliveira Santos (@Gunter357) e Gabessx (@Gabessx).

function exportarJSON(dados) {
    // Converte os dados do projeto para JSON
    const dadosConvertidos = JSON.stringify(dados);

    // Cria o arquivo JSON
    const arquivoJSON = new Blob([dadosConvertidos], {
        type: "application/json"
    });

    // Cria uma URL temporária para o arquivo
    const url = URL.createObjectURL(arquivoJSON);

    // Cria o link para baixar o arquivo
    const link = document.createElement("a");
    link.href = url;
    link.download = "Projeto.json";
    document.body.appendChild(link);

    // Inicia o download
    link.click();

    // Remove o link e libera a URL temporária
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Gera o código SQL a partir das tabelas

function exportarSQL(tabelas) {

    let sql = "";

    tabelas.forEach(tabela => {

        sql += `CREATE TABLE ${tabela.nome} (\n`;

        const definicoes = [];
        const chavesPrimarias = [];

        tabela.atributos.forEach(atributo => {

            let coluna = `${atributo.nome} ${atributo.tipo}`;

            if (atributo.marcacao === "PK") {
                chavesPrimarias.push(atributo.nome);
            }

            if (atributo.marcacao === "UNIQUE") {
                coluna += " UNIQUE";
            }

            definicoes.push(coluna);

        });

        if (chavesPrimarias.length > 0) {
            definicoes.push(
                `PRIMARY KEY (${chavesPrimarias.join(", ")})`
            );
        }

        sql += "    " + definicoes.join(",\n    ");

        sql += "\n);\n\n";

    });

    return sql;
}

// Cria e baixa o arquivo SQL

function baixarSQL(sql) {

    const arquivo = new Blob([sql], {
        type: "text/sql;charset=utf-8"
    });

    const url = URL.createObjectURL(arquivo);

    const link = document.createElement("a");

    link.href = url;
    link.download = "diagrama.sql";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);

}


// Copia o código SQL para a área de transferência
async function copiarSQL(sql) {
    try {
        await navigator.clipboard.writeText(sql);
        alert("Conteúdo copiado com sucesso!");

    } catch (erro) {
        console.log("Erro ao copiar SQL:", erro);
        alert("Não foi possível copiar o conteúdo.");
    }
}

// Gera o SQL e realiza a cópia
const codigo = exportarSQL(tabelas);
copiarSQL(codigo);

// Importa e valida um arquivo JSON
function importarJSON(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();

        // Executa quando a leitura termina
        leitor.onload = function() {
            console.log(leitor.result);

            try {
                // Converte o conteúdo JSON para objeto JavaScript
                const dados = JSON.parse(leitor.result);

                // Verifica se o conteúdo é um objeto válido
                if (dados === null || typeof dados !== "object" || Array.isArray(dados)) {
                    reject("Arquivo não representa um projeto válido!");
                    return;
                }

                console.log("Arquivo representa um objeto válido!");

                // Verifica se todas as propriedades obrigatórias existem
                if (!dados.id || !dados.nome || !dados.dataCriacao || !dados.dataModificacao || !dados.dados) {
                    reject("Projeto inválido!");
                    return;
                }

                console.log("Projeto válido!");

                // Entrega os dados importados
                resolve(dados);

            } catch (erro) {
                reject("Arquivo JSON inválido: " + erro.message);
            }
        };

        // Executa quando ocorre uma falha na leitura
        leitor.onerror = function() {
            reject("Erro ao ler o arquivo!");
        };

        // Inicia a leitura do arquivo
        leitor.readAsText(arquivo);
    });
}

// Recebe o resultado da importação ou trata o erro
importarJSON(arquivo)
    .then(dados => {
        console.log("Projeto recebido:", dados);
    })
    .catch(erro => {
        console.log("Erro na importação:", erro);
    });