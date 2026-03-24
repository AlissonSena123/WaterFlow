import { mostrarToast } from "./utils/toast.js";

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


// Função da Barra de Pesquisa

const btnSearch = document.getElementById("btnSearch"); // Botão da barra de pesquisa
let marker = null // Variavel do marcador

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

    try {

        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(inputSearch)}.json?key=${MAP_KEY}&bbox=-38.60,-13.05,-38.30,-12.80&proximity=-38.5016,-12.9714&country=br`; // Link da API

        const response = await fetch(url); // Chamando a API com o fetch();
        const data = await response.json(); // Transformamos a resposta retorna pela variavel do fetch em um JSON
        
        // A API retorna o valor dentro de uma "features"
        const result = data.features.find(f => // o "find()" ele percorre toda a array até encontrar o valor que satisfaça a condição
            f.place_name.includes("Salvador") &&
            f.text.toLowerCase() === inputSearch
        );

        if(!result){
            mostrarToast("Bairro não encontrado em Salvador", "red");
            return;
        }

        const coordenadas = result.center;

        // mover mapa
        map.flyTo({
            center: coordenadas,
            zoom: 16,
            speed: 1.2,
            curve: 1.4,
            essential: true
        });

        // remover marcador antigo
        if(marker){
            marker.remove();
        }

        // criar novo pin
        marker = new maplibregl.Marker({color: "red"}).setLngLat(coordenadas).addTo(map);

    } catch (error) {

        console.error(error);
        mostrarToast("Erro ao pesquisar localização", "red");

    }

});
