import { mostrarToast } from "./utils/toast.js";

document.getElementById("btnEnviar").addEventListener("click", async (event) => {
    event.preventDefault();

    try {
        const res = await fetch("/redefinirSenha", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: document.getElementById("email").value,
            })
        });

        const { message, success, redirect } = await res.json();

        if (!success) return mostrarToast(message, "red");

        window.location.href = redirect; 

    } catch (error) {
        console.error(error);
    }
});