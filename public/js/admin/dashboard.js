import { criarMapa } from "../utils/mapaConfig.js";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient("https://vpdaqjfglnctqsbjmnzj.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZGFxamZnbG5jdHFzYmptbnpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzY4MDAsImV4cCI6MjA4OTUxMjgwMH0.gYToKUR_f3-rCiyX2T0UvCU64A3htRAYTgpr6vLr864");

let map;
let municipiosData;

const coresStatus = {
    "NORMAL" : { fill: "#00cc66", line: "#00cc66" },
    "SEM_ABASTECIMENTO" : { fill: "#ff0000", line: "#ff0000"},
    "FORNECIMENTO_IRREGULAR" : { fill: "#ff7700", line: "#ff7700"},
    "SEM_STATUS" : { fill: "#3b3737", line: "#3b3737" }
}

criarMapa("map", [-38.5167, -12.9704], 12)
    .then(m => {
        map = m;

        map.setMinZoom(8);
        map.setMaxZoom(12); 
        map.setMaxBounds([
            [-38.70, -13.20], 
            [-38.20, -12.70] 
        ]);

        map.on("load", () => {
            Promise.all([
                fetch("/assets/mapas/salvador_bairros.geojson").then(res => res.json()),
                fetch("/status/bairro").then(res => res.json())
            ])
            .then(([geojson, statusData]) => {
                municipiosData = geojson;

                const statusPorBairro = {};

                statusData.forEach(item => {
                    statusPorBairro[normalizar(item.bairro)] = item.status;
                });

                geojson.features.forEach(features => {
                    const nomeBairro = features.properties.NM_BAIRRO?.trim().toUpperCase();
                    features.properties.status = statusPorBairro[normalizar(nomeBairro)] ?? "SEM_STATUS"
                });

                map.addSource("municipios", {
                    type: "geojson",
                    data: geojson,
                    promoteId: "NM_BAIRRO"
                });

                //layer do poligono
                    map.addLayer({
                        id: "municipios-fill",
                        type: "fill",
                        source: "municipios",
                        paint: {
                            "fill-color": [
                                "match", ["get", "status"],
                                "NORMAL", coresStatus.NORMAL.fill,
                                "FORNECIMENTO_IRREGULAR", coresStatus.FORNECIMENTO_IRREGULAR.fill,
                                "SEM_ABASTECIMENTO", coresStatus.SEM_ABASTECIMENTO.fill,
                                coresStatus.SEM_STATUS.fill 
                            ],
                            "fill-opacity": 0.5
                        },
                    });

                    // Layer da borda
                    map.addLayer({
                        id: "municipios-line",
                        type: "line",
                        source: "municipios",
                        paint: {
                            "line-color": [
                                "match", ["get", "status"],
                                "NORMAL", coresStatus.NORMAL.line,
                                "FORNECIMENTO_IRREGULAR", coresStatus.FORNECIMENTO_IRREGULAR.line,
                                "SEM_ABASTECIMENTO", coresStatus.SEM_ABASTECIMENTO.line,
                                coresStatus.SEM_STATUS.line 
                            ],
                            "line-width": 2
                        },
                    });
            });
                
        });
    });

supabase
    .channel("abastecimento-changes")
    .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "abastecimento" },
        (payload) => {
            const { bairro, status } = payload.new;

            // Atualiza a feature no GeoJSON em memória
            municipiosData.features.forEach(feature => {
                if (normalizar(feature.properties.NM_BAIRRO) === normalizar(bairro)) {
                    feature.properties.status = status;
                }
            });

            // Atualiza a source do mapa com os novos dados
            map.getSource("municipios").setData(municipiosData);
        }
    )
    .subscribe();

function normalizar(str) {
    return str
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // remove acentos
}
