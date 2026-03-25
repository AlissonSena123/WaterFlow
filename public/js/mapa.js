import { mostrarToast } from "./utils/toast.js";

let municipiosData;

const MAP_KEY = "5yDkAyUnk2OjVK3NqvCe"; // Chave do Mapa


//Configurando o Mapa
const map = new maplibregl.Map({
    container: "map", // id do seletor html. EX: <div id="map"></div>
    style: `https://api.maptiler.com/maps/basic/style.json?key=${MAP_KEY}`, // Estilo do mapa
    center: [-38.4767, -12.9688], // Localização
    zoom: 12 // Zoom do Mapa
});

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
                data: data
            });

            map.addLayer({
                id: "municipios-fill",
                type: "fill",
                source: "municipios",
                paint: {
                    "fill-color": "#6cb5ff",
                    "fill-opacity": 0.2,
                },
                filter: ["==", ["get", "NM_BAIRRO"], ""]
            });

            map.addLayer({
                id: "municipios-line",
                type: "line",
                source: "municipios",
                paint: {
                    "line-color": "#00377e",
                    "line-width": 1
                },
                filter: ["==", ["get", "NM_BAIRRO"], ""]
            });
        });
});

// Função da Barra de Pesquisa
const btnSearch = document.getElementById("btnSearch"); // Botão da barra de pesquisa

btnSearch.addEventListener("click", async () => { // Adicionamos a variavel do botão em uma lista de evento e criamos uma função assincrona

    const inputSearch = document // Variavel do input da pesquisa, só pegamos o valor digitado dentro do input
        .getElementById("search")
        .value
        .trim()
        .toLowerCase();

    if(!inputSearch){ // Se o input estiver vazio, a função de "mostrarToast" será chamada e irá ser retornada
        mostrarToast("Digite um bairro", "red");
        return;
    }

    if (!municipiosData) {
        mostrarToast("Mapa ainda carregando", "red");
        return;
    }

    try {

        const feature = municipiosData.features.find(f =>
            f.properties.NM_BAIRRO.toLowerCase() === inputSearch
        );

        if(!feature){
            mostrarToast("Bairro não encontrado", "red");
            return;
        }

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

    } catch (error) {
        console.error(error);
        mostrarToast("Erro ao pesquisar localização", "red");
    }
});



