const tokenURL = window.location.pathname.split("/").pop();
document.getElementById("token").value = tokenURL;

// Função do toast
function showToast(msg) {
    const msgBox = document.getElementById("show");
    const toast = document.getElementById("toast");

    msgBox.innerText = msg;

    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";
    }, 3000);
}

// Captura o submit do form
document.getElementById("formAtualizar").addEventListener("submit", async function (e) {
    e.preventDefault();

    const senha = document.getElementById("novaSenha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;
    const token = document.getElementById("token").value;

    if (senha !== confirmarSenha) {
        showToast("As senhas não coincidem!");
        return;
    }

    try {
        const response = await fetch(`/usuarios/atualizar-senha/${token}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ senha, token })
        });

        const resultado = await response.json();

        if (response.ok) {
            showToast(resultado.message);
            setTimeout(() => {
                window.location.href = "/login";
            }, 3200);
        } else {
            showToast(resultado.error || "Erro ao atualizar a senha.");
        }
    } catch (erro) {
        console.error("Erro no fetch:", erro);
        showToast("Erro interno. Tente novamente mais tarde.");
    }
});