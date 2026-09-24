$(document).ready(function () {
    const CHAVE_STORAGE = "cadastroPessoas";
    let pessoas = [];
    let editandoCodigo = null;

    carregarDados();

    function carregarDados() {
        const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);

        if (dadosSalvos) {
            try {
                pessoas = JSON.parse(dadosSalvos);
                atualizarTabela();
                limparFormulario();
                return;
            } catch (erro) {
                console.error("Erro ao ler JSON do LocalStorage:", erro);
                localStorage.removeItem(CHAVE_STORAGE);
            }
        }

        $.ajax({
            url: "dados.xml",
            dataType: "xml",
            success: function (xml) {
                pessoas = [];

                $(xml).find("pessoa").each(function () {
                    pessoas.push({
                        codigo: $(this).find("codigo").text(),
                        nome: $(this).find("nome").text(),
                        telefone: $(this).find("telefone").text(),
                        email: $(this).find("email").text()
                    });
                });

                salvarNoLocalStorage();
                atualizarTabela();
                limparFormulario();
            },
            error: function () {
                pessoas = [];
                atualizarTabela();
                mostrarMensagem(
                    "erro"
                );
            }
        });
    }

    function salvarNoLocalStorage() {
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(pessoas));
    }

    $("#btnSalvar").click(function () {
        const nome = $("#nome").val().trim();
        const telefone = $("#telefone").val().trim();
        const email = $("#email").val().trim();

        if (nome === "" || telefone === "" || email === "") {
            mostrarMensagem("Preencha todos os campos.", "erro");
            return;
        }

        if (!validarEmail(email)) {
            mostrarMensagem("Digite um email válido.", "erro");
            return;
        }

        if (editandoCodigo !== null) {
            const pessoa = pessoas.find(function (p) {
                return p.codigo === editandoCodigo;
            });

            if (pessoa) {
                pessoa.nome = nome;
                pessoa.telefone = telefone;
                pessoa.email = email;

                salvarNoLocalStorage();
                atualizarTabela();
                limparFormulario();
                mostrarMensagem("Cadastro atualizado!", "sucesso");
            }

            return;
        }

        const novaPessoa = {
            codigo: gerarCodigo(),
            nome: nome,
            telefone: telefone,
            email: email
        };

        pessoas.push(novaPessoa);
        salvarNoLocalStorage();
        atualizarTabela();
        limparFormulario();

        mostrarMensagem("Cadastro salvo!", "sucesso");
    });

    $(document).on("click", ".editar", function () {
        const codigo = $(this).data("codigo");

        const pessoa = pessoas.find(function (p) {
            return p.codigo === codigo;
        });

        if (!pessoa) {
            return;
        }

        editandoCodigo = codigo;

        $("#codigo").val(pessoa.codigo);
        $("#nome").val(pessoa.nome);
        $("#telefone").val(pessoa.telefone);
        $("#email").val(pessoa.email);

        $("#btnSalvar").text("Atualizar");
        $("#btnCancelar").removeClass("hidden");
        mostrarMensagem("Editando cadastro...", "sucesso");
    });

    $(document).on("click", ".excluir", function () {
        const codigo = $(this).data("codigo");

        const pessoa = pessoas.find(function (p) {
            return p.codigo === codigo;
        });

        if (!pessoa) {
            return;
        }

        if (!confirm("Deseja excluir o cadastro de " + pessoa.nome + "?")) {
            return;
        }

        pessoas = pessoas.filter(function (p) {
            return p.codigo !== codigo;
        });

        salvarNoLocalStorage();
        atualizarTabela();

        if (editandoCodigo === codigo) {
            limparFormulario();
        }

        mostrarMensagem("Cadastro excluído!", "sucesso");
    });

    $("#btnCancelar").click(function () {
        limparFormulario();
        mostrarMensagem("", "");
    });

    function atualizarTabela() {
        const tabela = $("#tabelaPessoas");
        tabela.empty();

        if (pessoas.length === 0) {
            $("#vazio").show();
            return;
        }

        $("#vazio").hide();

        pessoas.forEach(function (pessoa) {
            const linha = `
                <tr>
                    <td>${escaparHTML(pessoa.codigo)}</td>
                    <td>${escaparHTML(pessoa.nome)}</td>
                    <td>${escaparHTML(pessoa.telefone)}</td>
                    <td>${escaparHTML(pessoa.email)}</td>
                    <td class="acoes">
                        <button class="acao editar"
                                data-codigo="${escaparHTML(pessoa.codigo)}"
                                title="Editar">✎</button>
                        <button class="acao excluir"
                                data-codigo="${escaparHTML(pessoa.codigo)}"
                                title="Excluir">✖</button>
                    </td>
                </tr>
            `;

            tabela.append(linha);
        });
    }

    function gerarCodigo() {
        if (pessoas.length === 0) {
            return "001";
        }

        let maior = 0;

        pessoas.forEach(function (pessoa) {
            const numero = parseInt(pessoa.codigo, 10);

            if (!isNaN(numero) && numero > maior) {
                maior = numero;
            }
        });

        return String(maior + 1).padStart(3, "0");
    }

    function limparFormulario() {
        editandoCodigo = null;

        $("#codigo").val(gerarCodigo());
        $("#nome").val("");
        $("#telefone").val("");
        $("#email").val("");

        $("#btnSalvar").text("Salvar");
        $("#btnCancelar").addClass("hidden");
    }

    function validarEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function escaparHTML(texto) {
        return $("<div>").text(texto).html();
    }

    function mostrarMensagem(texto, classe) {
        $("#mensagem")
            .removeClass("sucesso erro")
            .addClass(classe)
            .text(texto);

        if (texto !== "") {
            setTimeout(function () {
                $("#mensagem").text("");
            }, 3000);
        }
    }
});
