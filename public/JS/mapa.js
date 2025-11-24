const MAP_KEY = "5yDkAyUnk2OjVK3NqvCe"; // Chave do Mapa

//Configurando o Mapa
const map = new maplibregl.Map({
    container: "map", // id do seletor html. EX: <div id="map"></div>
    style: `https://api.maptiler.com/maps/basic/style.json?key=${MAP_KEY}`, // Estilo do mapa
    center: [-38.4767, -12.9688], // Localização
    zoom: 12 // Zoom do Mapa
});


// Limitando o movimento do mapa
map.setMaxBounds([
    [-38.70, -13.20], 
    [-38.20, -12.70] 
]);

map.addControl(new maplibregl.NavigationControl()); // Adicionar controle de Zoom