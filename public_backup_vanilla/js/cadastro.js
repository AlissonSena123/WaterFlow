import { buscarCEP } from "../services/viaCEP.js";
import { mostrarToast } from "./utils/toast.js";

const btnCadastrar = document.getElementById("btnCadastrar");

const inputData = document.getElementById("idData");
const hoje = new Date();

const max = hoje.toISOString().split('T')[0];

const min = new Date(hoje.getFullYear() - 120, hoje.getMonth(), hoje.getDate())
    .toISOString().split('T')[0];

inputData.max = max;
inputData.min = min;

btnCadastrar.addEventListener("click", async (event) => {
    event.preventDefault();

    const dataNascimento = document.getElementById("idData").value;
    if (!dataNascimento || dataNascimento > max || dataNascimento < min) {
        mostrarToast("Data de nascimento inválida", "red");
        return;
    }

    const userCadastro = {
        nome_completo: document.getElementById("idNome").value,
        email: document.getElementById("idEmail").value,
        senha: document.getElementById("idSenha").value,
        data_nascimento: dataNascimento,
        telefone: document.getElementById("idTelefone").value,
        cidade: document.getElementById("cidade").value,
        estado: document.getElementById("estado").value,
        pais: document.getElementById("pais").value,
        bairro: document.getElementById("bairro").value
    }

    try {
        const response = await fetch("/cadastrar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userCadastro)
        });

        const data = await response.json();

        if (data.success) {
            mostrarToast(data.message, "green");
            setTimeout(() => {
                window.location.href = "/login";
            }, 3000);
        } else {
            mostrarToast(data.message, "red");
        }
    } catch (error) {
        mostrarToast("Erro interno do servidor", "red");
    }
});

/* Função de Buscar CEP*/
const inputCEP = document.getElementById("idCEP");

function limparCamposEndereco() {
    document.getElementById("cidade").value = "";
    document.getElementById("bairro").value = "";
    document.getElementById("estado").value = "";
    document.getElementById("pais").value = "";
}

inputCEP.addEventListener("blur", async () => {
    const cep = inputCEP.value.trim();

    if (!cep) {
        limparCamposEndereco();
        return mostrarToast("Digite o CEP", "red");
    }

    const data = await buscarCEP(cep);

    if (!data) {
        limparCamposEndereco();
        return mostrarToast("CEP inválido", "red");;
    }

    if (data.localidade !== "Salvador") {
        limparCamposEndereco();
        return mostrarToast("Apenas CEPs de Salvador são permitidos", "red");
    }

    document.getElementById("cidade").value = data.localidade || "";
    document.getElementById("bairro").value = data.bairro || "";
    document.getElementById("pais").value = "Brasil";
    document.getElementById("estado").value = data.uf || "";
});

/* Evento para formatar o campo de telefone */
document.getElementById("idTelefone").addEventListener("input", (evento) => {
    let telefone = evento.target.value.replace(/\D/g, '') // remove qualquer valor que não seja número

    if (telefone.length < 10) {
        telefone = telefone.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
        telefone = telefone.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }

    evento.target.value = telefone;

});
