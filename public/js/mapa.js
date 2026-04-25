import { mostrarToast } from "./utils/toast.js";
import { criarMapa } from "./utils/mapaConfig.js";

let map;
let municipiosData;

/* ==== FUNÇÃO DE CACHE DO FETCH ==== */

// evita refazer o fetch a cada interação com o mapa
let statusCache = null; // guarda o resultado do ultimo fetch
let cacheTimestamp = null; // guarda quando o fetch foi feito
const CACHE_TTL = 60 * 1000; // define por quanto tempo o cache é válido


 
async function getStatusBairros() {
    const agora = Date.now();
    if (statusCache && cacheTimestamp && agora - cacheTimestamp < CACHE_TTL) { // verifica se já existe algum dado guardado e verifica se o cache tem menos de 1 minuto
        return statusCache; // Se tudo for verdade, retorno o dado guardado
    }

    // Se a condição for falsa, realiza uma busca na API
    const res = await fetch("/status/bairro");
    statusCache = await res.json(); // Depois guarda o resultado na variavel
    cacheTimestamp = Date.now();
    return statusCache;
}

criarMapa("map", [-38.5167, -12.9704], 12)
    .then(m => {
        map = m;

        // Definindo valor maximo e minimo do zoom
        map.setMinZoom(10);
        map.setMaxZoom(16);

        // Limitando o movimento do mapa
        map.setMaxBounds([
            [-38.70, -13.20],
            [-38.20, -12.70]
        ]);

        map.on("load", () => {
            fetch("/assets/mapas/salvador_bairros.geojson")
                .then(res => res.json())
                .then(data => {
                    municipiosData = data;

                    map.addSource("municipios", {
                        type: "geojson",
                        data: data,
                        promoteId: "NM_BAIRRO"
                    });

                    map.addLayer({
                        id: "municipios-layer",
                        type: "fill",
                        source: "municipios",
                        paint: {
                            "fill-color": "#aeffd500",
                            "fill-opacity": 0.35,
                            "fill-outline-color": "#003366"
                        }
                    });

                    //layer do poligono
                    map.addLayer({
                        id: "municipios-fill",
                        type: "fill",
                        source: "municipios",
                        paint: {
                            "fill-color": [
                                "match",
                                ["feature-state", "status"],
                                "SEM_ABASTECIMENTO", "#ff0000",
                                "FORNECIMENTO_IRREGULAR", "#ff7700",
                                "NORMAL", "#00cc66",
                                "#aeffd500"
                            ],
                            "fill-opacity": 0.2
                        },
                        filter: ["==", ["get", "NM_BAIRRO"], ""]
                    });

                    // Layer da borda
                    map.addLayer({
                        id: "municipios-line",
                        type: "line",
                        source: "municipios",
                        paint: {
                            "line-color": "#ffe4e4",
                            "line-width": 2
                        },
                        filter: ["==", ["get", "NM_BAIRRO"], ""]
                    });

                    getStatusBairros().catch(() => {});
                    
                });
        });

        map.on("click", "municipios-layer", async (e) => {
            const nomeMunicipio = e.features[0].properties.NM_BAIRRO;
            const bairro = normalizarTexto(nomeMunicipio);
            document.getElementById("search").value = nomeMunicipio;

            try {

                const feature = municipiosData.features.find(f =>
                    normalizarTexto(f.properties.NM_BAIRRO) === bairro
                );


                if (!feature) {
                    mostrarToast("Bairro não encontrado", "red");
                    return;
                }

                const [dados, detalheRes] = await Promise.all([
                    getStatusBairros(),
                    fetch(`/status/buscar/dados/${encodeURIComponent(bairro)}`)
                ]);
                const detalhe = await detalheRes.json();

                const bairroStatus = dados.find(bairro => 
                    normalizarTexto(bairro.bairro) === normalizarTexto(feature.properties.NM_BAIRRO)
                );


                const cor = resolverCor(bairroStatus?.status);

                map.setPaintProperty("municipios-fill", "fill-color", cor);
                map.setPaintProperty("municipios-line", "line-color", cor);

                map.setFilter("municipios-fill", ["==", ["get", "NM_BAIRRO"], feature.properties.NM_BAIRRO]);
                map.setFilter("municipios-line", ["==", ["get", "NM_BAIRRO"], feature.properties.NM_BAIRRO]);

                statusInfo(nomeMunicipio, detalhe);

            } catch (error) {
                console.log(error);
            }

        });
    });


/** ==== EVENTOS DE BUSCA ==== */

document.getElementById("btnSearch").addEventListener("click", () => {
    buscarRegiao(document.getElementById("search").value);
});

document.getElementById("search").addEventListener("keydown", (input) => {
    if (input.key === "Enter") {
        buscarRegiao(input.target.value);
    }
});

/* ==== FUNÇÃO PRINCIPAL DE BUSCA ==== */
async function buscarRegiao(nome) {

    if (!nome) { // Se o input estiver vazio, a função de "mostrarToast" será chamada e irá ser retornada
        mostrarToast("Digite um bairro", "red");
        return;
    }

    if (!municipiosData) {
        mostrarToast("Mapa ainda carregando", "red");
        return;
    }

    const nomeBusca = normalizarTexto(nome);

    try {

        const feature = municipiosData.features.find(f =>
            normalizarTexto(f.properties.NM_BAIRRO) === nomeBusca
        );

        if (!feature) {
            mostrarToast("Bairro não encontrado", "red");
            return;
        }

        // Chamando as duas requisições em paralelo
        const [dados, detalheRes] = await Promise.all([
            getStatusBairros(),
            fetch(`/status/buscar/dados/${encodeURIComponent(nomeBusca)}`)
        ]);

        const detalhe = await detalheRes.json();

        const bairroStatus = dados.find(b => normalizarTexto(b.bairro) === normalizarTexto(feature.properties.NM_BAIRRO));

        const cor = resolverCor(bairroStatus?.status);

        map.setPaintProperty("municipios-fill", "fill-color", cor);
        map.setPaintProperty("municipios-line", "line-color", cor);

        const centro = turf.centerOfMass(feature).geometry.coordinates;

        const bbox = turf.bbox(feature);

        map.fitBounds(bbox, {
            padding: 40,
            duration: 1000
        });

        map.setFilter("municipios-fill", [
            "==",
            ["get", "NM_BAIRRO"],
            feature.properties.NM_BAIRRO
        ]);

        map.setFilter("municipios-line", [
            "==",
            ["get", "NM_BAIRRO"],
            feature.properties.NM_BAIRRO
        ]);

        // mover mapa
        map.flyTo({
            center: centro,
            zoom: 13.5,
            speed: 1.2,
            curve: 1.4,
            essential: true
        });

        statusInfo(feature.properties.NM_BAIRRO, detalhe);

    } catch (error) {
        console.error(error);
        mostrarToast("Erro ao pesquisar localização", "red");
    }
}


/** ==== CARD DE STATUS ==== */
function statusInfo(nomeExibicao, data) {
    const painelStatusInfo = document.getElementById("cardStatus");
 
    if (!data || data.length === 0) {
        mostrarToast("Informações não encontradas", "red");
        return;
    }
 
    painelStatusInfo.innerHTML = data.map(bairro => `
        <div class="cardHeader">
            <i class="ph-fill ph-map-pin"></i>
            <div class="cardHeaderContant">
                <p>${nomeExibicao.toUpperCase()}</p>
                <p>Salvador - BA · <span>Atualizado em: ${formatarData(bairro.atualizado_em) || "Sem Atualização"}</span></p>
            </div>
            <div class="status">
                <p class="badge ${colorStatus(bairro.status)}">
                    ${bairro.status.replace(/_/g, ' ').charAt(0).toUpperCase() + bairro.status.replace(/_/g, ' ').slice(1).toLowerCase()}
                </p>
            </div>
        </div>
        <div class="dataInterrupcaoRetorno">
            <div class="inicioInterrupcao">
                <p><i class="ph-fill ph-clock"></i> Inicio da Interrupção:</p>
                <p>${formatarData(bairro.inicio_interrupcao, bairro.status) || " "}</p>
            </div>
            <p>·</p>
            <div class="prevRetorno">
                <p><i class="ph-fill ph-clock-clockwise"></i> Previsão de Retorno:</p>
                <p>${formatarData(bairro.previsao_retorno, bairro.status) || " "}</p>
            </div>
        </div>
        <div class="cardBody">
            <div class="cardItem causaInterrupcao">
                <p><i class="ph-fill ph-warning-circle"></i> Causa da Interrupção:</p>
                <p>${bairro.causa_interrupcao || "Sem Interrupção"}</p>
            </div>
            <div class="cardItem areaAfetada">
                <p><i class="ph-fill ph-map-pin-area"></i> Área Afetada:</p>
                <p>${(bairro.area_afetada || "-").replace(/_/g, ' ')}</p>
            </div>
            <div class="cardItem pressaoAgua">
                <p><i class="ph-fill ph-gauge"></i> Pressão da água:</p>
                <p>${(bairro.pressao_rede || "-").replace(/_/g, ' ')}</p>
            </div>
            <div class="cardItem medResolucao">
                <p><i class="ph-fill ph-check-circle"></i> Medida de Solução:</p>
                <p>${(bairro.medida_solucao || "-").replace(/_/g, ' ')}</p>
            </div>
            <div class="cardItem descInfo">
                <p><i class="ph-fill ph-sort-ascending"></i> Descrição:</p>
                <p>${bairro.descricao || "Sem descrição"}</p>
            </div>
        </div>
    `).join("");
 
    painelStatusInfo.style.display = "block";
    painelStatusInfo.scrollIntoView({ behavior: "smooth", block: "center" });
}
 

/** ==== UTILITÁRIOS ==== */

const CORES_STATUS = {
    "NORMAL": "#22c55e",
    "SEM_ABASTECIMENTO": "#ef4444",
    "FORNECIMENTO_IRREGULAR": "#f97316"
};
 
function resolverCor(status) {
    return CORES_STATUS[status] ?? "#3b3737";
}

function colorStatus(status) {
    const s = status.toUpperCase();
    if (s === "NORMAL") return "badge-active";
    if (s === "SEM_ABASTECIMENTO") return "badge-high";
    if (s === "FORNECIMENTO_IRREGULAR") return "badge-med";
}

function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acento
        .replace(/[^a-z0-9\s]/g, "")     // remove símbolos
        .replace(/\s+/g, " ")            // remove espaços duplicados
        .trim();
}

function formatarData(data, status) {

    if (status === "NORMAL") return null;

    const dataUTC = data.includes("Z") ? data : data.replace(" ", "T") + "Z";

    const dataFormatada = new Date(dataUTC);

    return dataFormatada.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}
