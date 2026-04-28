import { mostrarToast } from "../utils/toast.js";

const btnLogout = document.getElementById("btn-logout");

btnLogout.addEventListener("click", async () => {
    try {
        const response = await fetch("/logout", {
            method: "POST",
            credentials: "include"
        });

        const data = await response.json();

        if (!data.success) {
            return mostrarToast(data.message || "Erro ao fazer logout", "red");
        }

        mostrarToast(data.message, "green");
        setTimeout(() => {
            window.location.href = data.redirect;
        }, 2000);


    } catch (error) {
        console.error(error);
        mostrarToast("Erro interno de servidor", "red");
    }
});