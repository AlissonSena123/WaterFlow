// Função de logout da tela de inicio
document.getElementById("btn-logout").addEventListener("click", async () => {
    try {
        const response = await fetch("/logout", {
            method: "POST",
            credentials: "include"
        });
                
        const data = await response.json();

        if(!response.ok){
            return mostrarToast(data.error);
        }

        mostrarToast(data.message);

        setInterval(() => {
            window.location.href = data.redirect;
        }, 3000);
        

    } catch (error) {
        console.error(error);
        mostrarToast("Erro interno no Servidor!");
    }
});

function mostrarToast(msg){
    const toast = document.getElementById("toast");

    toast.innerHTML = msg;
    toast.style.backgroundColor = "red";
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);    
}