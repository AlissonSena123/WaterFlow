import { buscarCEP } from "../services/viaCEP.js";
import { mostrarToast } from "./utils/toast.js";

async function carregarPerfil() {
    try {
        const res = await fetch("/me", {
            method: "GET",
            credentials: "include"
        });

        const data = await res.json();

        if (!data) {
            window.location.href = "/login";
            return;
        }

        const user = data.user;

        document.getElementById("titleNome").innerHTML = user.nome;
        document.getElementById("userNome").innerHTML = user.nome;
        document.getElementById("userEmail").innerHTML = user.email;
        document.getElementById("userTel").innerHTML = user.telefone;
        document.getElementById("userData").innerHTML = formatarData(user.nascimento);
        document.getElementById("userBairro").innerHTML = user.bairro;

    } catch (error) {
        console.log("ERRO: ", error);
    }
}

function formatarData(data) {
    const [ano, mes, dia] = data.split("-");
    const dataFormatada = new Date(ano, mes - 1, dia);

    return dataFormatada.toLocaleDateString("pt-BR");
}

carregarPerfil();


const btnEditarPerfil = document.getElementById("btnEditarPerfil");
const itensForm = document.querySelectorAll("#form input")
const modalEditarPerfil = document.getElementById("modalEdit");
const btnCancelarEdit = document.getElementById("btnCancelarEdit");

/* ==== ABRIR O MODAL ==== */
btnEditarPerfil.addEventListener("click", async () => {

    const res = await fetch("/me", {
        method: "GET",
        credentials: "include"
    });

    const data = await res.json();

    const user = data.user;

    const infoUser = {
        nome: user.nome,
        email: user.email,
        telefone: user.telefone
    }

    const valores = Object.values(infoUser);

    itensForm.forEach((item, index) => {
        item.value = valores[index] ?? "";
    });

    modalEditarPerfil.classList.add("active");
});

/* ==== FECHAR O MODAL ==== */
modalEditarPerfil.addEventListener('click', (e) => {
    if (e.target === modalEditarPerfil) modalEditarPerfil.classList.remove('active');
});

btnCancelarEdit.addEventListener("click", () => {
    modalEditarPerfil.classList.remove("active");
});

/* ==== FUNÇÃO DO CEP ==== */
document.getElementById("idCEP").addEventListener("blur", async () => {
    const cep = document.getElementById("idCEP").value.trim();

    const data = await buscarCEP(cep);

    if (data.localidade !== "Salvador") {
        return mostrarToast("Apenas CEPs de Salvador são permitidos", "red");
    }

    document.getElementById("bairro").value = data.bairro || "";
});

