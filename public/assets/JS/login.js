const btnLogin = document.getElementById("btnLogin");
btnLogin.addEventListener("click", async (event) => {
    event.preventDefault();

    const email = document.getElementById("idEmail").value;
    const senha = document.getElementById("idSenha").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers:{"Content-Type" : "application/json"},
            body: JSON.stringify({email: email, senha: senha})
        });

        const data = await response.json();

        if(data.success){
            window.location.href = "/inicio";
        } else {
            mostrarToast(data.message)
        }
    } catch (error) {
        mostrarToast("Erro ao conectar com o servidor");
        console.error(error);
    }
});


// Função para mostrar a senha ao usuário
const toggleMostrarSenha = document.getElementById("toggleMostrarSenha"); // Variavel do toggle ( <span> = seletor onde estar o icone )

toggleMostrarSenha.addEventListener("click", MostrarSenha); // Adiciono a variavel a uma lista de eventos, ao clicar, a função é chamada

function MostrarSenha(){ // Função para mostrar senha
    const inputSenha = document.getElementById("idSenha"); // Variavel do input de senha
    const iconToggle = document.getElementById("iconToggle"); // Variavel do icone

    if(inputSenha.type === "password"){ // Se o tipo do input for "password/senha" ele muda para o tipo "text"
        inputSenha.type = "text";
        iconToggle.classList.add("ph-eye-slash"); // Adiciona um novo icone
        iconToggle.classList.remove("ph-eye"); // Remove o atual
    } else { // Senão for do tipo "password", ele volta para o tipo "password"
        inputSenha.type = "password";
        iconToggle.classList.add("ph-eye");
        iconToggle.classList.remove("ph-eye-slash");
    }
}

// Função de Toast ( Quando o usuário errar a senha )
function mostrarToast(msg){
    const toast = document.getElementById("toast");

    toast.innerHTML = msg;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);    
}



