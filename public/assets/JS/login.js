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



