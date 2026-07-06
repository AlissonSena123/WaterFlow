import { mostrarToast } from "./utils/toast.js";

let isLoggingOut = false;

function setupLogout(selector) {
    const btn = document.querySelector(selector);
    if (!btn) return;

    btn.addEventListener("click", async (event) => {
        event.preventDefault();
        if (isLoggingOut) return;

        isLoggingOut = true;

        try {
            const response = await fetch("/logout", {
                method: "POST",
                credentials: "include"
            });

            const data = await response.json();

            if (!data.success) {
                return mostrarToast(data.error, "red");
            }

            mostrarToast(data.message, "green");

            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1200);

        } catch (error) {
            console.error(error);
            mostrarToast("Erro interno", "red");
        }
    });
}

//Logout de funcionario
setupLogout("#btn-logout", "funcionario");

//Logout de Usuario
setupLogout("#perfil-sair", "usuario");
setupLogout("#perfilMenu-sair", "usuario");