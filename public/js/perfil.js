async function carregarPerfil() {
    try {
        const res = await fetch("/me", {
            method: "GET",
            credentials: "include"
        });

        const data = await res.json();

        if (!data.user) {
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
    return new Date(data).toLocaleDateString("pt-BR");
}

carregarPerfil();