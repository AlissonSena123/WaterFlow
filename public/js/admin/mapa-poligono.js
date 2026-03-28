import { mostrarToast } from "../utils/toast.js";
import { criarMapa } from "../utils/mapaConfig.js"; // Importamos o script das configurações do mapa

// Variaveis importantes, vai permitir que a gente utilize os métodos do mapa fora da função a seguir
let map;
let municipiosData;

criarMapa("map", [-38.5167, -12.9704], 12) // Fazemos uma função de callback assincrona
    .then(m => { // O valor retornado pela função do mapaConfig.js é armazenado em "m"

        map = m; // Agora a variavel "map" tem o valor de "m", agora podemos utilizar os recursos do mapa fora da função de callback assincrona

        // Definindo valor maximo e minimo do zoom
        map.setMinZoom(10);
        map.setMaxZoom(16);

        // Limitando o movimento do mapa
        map.setMaxBounds([
            [-38.70, -13.20],
            [-38.20, -12.70]
        ]);

        // Com isso, podemos desenha poligonos pelo mapa
        const draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                polygon: true,
                trash: true
            }
        });

        // Método para escutar eventos no mapa
        map.on("load", () => { // Após o mapa carregar

            map.addControl(draw); // Adicionamos a função de desenhar no controle do mapa

            fetch("/assets/mapas/salvador_bairros.geojson") // Chamando o geojson e criando mais uma função de callback, dessa vez sem ser assincrona
                .then(res => res.json())
                .then(data => {

                    municipiosData = data; // Armazenamos o valor de data na variavel "municipiosData"

                    map.addSource("municipios", {
                        type: "geojson",
                        data: municipiosData,
                    });

                    //layer do mapa todo de salvador
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
                                "ok", "#00cc66",

                                "#2b72e4"
                            ],

                            "fill-opacity": 0.35,
                            "fill-outline-color": "#003366"
                        }
                    });

                    // Layer de destaque
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

                    //layer de borda do destaque
                    map.addLayer({
                        id: "municipios-line",
                        type: "line",
                        source: "municipios",
                        paint: {
                            "line-color": "#2c2927",
                            "line-width": 2
                        },
                        filter: ["==", ["get", "NM_BAIRRO"], ""]
                    })

                });
        });

        // CLICK NO MAPA
        map.on("click", "municipios-layer", (e) => {

            const nomeMunicipio = e.features[0].properties.NM_BAIRRO;
            
            document.getElementById("buscarArea").value = nomeMunicipio;

            // agora só altera o filtro
            map.setFilter("municipios-layer-highlight", [
                "==",
                ["get", "NM_BAIRRO"],
                nomeMunicipio
            ]);

            map.setFilter("municipios-line", [
                "==",
                ["get", "NM_BAIRRO"],
                nomeMunicipio
            ]);
            const nomeBairro = normalizarTexto(nomeMunicipio);
            carregarStatusBairro(nomeBairro);
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

async function buscarRegiao(nome) {

    if (!nome) {
        mostrarToast("Digite um bairro!", "red");
        return;
    }

    if (!municipiosData) {
        mostrarToast("Mapa ainda carregando...", "orange");
        return;
    }

    const nomeBusca = normalizarTexto(nome);

    if (nomeBusca.length < 3) {
        mostrarToast("Digite pelo menos 3 letras", "orange");
        return;
    }

    let featureEncontrada = null;

    featureEncontrada = municipiosData.features.find(f =>
        normalizarTexto(f.properties.NM_BAIRRO) === nomeBusca
    );

    if (!featureEncontrada) {
        const resultados = municipiosData.features.filter(f =>
            normalizarTexto(f.properties.NM_BAIRRO).startsWith(nomeBusca)
        );

        if (resultados.length === 1) {
            featureEncontrada = resultados[0];
        } else if (resultados.length > 1) {
            mostrarToast("Vários bairros encontrados. Seja mais específico.", "orange");
            return;
        }
    }

    if (!featureEncontrada) {
        const resultados = municipiosData.features.filter(f =>
            normalizarTexto(f.properties.NM_BAIRRO).includes(nomeBusca)
        );

        if (resultados.length === 1) {
            featureEncontrada = resultados[0];
        } else if (resultados.length > 1) {
            mostrarToast("Digite mais específico (vários bairros encontrados)", "orange");
            return;
        }
    }

    if (!featureEncontrada) {
        mostrarToast("Bairro não encontrado!", "red");
        return;
    }

    const bbox = turf.bbox(featureEncontrada);

    map.fitBounds(bbox, {
        padding: 40,
        duration: 1000
    });

    map.setFilter("municipios-layer-highlight", [
        "==",
        ["get", "NM_BAIRRO"],
        featureEncontrada.properties.NM_BAIRRO
    ]);

    map.setFilter("municipios-line", [
        "==",
        ["get", "NM_BAIRRO"],
        featureEncontrada.properties.NM_BAIRRO
    ]);

    carregarStatusBairro(nomeBusca);
}

function normalizarTexto(texto){
    return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, " ")
            .trim();
}

async function carregarStatusBairro(nome) {
    const tbody = document.querySelector("#statusBairro tbody");
    tbody.innerHTML = "";

    try {

        const response = await fetch(`/admin/api/status/${encodeURIComponent(nome)}`);
        const data = await response.json();

        if(!data || data.length === 0){
            tbody.innerHTML = `<tr> <td colspan="6">Nenhum resultado encontrado</td> </tr>`;
            return;
        }

        data.forEach(bairro => {
            const colorClass = colorStatus(bairro.status);
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${(bairro.bairro).toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</td>
                <td class="${colorClass}">${bairro.status}</td>
                <td>${bairro.intensidade || "-"}</td>
                <td>${bairro.retorno || "-"}</td>
                <td>${bairro.descricao || "-"}</td>
            `;

            tbody.appendChild(tr);
        })

    } catch (error) {
        console.error(error);
    }
}

// Definir cores do status
function colorStatus(status) {
    const s = status.toUpperCase();

    if (s === "NORMAL") return "badge-active";
    if (s === "FALTA_DE_AGUA") return "badge-high";
    if (s === "INSTABILIDADE") return "badge-med";
    if (s === "MANUTENCAO") return "badge-review";

}