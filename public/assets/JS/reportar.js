const btnEnviar = document.getElementById("btnEnviarReport");

btnEnviar.addEventListener("click", async (event) => {
    event.preventDefault();

    const report = {
        nome: document.getElementById("idNome").value,
        email: document.getElementById("idEmail").value,
        rua: document.getElementById("idRua").value,
        bairro: document.getElementById("idBairro").value
    }
});