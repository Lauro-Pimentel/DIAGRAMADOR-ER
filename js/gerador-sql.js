const GeradorSQL = (() => {

    // Gera o código SQL a partir dos dados do projeto.
    function gerar(projeto) {

        // Verifica se o projeto possui a estrutura esperada.
        if (!projeto || !projeto.dados || !Array.isArray(projeto.dados.nodes)) {
            throw new Error("Dados do projeto inválidos.");
        }

        const tabelas = projeto.dados.nodes;

        // Guarda os comandos SQL gerados.
        const comandos = [];

        // Percorre todas as tabelas do projeto.
        tabelas.forEach(tabela => {

            const atributos = Array.isArray(tabela.atributos)
                ? tabela.atributos
                : [];

            // Guarda as definições dos atributos da tabela.
            const definicoes = [];

            // Guarda os atributos que são chaves primárias.
            const chavesPrimarias = [];

            // Percorre os atributos da tabela.
            atributos.forEach(atributo => {

                let definicao = `${atributo.nome} ${atributo.tipo}`;

                // Verifica se o atributo é uma chave primária.
                if (atributo.marcacao === "PK") {
                    chavesPrimarias.push(atributo.nome);
                }

                // Verifica se o atributo possui restrição UNIQUE.
                if (atributo.marcacao === "UNIQUE") {
                    definicao += " UNIQUE";
                }

                definicoes.push(definicao);

            });

            // Adiciona a chave primária à definição da tabela.
            if (chavesPrimarias.length > 0) {
                definicoes.push(
                    `PRIMARY KEY (${chavesPrimarias.join(", ")})`
                );
            }

            // Monta o comando CREATE TABLE.
            const comando = `CREATE TABLE ${tabela.nome} (\n    ${
                definicoes.join(",\n    ")
            }\n);`;

            comandos.push(comando);

        });

        // Junta os comandos de todas as tabelas.
        return comandos.join("\n\n");

    }

    // Disponibiliza a função para os outros arquivos.
    return {
        gerar
    };

})();