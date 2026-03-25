export async function criarMapa(containerId, center, zoom) {
  const res = await fetch("/api/mapKey");
  const data = await res.json();

  const map = new maplibregl.Map({
    container: containerId,
    style: `https://api.maptiler.com/maps/basic/style.json?key=${data.key}`,
    center,
    zoom
  });

  return map;
}