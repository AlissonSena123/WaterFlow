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

// Criar ferramenta de desenho
const draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
        polygon: true,
        trash: true
    }
});

// Adicionar ao mapa quando carregar
map.on("load", () => {

    map.addControl(draw);

    fetch("/assets/mapas/salvador_bairros.geojson").then(res => res.json()).then(data => {

        municipiosData = data

        console.log("Carregado", data)

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
    })

    carregarPoligonos();

});

map.on("click", "municipios-layer", (e) => {
    const nomeMunicipio = e.features[0].properties.NM_BAIRRO;

    document.getElementById("buscarArea").value = nomeMunicipio;

    console.log("Municipios clicado", nomeMunicipio);
})

//identificar quando o mapa é apagado no front
map.on("draw.delete", (e) => {

    e.features.forEach(feature => {

        const id = feature.properties?.id;

        if (id) {

            deletarPoligono(id);

        }

    });

});

// BOTÃO SALVAR
document.getElementById("btnSalvar").addEventListener("click", () => {

    const data = draw.getAll();

    if (data.features.length === 0) {
        alert("Desenhe um poligono primeiro!")
        return;
    }

    const geojson = draw.getAll().features[0];

    console.log("GeoJSON:", geojson);

    salvarPoligono(geojson);

});

// SALVAR NO BACKEND
function salvarPoligono(geojson) {

    const status = document.getElementById("status").value;

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

            console.log("Poligono salvo", data);

            // adiciona o id do banco no poligono
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
                if (p.geojson) {
                    draw.add(p.geojson);
                }
            })
        })
}

//funçao para deletar o poligono
function deletarPoligono(id) {
    fetch(`/poligonos/${id}`, {
        method: "DELETE"
    }).then(res => res.json()).then(data => {
        console.log("Poligono deletado", data);
    })
}

function buscarRegiao(nome) { 

    if(!municipiosData) return;

    const regiao = municipiosData.features.find(f =>
        f.properties.NM_BAIRRO.toLowerCase().includes(nome.toLowerCase())
    );

    if(!regiao){
        alert("Região não encontrada!");
        return;
    }

    const bbox = turf.bbox(regiao);

    map.fitBounds(bbox, {
        padding: 40
    });
}

document.getElementById("buscarArea").addEventListener("keypress", (e) => {

    if(e.key === "Enter") {
        buscarRegiao(e.target.value);
    }

})

map.setPaintProperty(
    "municipios-layer",
    "fill-color",
    [
        "case",
        ["==", ["get", "name"], nome],
        "#ff0000",
        "#0080ff"
    ]
)