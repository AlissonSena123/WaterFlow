import { buscarCEP } from "../services/viaCEP.js";
import { mostrarToast } from "./utils/toast.js";

const btnEnviar = document.getElementById("btnEnviarReport");

/* ==== FUNÇÃO PARA PREENCHER AUTOMATICAMENTE OS CAMPO NOME E EMAIL DO USUÁRIO LOGADO ==== */
async function preencherNomeEmail() {
    const res = await fetch("/me", {
        method: "GET",
        credentials: "include"
    });

    const data = await res.json();

    const user = data.user;

    document.getElementById("idNome").value = user.nome;
    document.getElementById("idEmail").value = user.email;
}

preencherNomeEmail();

/* ==== FUNÇÃO PARA ENVIAR REPORT ==== */
btnEnviar.addEventListener("click", async (event) => {
    event.preventDefault();

    const form = document.querySelector("form");

    const report = {
        nome: document.getElementById("idNome").value,
        email: document.getElementById("idEmail").value,
        tipo: document.getElementById("tipo_problema").value,
        rua: document.getElementById("idRua").value,
        bairro: document.getElementById("idBairro").value,
        descricao: document.getElementById("idDescricao").value
    }

    try {
        const response = await fetch("/reporte/enviar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(report)
        });

        const data = await response.json();

        if (data.success) {
            mostrarToast(data.message, "green");
            form.reset();
        } else {
            mostrarToast(data.message, "red");
        }
    } catch (error) {
        mostrarToast("Erro ao conectar com o servidor", "red");
        console.error(error);
    }
});

/** Função de Buscar CEP */
const inputCEP = document.getElementById("idCEP");

inputCEP.addEventListener("blur", async () => {
    const cep = inputCEP.value.trim();

    if (!cep) {
        document.getElementById("idBairro").value = null;
        document.getElementById("idRua").value = null;
        return mostrarToast("Digite o CEP", "red");
    }

    const data = await buscarCEP(cep);

    if (!data) {
        mostrarToast("CEP inválido", "red");
        return;
    }

    document.getElementById("idRua").value = data.logradouro;
    document.getElementById("idBairro").value = data.bairro;
});
