export function mostrarToast(msg, color) {
    const toast = document.getElementById("toast");

    if (!toast) {
        console.warn("Elemento #toast não encontrado");
        return;
    }

    toast.innerHTML = msg;
    toast.style.backgroundColor = color;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}