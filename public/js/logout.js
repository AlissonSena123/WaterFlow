import { mostrarToast } from "./utils/toast.js";

document.getElementById("btn-logout").addEventListener("click", async () => {
    try {
        const response = await fetch("/logout", {
            method: "POST",
            credentials: "include"
        });
                
        const data = await response.json();

        if(!response.ok){
            return mostrarToast(data.error, "red");
        }

        mostrarToast(data.message, "red");
        window.location.href = data.redirect;

    } catch (error) {
        console.error(error);
        mostrarToast("Erro interno de servidor", "red");
    }
});