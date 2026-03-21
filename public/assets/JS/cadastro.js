import { buscarCEP } from "../../services/viaCEP.js";
import { mostrarToast } from "./utils/toast.js";

const btnCadastrar = document.getElementById("btnCadastrar");

btnCadastrar.addEventListener("click", async (event) => {
    event.preventDefault();

    const userCadastro = {
        nome_completo: document.getElementById("idNome").value,
        email: document.getElementById("idEmail").value,
        senha: document.getElementById("idSenha").value,
        data_nascimento: document.getElementById("idData").value,
        telefone: document.getElementById("idTelefone").value,
        cidade: document.getElementById("cidade").value,
        estado: document.getElementById("estado").value,
        pais: document.getElementById("pais").value,
        bairro: document.getElementById("bairro").value
    }

    try {
        const response = await fetch("/cadastrar", {
            method: "POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify(userCadastro)
        });

        const data = await response.json();

        if(data.success){
            mostrarToast(data.message, "green");
            window.location.href = "/login";
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

    document.getElementById("cidade").value = data.localidade || "";
    document.getElementById("bairro").value = data.bairro || "";
    document.getElementById("pais").value = "Brasil"; 
    document.getElementById("estado").value = data.uf || "";
});