/* ---- FUNÇAÕ ASSÍNCRONA QUE BUSCA E EXIBI AS NOTIFICAÇÃO NA TELA ---- */
async function carregarNotificacoes() { 
    try {
        const res = await fetch("/api/notificacoes"); // Fazendo a requisição
        const data = await res.json();

        if (!data.success) return;

        const lista = document.getElementById("notifLista");
        const badge = document.getElementById("notifBadge");
        const naoLidas = data.data.filter(n => !n.lida); // Cria uma lista com as notificações que ainda não foram lidas.

        badge.textContent = naoLidas.length; // Mostra no badge a quantidade de notificações não lidas.
        badge.style.display = naoLidas.length > 0 ? "flex" : "none";

        lista.innerHTML = data.data.length === 0 
            ? `<li class="notif-vazia">Nenhuma notificação.</li>`
            // Mapeia todas as notificações 
            : data.data.map(n => `
                <li class="notif-item ${n.lida ? "" : "nao-lida"}" data-id="${n.id}">
                    <p>${n.mensagem}</p>
                    <span>${new Date(n.criado_em).toLocaleDateString("pt-BR")}</span>
                </li>
            `).join("");

        lista.querySelectorAll(".notif-item").forEach(el => {
            el.addEventListener("click", () => { // Quando o usuário clicar na notificação, chama a função marcarLida()
                marcarLida(el.dataset.id, el);
            });
        });

    } catch (err) {
        console.error("Erro ao carregar notificações:", err);
    }
}

/* ---- FUNÇÃO ASSICRONA PARA MARCAR AS NOTIFICAÇÕES COMO LIDAS ---- */
async function marcarLida(id, el) {
    await fetch(`/api/notificacoes/${id}/lida`, { method: "PATCH" }); // Envia uma requisição PATCH para atualizar a notificação.
    el.classList.remove("nao-lida"); // Remove a classe "não-lida" da notificação
    carregarNotificacoes(); // Chama a função novamente
}

/* ---- EVENTO PARA ABRIR PAINEL DE NOTIFICAÇÃO ---- */
document.getElementById("notifBtn").addEventListener("click", (e) => {
    e.stopPropagation(); // Impede que o click vai para outros eventos da página
    const dd = document.getElementById("notifDropdown");
    dd.classList.toggle("open"); // Adiciona a classe "open"
});

/* ---- EVENTO PARA FECHAR O PAINEL DE NOTIFICAÇÃO ---- */
document.addEventListener("click", (e) => {
    if (!document.getElementById("notifWrapper").contains(e.target)) { // Verifica se o "click" foi fora do painel
        document.getElementById("notifDropdown").classList.remove("open"); // Remove a classe "open"
    }
});

carregarNotificacoes(); // Chama a função mais um vez
setInterval(carregarNotificacoes, 30000); // Carrega em um intervalo de 30 segundos