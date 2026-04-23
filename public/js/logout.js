import { mostrarToast } from "./utils/toast.js";

document.querySelectorAll("#btn-logout, #logout").forEach(btn => {
    btn.addEventListener("click", async () => {
        try {
            const response = await fetch("/logout", {
                method: "POST",
                credentials: "include"
            });
                    
            const data = await response.json();

            if (!response.ok) {
                return mostrarToast(data.error, "red");
            }

            mostrarToast(data.message, "red");
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 2000);
            

        } catch (error) {
            console.error(error);
            mostrarToast("Erro interno de servidor", "red");
        }
    });
});