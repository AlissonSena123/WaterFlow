import { buscarCEP } from "../services/viaCEP.js";
import { mostrarToast } from "./utils/toast.js";

const btnEditarPerfil = document.getElementById("btnEditarPerfil");
const itensForm = document.querySelectorAll("#form input")
const modalEditarPerfil = document.getElementById("modalEdit");
const btnCancelarEdit = document.getElementById("btnCancelarEdit");
const btnConfirmarAtualizacao = document.getElementById("btnConfirmarAtualizacao");

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

        await meusReportes(user.email);

        const idade = calcularIdade(user.nascimento);

        document.getElementById("titleNome").innerHTML = user.nome;
        document.getElementById("userNome").innerHTML = user.nome;
        document.getElementById("userEmail").innerHTML = user.email;
        document.getElementById("userTel").innerHTML = formatarTelefone(user.telefone);
        document.getElementById("userData").innerHTML = `${formatarData(user.nascimento)} - ${idade} anos`;
        document.getElementById("userBairro").innerHTML = (user.bairro).toUpperCase();
        document.getElementById("titleLocalidade").innerHTML = `${(user.bairro).toUpperCase()}, BA — Brasil`;

        const iniciais = user.nome
            .split(" ")
            .map(n => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

        document.getElementById("avatar").innerHTML = iniciais;

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

/* ==== ABRIR O MODAL ==== */
btnEditarPerfil.addEventListener("click", async () => {

    const res = await fetch("/me", {
        method: "GET",
        credentials: "include"
    });

    const data = await res.json();

    const user = data.user;

    const modalAvatar = document.getElementById("modalAvatar");

    const iniciais = user.nome
        .split(" ")
        .map(n => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    modalAvatar.innerHTML = iniciais;

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


/* ==== FUNÇÃO PARA ATUALIZAR O PERFIL ==== */
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

        const {message, success} = await res.json();

        if (!success) {
            mostrarToast(message, "red");
            return;
        }

        mostrarToast("Perfil atualizado com sucesso", "green");
        carregarPerfil();

        modalEditarPerfil.classList.remove("active");

    } catch (error) {
        console.error("Erro ao atualizar:", error);
    }
});

/* Função para calcular a idade do usuário */
function calcularIdade(dataNascimento) {
    const [dia, mes, ano] = dataNascimento.split("/");
    const nascimento = new Date(`${ano}-${mes}-${dia}`);
    const hoje = new Date();

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesPassou = hoje.getMonth() > nascimento.getMonth();
    const diaPassou = hoje.getMonth() === nascimento.getMonth() && hoje.getDate() >= nascimento.getDate();

    if (!mesPassou && !diaPassou) idade--;

    return idade;
}

/* ==== FUNÇÃO PARA BUSCAR OS REPORTES DO USUÁRIO ==== */
async function meusReportes(userEmail) {
    try {
        const [totalReportes, meusReportes] = await Promise.all([
            fetch(`/reportes/contagem/${userEmail}`),
            fetch(`/meus-reportes/${userEmail}`)
        ]);

        const dataTotal = await totalReportes.json();
        const dataReportes = await meusReportes.json();

        console.log(dataReportes);

        if (!dataTotal || !dataReportes) return;

        document.getElementById("totalReportes").innerHTML = dataTotal.total;

        const lista = document.getElementById("listaReportes");

        if (dataTotal.total === 0) {
            lista.innerHTML = `<p>Sem reportes registrado</p>`
            return;
        }

        lista.innerHTML = dataReportes.reportes.map(r => `
            <div class="reporte-card">
                <span class="reporte-tipo">${r.tipo_problema || "Sem titulo"} <span class="reporte-data">${new Date(r.created_at).toLocaleDateString("pt-BR")}</span></span>
                <span class="reporte-status">${r.status.replace(/_/g, " ")}</span>
                <p class="reporte-descricao">${r.descricao || "Sem descrição"}</p>
            </div>
        `).join("");

    } catch (error) {
        console.log(error);
    }
}

/* EVENTO PARA DELETAR A CONTA */
const modalDeletar = document.getElementById("modalDeletar");

document.getElementById("deletarConta").addEventListener("click", () => {
    modalDeletar.classList.add("active");
});

document.getElementById("btnCancelarDeletar").addEventListener("click", () => {
    modalDeletar.classList.remove("active");
});

modalDeletar.addEventListener("click", (e) => {
    if (e.target === modalDeletar) modalDeletar.classList.remove("active");
});

document.getElementById("btnConfirmarDeletar").addEventListener("click", async () => {
    try {
        const res = await fetch("/usuarios/deletar", {
            method: "DELETE",
            credentials: "include"
        });

        const text = await res.text();

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            console.error("Resposta não é JSON:", text);
            mostrarToast("Erro no servidor", "red");
            return;
        }

        if (data.success) {
            mostrarToast(data.message, "green");

            setTimeout(() => {
                window.location.href = "/login";
            }, 1200)

        } else {
            mostrarToast(data.message || "Erro ao deletar conta", "red");
        }

    } catch (err) {
        console.error(err);
        mostrarToast("Erro de conexão", "red");
    }
});


function formatarTelefone(tel) {
    const n = tel.replace(/\D/g, '');
    return n.length <= 10
        ? n.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
        : n.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}