const MAP_KEY = "5yDkAyUnk2OjVK3NqvCe";

const map = new maplibregl.Map({
    container: "map",
    style: `https://api.maptiler.com/maps/basic/style.json?key=${MAP_KEY}`,
    center: [-38.4767, -12.9688],
    zoom: 12
});

map.setMinZoom(10);
map.setMaxZoom(15);

map.setMaxBounds([
    [-38.70, -13.20], 
    [-38.20, -12.70] 
]);

map.on("load", async () => {

    const res = await fetch("/poligonos");
    const poligonos = await res.json();

    const geojson = {
        type: "FeatureCollection",
        features: poligonos.map(p => ({
            type: "Feature",
            geometry: p.geojson.geometry,
            properties: {
                cor: p.cor,
                nome: p.nome_area,
                status: p.status
            }
        }))
    };

    map.addSource("areas-sem-agua", {
        type: "geojson",
        data: geojson
    });

    map.addLayer({
        id: "areas-sem-agua-layer",
        type: "fill",
        source: "areas-sem-agua",
        paint: {
            "fill-color": ["get", "cor"],
            "fill-opacity": 0.5
        }
    });

});