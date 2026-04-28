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
const btnConfirmarAtualizacao = document.getElementById("btnConfirmarAtualizacao");
/* ==== ABRIR O MODAL ==== */
btnEditarPerfil.addEventListener("click", async () => {

    const res = await fetch("/me", {
        method: "GET",
        credentials: "include"
    });

    const data = await res.json();

    const user = data.user;

    //Forma antiga de mandar os dados
    /*const infoUser = {
        nome: user.nome,
        email: user.email,
        telefone: user.telefone
    }

    const valores = Object.values(infoUser);*/

    //Nova forma

    //A logica ehh simples, pegamos o valor de "name" do html (adicionei aos campos de nome email e telefone dps da uma olhada);
    const mapCampos = {
        nome_completo: "nome",
        email: "email",
        telefone: "telefone",
        bairro: "bairro"
    }

    itensForm.forEach((item) => {
        const campo = mapCampos[item.name];
        item.value = user[campo] ?? "";
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

btnConfirmarAtualizacao.addEventListener("click", async () => {

    const dados = {};

    itensForm.forEach((item) => {
        if (item.value.trim() !== "") {
            dados[item.name] = item.value.trim();
        }
    });

    try {
        const res = await fetch("/usuarios/atualizar/perfil", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(dados)
        });

        const data = await res.json();

        if (!data.success) {
            console.error(data.message);
            return;
        }

        console.log("Atualizado com sucesso!");
        carregarPerfil();

        modalEditarPerfil.classList.remove("active");
        
    } catch (error) {
        console.error("Erro ao atualizar:", error);
    }
});