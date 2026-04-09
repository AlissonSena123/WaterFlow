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

// Função da Barra de Pesquisa
const btnSearch = document.getElementById("btnSearch"); // Botão da barra de pesquisa

btnSearch.addEventListener("click", async () => { // Adicionamos a variavel do botão em uma lista de evento e criamos uma função assincrona

    const inputSearch = normalizarTexto(document.getElementById("search").value);

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
            normalizarTexto(f.properties.NM_BAIRRO) === inputSearch
        );

        if(!feature){
            mostrarToast("Bairro não encontrado", "red");
            return;
        }

        const res = await fetch("/status/bairro"); // Chamando a api de status
        const dados = await res.json();
        
        const bairroStatus = dados.find(b => normalizarTexto(b.bairro) === normalizarTexto(feature.properties.NM_BAIRRO));
        console.log("Status encontrado:", bairroStatus);

        const coresPorStatus = {
            "NORMAL":        "#22c55e",
            "SEM_ABASTECIMENTO": "#ef4444",
            "FORNECIMENTO_IRREGULAR": "#f97316",
            "MANUNTENCAO_PROGRAMADA":   "#2f67ff"
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

    } catch (error) {
        console.error(error);
        mostrarToast("Erro ao pesquisar localização", "red");
    }
});

function normalizarTexto(texto){
    return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, " ")
            .trim();
}
