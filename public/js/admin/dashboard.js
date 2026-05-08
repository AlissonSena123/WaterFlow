import { criarMapa } from "../utils/mapaConfig.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
    "https://vpdaqjfglnctqsbjmnzj.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZGFxamZnbG5jdHFzYmptbnpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzY4MDAsImV4cCI6MjA4OTUxMjgwMH0.gYToKUR_f3-rCiyX2T0UvCU64A3htRAYTgpr6vLr864"
);

let map;
let municipiosData;

const coresStatus = {
    NORMAL:                { fill: "#00cc66", line: "#00cc66" },
    SEM_ABASTECIMENTO:     { fill: "#ff0000", line: "#ff0000" },
    FORNECIMENTO_IRREGULAR:{ fill: "#ff7700", line: "#ff7700" },
    SEM_STATUS:            { fill: "#3b3737", line: "#3b3737" },
};

/* ---- FUNÇÃO PARA FORMATAR O TEXTO ---- */
function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, " ")
        .replace(/[-\s]/g, "")
        .trim();
}

function expressaoDeCores(propriedade) {
    return [
        "match", ["get", "status"],
        "NORMAL",                 coresStatus.NORMAL[propriedade],
        "FORNECIMENTO_IRREGULAR", coresStatus.FORNECIMENTO_IRREGULAR[propriedade],
        "SEM_ABASTECIMENTO",      coresStatus.SEM_ABASTECIMENTO[propriedade],
        coresStatus.SEM_STATUS[propriedade],
    ];
}

criarMapa("map", [-38.5167, -12.9704], 12).then(m => {
    map = m;

    map.setMinZoom(8);
    map.setMaxZoom(15);
    map.setMaxBounds([[-38.70, -13.20], [-38.20, -12.70]]);

    map.on("load", async () => {
        const [geojson, statusData] = await Promise.all([
            fetch("/assets/mapas/salvador_bairros.geojson").then(r => r.json()),
            fetch("/status/bairro").then(r => r.json()),
        ]);

        municipiosData = geojson;

        const statusPorBairro = Object.fromEntries(
            statusData.map(item => [normalizarTexto(item.bairro), item.status])
        );

        geojson.features.forEach(f => {
            const nome = f.properties.NM_BAIRRO?.trim().toUpperCase();
            f.properties.status = statusPorBairro[normalizarTexto(nome)] ?? "SEM_STATUS";
        });

        map.addSource("municipios", { type: "geojson", data: geojson, promoteId: "NM_BAIRRO" });

        //layer do poligono
        map.addLayer({
            id: "municipios-fill",
            type: "fill",
            source: "municipios",
            paint: { "fill-color": expressaoDeCores("fill"), "fill-opacity": 0.5 },
        });

        // Layer da borda
        map.addLayer({
            id: "municipios-line",
            type: "line",
            source: "municipios",
            paint: { "line-color": expressaoDeCores("line"), "line-width": 2 },
        });

        await buscarBairrosSemAbastecimento();
    });
});

async function contagemDeStatusIguais() {
    try {
        const data = await fetch("/status/contagem").then(r => r.json());
        document.getElementById("statusFalta").innerHTML     = data.SEM_ABASTECIMENTO      || 0;
        document.getElementById("statusIrregular").innerHTML = data.FORNECIMENTO_IRREGULAR || 0;
        document.getElementById("statusNormal").innerHTML    = data.NORMAL                 || 0;
    } catch (error) {
        console.error("Erro ao buscar contagem de status:", error);
    }
}

async function buscarBairrosSemAbastecimento() {
    try {
        const bairros = await fetch("/status/buscar/bairros/sem-abastecimento").then(r => r.json());
        const tbody = document.querySelector("#ReviewDashboard table tbody");

        tbody.innerHTML = bairros.length === 0
            ? '<tr><td colspan="4">Nenhum bairro sem abastecimento</td></tr>'
            : bairros.map(b => {
                const feature = municipiosData.features.find(f =>
                    normalizarTexto(f.properties.NM_BAIRRO) === normalizarTexto(b.bairro)
                );
                const nomeBairro = feature?.properties.NM_BAIRRO ?? b.bairro;

                return `
                <tr>
                    <td>${nomeBairro}</td>
                    <td>${b.causa_interrupcao.replace(/_/g, " ").toLowerCase()}</td>
                    <td>${b.medida_solucao.replace(/_/g, " ").toUpperCase()}</td>
                </tr>`;
            }).join("");
    } catch (error) {
        console.log("Erro: ", error);
    }
}

async function adminLogado() {
    try {
        const { user: { nome_completo } } = await fetch("/me").then(r => r.json());
        console.log(nome_completo);
        document.getElementById("adminLogged").innerHTML = nome_completo;
    } catch (error) {
        console.log("Error", error);
    }
}

supabase
    .channel("abastecimento-changes")
    .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "abastecimento" },
        ({ new: { bairro, status } }) => {
            municipiosData.features.forEach(feature => {
                if (normalizarTexto(feature.properties.NM_BAIRRO) === normalizarTexto(bairro))
                    feature.properties.status = status;
            });

            // Atualiza a source do mapa com os novos dados
            map.getSource("municipios").setData(municipiosData);
        }
    )
    .subscribe();

adminLogado();

// Chamando a função de contagem
contagemDeStatusIguais();
setInterval(contagemDeStatusIguais, 5000); // Atualizar a cada 5 segundos