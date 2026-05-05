import { mostrarToast } from "./utils/toast.js";

// const btnLogout = document.getElementById("logout");

// btnLogout.addEventListener("click", async () => {
//     try {
//         const response = await fetch("/logout", {
//             method: "POST",
//             credentials: "include"
//         });

//         const data = await response.json();

//         if (!data.success) {
//             return mostrarToast(data.message || "Erro ao fazer logout", "red");
//         }

//         mostrarToast(data.message, "green");
//         setTimeout(() => {
//             window.location.href = data.redirect;
//         }, 2000);


//     } catch (error) {
//         console.error(error);
//         mostrarToast("Erro interno de servidor", "red");
//     }
// });

let isLoggingOut = false;

function setupLogout(selector) {
    const btn = document.querySelector(selector);
    if (!btn) return;

    btn.addEventListener("click", async () => {
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
setupLogout("#logout", "usuario");