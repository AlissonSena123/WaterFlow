import { mostrarToast } from "./utils/toast.js";

const botoes = [
  document.getElementById("btn-logout"),
  document.getElementById("logout")
].filter(Boolean);


botoes.forEach(btn => {
    btn.addEventListener("click", async () => {
        try {
            const response = await fetch("/logout", {
                method: "POST",
                credentials: "include"
            });
                    
            const data = await response.json();

            if (!response.ok) {
                return mostrarToast(data.message || "Erro ao fazer logout");
            }

            alert(data.message);
            // mostrarToast(data.message, "red")
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 2000);
            

        } catch (error) {
            console.error(error);
            mostrarToast("Erro interno de servidor", "red");
        }
    });
});