const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebar-overlay");

const btnDesktop = document.getElementById("iconHamburguer");
const btnMobile = document.getElementById("iconHamburguerMobile");

// Desktop
btnDesktop.addEventListener("click", () => {
    sidebar.classList.toggle("expand");
});

// Mobile
btnMobile.addEventListener("click", (event) => {
    event.stopPropagation();

    if (window.innerWidth <= 600) {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("visible");
    }
});

// Fecha ao clicar no overlay
overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("visible");
});

// Fecha ao clicar em um link
document.querySelectorAll("#sidebar a").forEach(link => {
    link.addEventListener("click", () => {
        if (window.innerWidth <= 600) {
            sidebar.classList.remove("open");
            overlay.classList.remove("visible");
        }
    });
});

// Ajuste ao redimensionar
window.addEventListener("resize", () => {
    if (window.innerWidth > 600) {
        sidebar.classList.remove("open");
        overlay.classList.remove("visible");
    } else {
        sidebar.classList.remove("expand");
    }
});