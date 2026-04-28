import { mostrarToast } from "./utils/toast.js";

document.querySelectorAll("#btn-logout, #logout").forEach(btn => {
    btn.addEventListener("click", async () => {
        try {
            const response = await fetch("/logout", {
                method: "POST",
                credentials: "include"
            });
                    
            const data = await response.json();

            console.log(data.message);

            if (!data.success) {
                return mostrarToast(data.message, "red");
            }

            // mostrarToast(data.message, "green");
            // setTimeout(() => {
            //     window.location.href = data.redirect;
            // }, 2000);
            

        } catch (error) {
            console.error(error);
            mostrarToast("Erro interno de servidor", "red");
        }
    });
});