import { mostrarToast } from "./utils/toast.js";
import { criarMapa } from "./utils/mapaConfig.js";

let map;
let municipiosData;

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

                    //layer do poligono
                    map.addLayer({
                        id: "municipios-fill",
                        type: "fill",
                        source: "municipios",
                        paint: {
                            "fill-color": "#3b3737",
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
                            "line-color": "#3b3737",
                            "line-width": 2
                        },
                        filter: ["==", ["get", "NM_BAIRRO"], ""]
                    });

                });

        });
    })


document.getElementById("btnSearch").addEventListener("click", () => {
    buscarRegiao(document.getElementById("search").value);
});

document.getElementById("search").addEventListener("keydown", (input) => {
    if (input.key === "Enter") {
        buscarRegiao(input.target.value);
    }
})

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

        const res = await fetch("/status/bairro"); // Chamando a api de status
        const dados = await res.json();

        const bairroStatus = dados.find(b => normalizarTexto(b.bairro) === normalizarTexto(feature.properties.NM_BAIRRO));

        const coresPorStatus = {
            "NORMAL": "#22c55e",
            "SEM_ABASTECIMENTO": "#ef4444",
            "FORNECIMENTO_IRREGULAR": "#f97316",
        };

        const cor = bairroStatus ? coresPorStatus[bairroStatus.status] : "#3b3737";

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

        statusInfo(nomeBusca);

    } catch (error) {
        console.error(error);
        mostrarToast("Erro ao pesquisar localização", "red");
    }
}

async function statusInfo(nome) {
    const painelStatusInfo = document.getElementById("cardStatus");

    try {
        const res = await fetch(`/status/buscar/dados/${encodeURIComponent(nome)}`);
        const data = await res.json();

        painelStatusInfo.innerHTML = data.map(bairro => `
            <div class="cardHeader">
                <i class="ph-fill ph-map-pin"></i>
                <div class="cardHeaderContant">
                    <p>${(bairro.bairro).charAt(0).toUpperCase() + bairro.bairro.slice(1).toLowerCase()}</p>
                    <p>Salvador - BA · <span> Atualizado em: ${formatarData(bairro.atualizado_em) || "Sem Atualização"}</span></p>
                </div>
                <div class="status">
                    <p class="bagde ${colorStatus(bairro.status)}">${bairro.status.replace(/_/g, ' ').charAt(0).toUpperCase() + bairro.status.replace(/_/g, ' ').slice(1).toLowerCase()}</p>
                    <p>${bairro.causa_interrupcao || "Sem Interrupção"}</p>
                </div>
            </div>
            <div class="dataInterrupcaoRetorno">
                <div class="inicioInterrupcao">
                    <p><i class="ph-fill ph-clock"></i> Inicio da Interrupção:</p>
                    <p>${formatarData(bairro.inicio_interrupcao, bairro.status) || " "}</p>
                </div>
                <p>-</p>
                <div class="prevRetorno">
                    <p><i class="ph-fill ph-clock-clockwise"></i> Previsão de Retorno:</p>
                    <p>${formatarData(bairro.previsao_retorno, bairro.status) || " "}</p>
                </div>
            </div>
            <div class="cardBody">
                <div class="cardItem areaAfetada">
                    <p>Área Afetada:</p>
                    <p>${(bairro.area_afetada || "-").replace(/_/g, ' ')}</p>
                </div>
                <div class="cardItem pressaoAgua">
                    <p>Pressão da água:</p>
                    <p>${(bairro.pressao_rede || "-").replace(/_/g, ' ')}</p>
                </div>
                <div class="cardItem medResolucao">
                    <p>Medida de Resolução:</p>
                    <p>${(bairro.medida_solucao || "-").replace(/_/g, ' ')}</p>
                </div>
                <div class="cardItem descInfo">
                    <p>Descrição: <br> ${bairro.descricao || "Sem descrição"}</p>
                </div>
            </div>
        `).join("");

        painelStatusInfo.style.display = "block";
        painelStatusInfo.scrollIntoView({ behavior: "smooth", block: "center" });

        // document.getElementById("btnFecharPainel").addEventListener("click", () => {
        //     document.getElementById("cardStatus").style.display = "none",
        //     document.getElementById("section-map").scrollIntoView({ behavior: "smooth", block: "start"});
        // });

    } catch (error) {
        console.log("Erro: ", error);
        mostrarToast("Informações não encontradas", "red");
    }
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
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function formatarData(data, status) {

    if (status === "NORMAL") {
        return null;
    } else {
        const dataFormatada = new Date(data);

        return dataFormatada.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }


}
