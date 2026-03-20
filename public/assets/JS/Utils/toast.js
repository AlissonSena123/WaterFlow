export function mostrarToast(msg) {
    const toast = document.getElementById("toast");

    if (!toast) {
        console.warn("Elemento #toast não encontrado");
        return;
    }

    toast.innerHTML = msg;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}