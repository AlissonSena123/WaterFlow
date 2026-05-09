async function carregarNotificacoes() {
    try {
        const res = await fetch("/api/notificacoes");
        const data = await res.json();

        if (!data.success) return;

        const lista = document.getElementById("notifLista");
        const badge = document.getElementById("notifBadge");
        const naoLidas = data.data.filter(n => !n.lida);

        badge.textContent = naoLidas.length;
        badge.style.display = naoLidas.length > 0 ? "flex" : "none";

        lista.innerHTML = data.data.length === 0
            ? `<li class="notif-vazia">Nenhuma notificação.</li>`
            : data.data.map(n => `
                <li class="notif-item ${n.lida ? "" : "nao-lida"}" data-id="${n.id}">
                    <p>${n.mensagem}</p>
                    <span>${new Date(n.criado_em).toLocaleDateString("pt-BR")}</span>
                </li>
            `).join("");

        // Adiciona eventos depois de renderizar
        lista.querySelectorAll(".notif-item").forEach(el => {
            el.addEventListener("click", () => {
                marcarLida(el.dataset.id, el);
            });
        });

    } catch (err) {
        console.error("Erro ao carregar notificações:", err);
    }
}

async function marcarLida(id, el) {
    await fetch(`/api/notificacoes/${id}/lida`, { method: "PATCH" });
    el.classList.remove("nao-lida");
    carregarNotificacoes();
}

document.getElementById("notifBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    const dd = document.getElementById("notifDropdown");
    dd.classList.toggle("open");
});

document.addEventListener("click", (e) => {
    if (!document.getElementById("notifWrapper").contains(e.target)) {
        document.getElementById("notifDropdown").classList.remove("open");
    }
});

carregarNotificacoes();
setInterval(carregarNotificacoes, 30000);