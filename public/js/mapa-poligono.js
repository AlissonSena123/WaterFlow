import { mostrarToast } from "./utils/toast.js";

const MAP_KEY = "5yDkAyUnk2OjVK3NqvCe";

let municipiosData;

// Criar mapa
const map = new maplibregl.Map({
    container: "map",
    style: `https://api.maptiler.com/maps/basic/style.json?key=${MAP_KEY}`,
    center: [-38.4767, -12.9688],
    zoom: 12
});

// Limites do mapa
map.setMinZoom(10);
map.setMaxZoom(15);

map.setMaxBounds([
    [-38.70, -13.20],
    [-38.20, -12.70]
]);

// Draw
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
                data: data,
            });

            map.addLayer({
                id: "municipios-layer",
                type: "fill",
                source: "municipios",
                paint: {
                    "fill-color": "#0080ff",
                    "fill-opacity": 0.2,
                    "fill-outline-color": "#003366"
                }
            });

            // Layer de destaque
            map.addLayer({
                id: "municipios-layer-highlight",
                type: "fill",
                source: "municipios",
                paint: {
                    "fill-color": "#ff0000",
                    "fill-opacity": 0.4
                },
                filter: ["==", ["get", "NM_BAIRRO"], ""]
            });

        });

    carregarPoligonos();
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
});

// DELETE DRAW
map.on("draw.delete", (e) => {

    e.features.forEach(feature => {
        const id = feature.properties?.id;
        if (id) deletarPoligono(id);
    });

});

// SALVAR
document.getElementById("btnSalvar").addEventListener("click", () => {

    const data = draw.getAll();

    if (data.features.length === 0) {
        mostrarToast("Desenhe um poligono primeiro!", "red");
        return;
    }

    const geojson = data.features[0];

    salvarPoligono(geojson);
});

// BACKEND
function salvarPoligono(geojson) {

    const status = document.getElementById("status")?.value;

    fetch("/poligonos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nome_area: "Area sem agua",
            status: status,
            geojson: geojson
        })
    })
        .then(res => res.json())
        .then(data => {

            const features = draw.getAll().features;
            const ultimo = features[features.length - 1];

            ultimo.properties = {
                id: data.id
            };

        });
}

function carregarPoligonos() {
    fetch("/poligonos")
        .then(res => res.json())
        .then(poligonos => {
            poligonos.forEach(p => {
                if (p.geojson) draw.add(p.geojson);
            });
        });
}

function deletarPoligono(id) {
    fetch(`/poligonos/${id}`, {
        method: "DELETE"
    })
        .then(res => res.json())
        .then(data => {
            console.log("Poligono deletado", data);
        });
}

// INPUT
document.getElementById("buscarArea").addEventListener("keydown", (input) => {
    if (input.key === "Enter") {
        buscarRegiao(input.target.value);
    }
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

    const nomeBusca = nome.toLowerCase().trim();

    if (nomeBusca.length < 3) {
        mostrarToast("Digite pelo menos 3 letras", "orange");
        return;
    }

    let featureEncontrada = null;

    featureEncontrada = municipiosData.features.find(f =>
        f.properties.NM_BAIRRO.toLowerCase() === nomeBusca
    );

    if (!featureEncontrada) {
        const resultados = municipiosData.features.filter(f =>
            f.properties.NM_BAIRRO.toLowerCase().startsWith(nomeBusca)
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
            f.properties.NM_BAIRRO.toLowerCase().includes(nomeBusca)
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
}