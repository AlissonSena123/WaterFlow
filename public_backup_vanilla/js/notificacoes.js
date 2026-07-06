const CHAVE_REPORTES = "notif_reportes";
const CHAVE_ALERTAS = "notif_alertas";

// Cache em memória para evitar refazer fetch ao fechar notificações
let cacheReportes = [];
let cacheAlertas = [];

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

// Atualiza apenas o badge do sino sem refazer requisições ao servidor
function atualizarBadge() {
    const lidasReportes = getLidas(CHAVE_REPORTES);
    const lidasAlertas = getLidas(CHAVE_ALERTAS);

    // Conta quantas notificações ainda não foram lidas, somando as duas requisições, reporte e alerta
    const totalNaoLidas =
        cacheReportes.filter(n => !lidasReportes.includes(String(n.id))).length +
        cacheAlertas.filter(n => !lidasAlertas.includes(`${n.id}_${n.atualizado_em}`)).length;

    // Atualiza o badge no sino, mostra o número de notificações não lidas ou esconde se não tiver nenhuma
    const badge = document.getElementById("notifBadge");
    const icone = document.querySelector("#notifBtn i");

    badge.textContent = totalNaoLidas;
    badge.style.display = totalNaoLidas > 0 ? "flex" : "none";

    icone.classList.toggle("ph-bell-ringing", totalNaoLidas > 0);
    icone.classList.toggle("ph-bell", totalNaoLidas === 0);
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
        // Salva no cache em memória para uso posterior sem novas requisições
        if (dadosReportes.success) cacheReportes = dadosReportes.data;
        if (dadosAlertas.success) cacheAlertas = dadosAlertas.data;

        // Filtra fora as notificações já lidas antes de montar os templates
        const reportesVisiveis = cacheReportes.filter(n => !lidasReportes.includes(String(n.id)));
        const alertasVisiveis = cacheAlertas.filter(n => !lidasAlertas.includes(`${n.id}_${n.atualizado_em}`));

        // Atualiza o badge do sino com base no cache atual
        atualizarBadge();

        const lista = document.getElementById("notifLista");

        // Se o id estiver no localStorage, adiciona a classe "nao-lida" ou não
        // Botão X adicionado dentro de cada item para fechar a notificação
        const itensReportes = reportesVisiveis.map(n => `
            <li class="notif-item nao-lida" data-id="${n.id}" data-tipo="reporte">
                <div class="notif-conteudo">
                    <p>Seu reporte do bairro <strong>${n.bairro}</strong> foi respondido! Verifique seu email.</p>
                    <span>${new Date(n.respondido_em).toLocaleDateString("pt-BR")}</span>
                </div>
                <button class="notif-fechar" aria-label="Fechar notificação">×</button>
            </li>
        `);

        const itensAlertas = alertasVisiveis.map(n => `
            <li class="notif-item nao-lida" data-id="${n.id}_${n.atualizado_em}" data-tipo="alerta">
                <div class="notif-conteudo">
                    <p>Status do abastecimento em <strong>${n.bairro.toUpperCase()}</strong> foi atualizado para <strong>${n.status.replace(/_/g, ' ')}</strong>.</p>
                    <span>${new Date(n.atualizado_em).toLocaleDateString("pt-BR")}</span>
                </div>
                <button class="notif-fechar" aria-label="Fechar notificação">×</button>
            </li>
        `);

        // Junta alertas e reportes em uma lista só
        // Notificações de alertas irão aparecer primeiro, por serem mais urgentes
        const todos = [...itensAlertas, ...itensReportes];

        // Renderiza a lista no painel de notificação
        lista.innerHTML = todos.length === 0
            ? `<li class="notif-vazia">Nenhuma notificação.</li>`
            : todos.join("");

        // Adiciona um evento de clique no botão X de cada item da lista
        lista.querySelectorAll(".notif-fechar").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation(); // Evita propagar o clique para o <li>

                const el = btn.closest(".notif-item");

                // Identifica se é reporte ou alerta para usar a chave certa no localStorage
                const tipo = el.dataset.tipo;
                const key = tipo === "reporte" ? CHAVE_REPORTES : CHAVE_ALERTAS;

                // Salva o id no localStorage para marcar como lida
                marcarLida(key, String(el.dataset.id));

                // Animação de saída antes de remover o item do DOM
                el.classList.add("saindo");
                el.addEventListener("animationend", () => {
                    el.remove();

                    // Se a lista ficou vazia após remover, exibe o estado vazio
                    if (lista.querySelectorAll(".notif-item").length === 0) {
                        lista.innerHTML = `<li class="notif-vazia">Nenhuma notificação.</li>`;
                    }

                    atualizarBadge(); // Atualiza o badge do sino sem refazer fetch
                }, { once: true });
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
setInterval(carregarNotificacoes, 5_000); // Verifica novas notificações a cada 5s