// Chaves usadas no localStorage para separar os dois tipos de notificação
const CHAVE_REPORTES = "notif_reportes";
const CHAVE_ALERTAS = "notif_alertas";

// Busca no localStorage a lista de ids já lidos para uma chave específica
function getLidas(key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
}

// Marca uma notificação como lida salvando o id no localStorage
function marcarLida(key, id) {
    const lidas = getLidas(key);
    if (!lidas.includes(String(id))) { // Só adiciona se ainda não estiver na lista, evitando duplicatas
        lidas.push(String(id)); // Converte o id para String para garantir compatibilidade com o supabase
        localStorage.setItem(key, JSON.stringify(lidas));
    }
}

/* ---- FUNÇÃO ASSÍNCRONA QUE BUSCA E EXIBI AS NOTIFICAÇÃO NA TELA ---- */
async function carregarNotificacoes() {
    try {
        const [resReportes, resAlertas] = await Promise.all([ // <= Faz as duas requisições ao mesmo tempo
            fetch("/api/meus-reportes"),
            fetch("/api/alertas-bairro"),
        ]);

        // Convertendo as respostas das duas requisições para JSON
        const dadosReportes = await resReportes.json();
        const dadosAlertas = await resAlertas.json();

        // Busca no localStorage quais notificações o usuário já clicou/leu
        const lidasReportes = getLidas(CHAVE_REPORTES);
        const lidasAlertas = getLidas(CHAVE_ALERTAS);

        // Operação ternario que verifica se a requisição foi bem-sucedida
        const reportes = dadosReportes.success ? dadosReportes.data : [];
        const alertas = dadosAlertas.success ? dadosAlertas.data : [];


        // Conta quantas notificações ainda não foram lidas, somando as duas requisições, reporte e alerta
        const totalNaoLidas =
            reportes.filter(n => !lidasReportes.includes(String(n.id))).length +
            alertas.filter(n => !lidasAlertas.includes(String(n.id))).length;

        // Atualiza o badge no sino, mostra o número de notificações não lidas ou esconde se não tiver nenhuma
        const badge = document.getElementById("notifBadge");
        const icone = document.querySelector("#notifBtn i");

        badge.textContent = totalNaoLidas;
        badge.style.display = totalNaoLidas > 0 ? "flex" : "none";

        if (totalNaoLidas > 0) {
            icone.classList.replace("ph-bell", "ph-bell-ringing");
        } else {
            icone.classList.replace("ph-bell-ringing", "ph-bell");
        }

        const lista = document.getElementById("notifLista");

        // Se o id estiver no localStorage, adiciona a classe "nao-lida" ou não
        const itensReportes = reportes.map(n => `
            <li class="notif-item ${lidasReportes.includes(String(n.id)) ? "" : "nao-lida"}"
                data-id="${n.id}" data-tipo="reporte">
                <p>Seu reporte do bairro <strong>${n.bairro}</strong> foi respondido! Verifique seu email.</p>
                <span>${new Date(n.respondido_em).toLocaleDateString("pt-BR")}</span>
            </li>
        `);

        const itensAlertas = alertas.map(n => `
            <li class="notif-item ${lidasAlertas.includes(String(n.id)) ? "" : "nao-lida"}"
                data-id="${n.id}" data-tipo="alerta">
                <p>Status do abastecimento em <strong>${n.bairro.toUpperCase()}</strong> foi atualizado para <strong>${n.status.replace(/_/g, ' ')}</strong>.</p>
                <span>${new Date(n.atualizado_em).toLocaleDateString("pt-BR")}</span>
            </li>
        `);

        // Junta alertas e reportes em uma lista só
        // Notificações de alertas irão aparecer primeiro, por serem mais urgentes
        const todos = [...itensAlertas, ...itensReportes];

        // Renderiza a lista no painel de notificação
        lista.innerHTML = todos.length === 0
            ? `<li class="notif-vazia">Nenhuma notificação.</li>`
            : todos.join("");

        // Adiciona um evento de clique em cada item da lista
        lista.querySelectorAll(".notif-item").forEach(el => {
            el.addEventListener("click", () => {

                // Identifica se é reporte ou alerta para usar a chave certa no localStorage
                const tipo = el.dataset.tipo;
                const key = tipo === "reporte" ? CHAVE_REPORTES : CHAVE_ALERTAS;

                // Salva o id no localStorage para marcar como lida e remove a classe "nao_lida"
                marcarLida(key, String(el.dataset.id));
                el.classList.remove("nao-lida");

                carregarNotificacoes();
            });
        });

    } catch (err) {
        console.error("Erro ao carregar notificações:", err);
    }
}


/* ---- EVENTO PARA ABRIR PAINEL DE NOTIFICAÇÃO ---- */
document.getElementById("notifBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    const icone = document.querySelector("#notifBtn i");
    const aberto = document.getElementById("notifDropdown").classList.toggle("open");
    icone.classList.toggle("ph-bold", !aberto);
    icone.classList.toggle("ph-fill", aberto);
});

/* ---- EVENTO PARA FECHAR O PAINEL DE NOTIFICAÇÃO ---- */
document.addEventListener("click", (e) => {
    if (!document.getElementById("notifWrapper").contains(e.target)) {
        const icone = document.querySelector("#notifBtn i");
        icone.classList.replace("ph-fill", "ph-bold");
        document.getElementById("notifDropdown").classList.remove("open");
    }
});

carregarNotificacoes(); // Carrega as notificações ao abrir a página
setInterval(carregarNotificacoes, 30000); // Atualiza automaticamente a cada 30 segundos