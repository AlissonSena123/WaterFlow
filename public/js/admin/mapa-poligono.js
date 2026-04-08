import { mostrarToast } from "../utils/toast.js";
import { criarMapa } from "../utils/mapaConfig.js";

let map;
let municipiosData;

criarMapa("map", [-38.5167, -12.9704], 12)
    .then(m => {

        map = m;

        map.setMinZoom(10);
        map.setMaxZoom(16);

        map.setMaxBounds([
            [-38.70, -13.20],
            [-38.20, -12.70]
        ]);

        const draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                polygon: true,
                trash: true
            }
        });

        map.on("load", () => {

            map.addControl(draw);

            fetch("/assets/mapas/salvador_bairros.geojson")
                .then(res => res.json())
                .then(data => {

                    municipiosData = data;

                    map.addSource("municipios", {
                        type: "geojson",
                        data: municipiosData,
                    });

                    map.addLayer({
                        id: "municipios-layer",
                        type: "fill",
                        source: "municipios",
                        paint: {
                            "fill-color": [
                                "match",
                                ["feature-state", "status"],
                                "falta_agua", "#ff0000",
                                "manutencao", "#ffaa00",
                                "NORMAL", "#00cc66",
                                "#2b72e4"
                            ],
                            "fill-opacity": 0.35,
                            "fill-outline-color": "#003366"
                        }
                    });

                    map.addLayer({
                        id: "municipios-layer-highlight",
                        type: "fill",
                        source: "municipios",
                        paint: {
                            "fill-color": "#0ec49d",
                            "fill-opacity": 0.2,
                        },
                        filter: ["==", ["get", "NM_BAIRRO"], ""]
                    });

                    map.addLayer({
                        id: "municipios-line",
                        type: "line",
                        source: "municipios",
                        paint: {
                            "line-color": "#2c2927",
                            "line-width": 2
                        },
                        filter: ["==", ["get", "NM_BAIRRO"], ""]
                    });

                });
        });

        // CLICK NO MAPA
        map.on("click", "municipios-layer", async (e) => {

            const nomeMunicipio = e.features[0].properties.NM_BAIRRO;
            const nomeBairro = normalizarTexto(nomeMunicipio);

            document.getElementById("buscarArea").value = nomeMunicipio;

            map.setFilter("municipios-layer-highlight", ["==", ["get", "NM_BAIRRO"], nomeMunicipio]);
            map.setFilter("municipios-line", ["==", ["get", "NM_BAIRRO"], nomeMunicipio]);

            modal(nomeBairro);
        });
    });

// INPUT
document.getElementById("buscarArea").addEventListener("keydown", (input) => {
    if (input.key === "Enter") {
        buscarRegiao(input.target.value);
    }
});

document.getElementById("btnSeach").addEventListener("click", () => {
    buscarRegiao(document.getElementById("buscarArea").value);
});


async function buscarRegiao(nome) { // Essa função vai buscar a região no mapa quando o admin digitar o nome do bairro na barra de pesquisa

    if (!nome) {
        mostrarToast("Digite um bairro!", "red");
        return;
    }

    if (!municipiosData) {
        mostrarToast("Mapa ainda carregando...", "orange");
        return;
    }

    const nomeBusca = normalizarTexto(nome);


    let featureEncontrada = null;

    featureEncontrada = municipiosData.features.find(f =>
        normalizarTexto(f.properties.NM_BAIRRO) === nomeBusca
    );

    if (!featureEncontrada) {
        mostrarToast("Bairro não encontrado!", "red");
        return;
    }

    const bbox = turf.bbox(featureEncontrada);

    map.fitBounds(bbox, { padding: 40, duration: 1000 });

    map.setFilter("municipios-layer-highlight", ["==", ["get", "NM_BAIRRO"], featureEncontrada.properties.NM_BAIRRO]);
    map.setFilter("municipios-line", ["==", ["get", "NM_BAIRRO"], featureEncontrada.properties.NM_BAIRRO]);

    modal(nomeBusca);
}


async function buscarDadosBairro(nome) { // Nessa função, vamos buscar as informações de status do mapa
    try {
        const response = await fetch(`/admin/api/status/${encodeURIComponent(nome)}`); // Chamando a api 
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function modal(nome) { // Função do Modal
    const painel = document.querySelector(".painel-body");
    painel.innerHTML = "<p style='color:#aaa;font-size:0.8rem'>Carregando...</p>";

    const data = await buscarDadosBairro(nome);

    if (!data || data.length === 0) {
        painel.innerHTML = "<p style='color:#aaa;font-size:0.8rem'>Nenhum resultado encontrado.</p>";
        return;
    }

    // Mapeia as informações retornadas na variavel data
    painel.innerHTML = data.map(bairro => `
        <div class="painel-item">
            <div class="painel-item-header">
                <span class="painel-nome">${(bairro.bairro).toUpperCase()}</span>
            </div>
            <div class="painel-info">
                <div> <b><i class="ph-fill ph-chart-bar"></i> Status:</b> <span class="badge ${colorStatus(bairro.status)}"> ${bairro.status}</span></div>
                <span><b>Nível:</b> ${bairro.intensidade || "-"}</span>
            </div>
            <div class="painel-item-footer">
                <button type="button" class="btn-update"
                    data-bairro="${bairro.bairro}"
                    data-status="${bairro.status}"
                    data-intensidade="${bairro.intensidade || ""}"
                    data-retorno="${bairro.retorno || ""}"
                    data-descricao="${bairro.descricao || ""}">
                    Atualizar Status
                </button>
            </div>
        </div>
    `).join("");

    document.querySelectorAll(".btn-update").forEach(btn => {
        btn.addEventListener("click", () => {
            const { bairro, status, intensidade, retorno, descricao } = btn.dataset;
            const painelUpdate = document.getElementById("painelStatusUpdate");
            
            if (status === "NORMAL") {
                document.getElementById("idNivel").disabled = true;
                document.getElementById("idRetorn").disabled = true;
                document.getElementById("idDesc").disabled = true;
                document.getElementById("idNivel").value = "";
                document.getElementById("idRetorn").value = "";
                document.getElementById("idDesc").value = "";
            } else {
                document.getElementById("idNivel").disabled = false;
                document.getElementById("idRetorn").disabled = false;
                document.getElementById("idDesc").disabled = false;
            }

            document.getElementById("idBairro").value = bairro;
            document.getElementById("idStatus").value = status;
            document.getElementById("idNivel").value = intensidade;
            document.getElementById("idRetorn").value = retorno;
            document.getElementById("idDesc").value = descricao;

            painelUpdate.style.display = "block";
            painelUpdate.scrollIntoView({ behavior: "smooth", block: "center"}); // Função para scrollar até o painel de update

        });
    });

    document.getElementById("statusBairro").classList.remove("oculto");

    document.getElementById("fecharPainel").onclick = () => {
        document.getElementById("statusBairro").classList.add("oculto");
    };
}

// Ativar e Desativar as outras opções caso o status seja Normal ou Diferente de Normal
document.getElementById("idStatus").addEventListener("change", () => {
    const status = document.getElementById("idStatus").value;

    if (status === "NORMAL") {
        document.getElementById("idNivel").disabled = true;
        document.getElementById("idRetorn").disabled = true;
        document.getElementById("idDesc").disabled = true;
        document.getElementById("idNivel").value = "";
        document.getElementById("idRetorn").value = "";
        document.getElementById("idDesc").value = "";
    } else {
        document.getElementById("idNivel").disabled = false;
        document.getElementById("idRetorn").disabled = false;
        document.getElementById("idDesc").disabled = false;
    }
});

document.querySelector("#painelStatusUpdate button").addEventListener("click", async () => {
    const bairro = document.getElementById("idBairro").value;
    const status = document.getElementById("idStatus").value;
    const intensidade = document.getElementById("idNivel").value;
    const retorno = document.getElementById("idRetorn").value;
    const descricao = document.getElementById("idDesc").value;

    const response = await fetch(`/admin/api/status/${encodeURIComponent(bairro)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, intensidade, retorno, descricao })
    });

    const result = await response.json();

    if (response.ok) {
        mostrarToast("Status atualizado com sucesso!", "green");
        document.getElementById("painelStatusUpdate").style.display = "none";
        document.getElementById("map").scrollIntoView({behavior: "smooth", block: "center"});
    } else {
        mostrarToast(result.erro || "Erro ao atualizar!", "red");
    }
});

function colorStatus(status) { // Dependendo do status do bairro, o estilo da variavel muda
    const s = status.toUpperCase();
    if (s === "NORMAL") return "badge-active";
    if (s === "FALTA_DE_AGUA") return "badge-high";
    if (s === "INSTABILIDADE") return "badge-med";
    if (s === "MANUTENCAO") return "badge-review";
}

function normalizarTexto(texto) { // Formatar o texto
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
