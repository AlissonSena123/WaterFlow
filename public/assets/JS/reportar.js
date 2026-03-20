const btnEnviar = document.getElementById("btnEnviarReport");

btnEnviar.addEventListener("click", async (event) => {
    event.preventDefault();

    const form = document.querySelector("form");

    const report = {
        nome: document.getElementById("idNome").value,
        email: document.getElementById("idEmail").value,
        rua: document.getElementById("idRua").value,
        bairro: document.getElementById("idBairro").value,
        descricao: document.getElementById("idDescricao").value
    }

    try {
        const response = await fetch("/reporte/enviar", {
            method: "POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify(report)
        });

        const data = await response.json();

        if(data.success){
            mostrarToast(data.message);
            form.reset();
        }else{
            mostrarToast(data.error);
        }
    } catch (error) {
        mostrarToast("Erro ao conectar com o servidor");
        console.error(error);
    }
});

/** Função de Buscar CEP */

import { buscarCEP } from "../../API/viaCEP.js";
import { mostrarToast } from "../../assets/JS/Utils/toast.js";

const inputCEP = document.getElementById("idCEP");

inputCEP.addEventListener("blur", async () => {
    const data = await buscarCEP(inputCEP.value);

    if(!data) {
        mostrarToast("CEP inválido");
        return;
    }

    document.getElementById("idRua").value = data.logradouro;
    document.getElementById("idBairro").value = data.bairro;
});