import { mostrarToast } from "../utils/toast.js";
import { criarMapa } from "../utils/mapaConfig.js";

let map;
let municipiosData;

criarMapa("map", [-38.5167, -12.9704], 12)
    .then(m => {

        map = m;

        map.setMinZoom(10);
        map.setMaxZoom(16);

        map.setMaxBounds([
            [-38.70, -13.20],
            [-38.20, -12.70]
        ]);

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
                        data: municipiosData,
                    });

                    map.addLayer({
                        id: "municipios-layer",
                        type: "fill",
                        source: "municipios",
                        paint: {
                            "fill-color": [
                                "match",
                                ["feature-state", "status"],
                                "SEM_ABASTECIMENTO", "#ff0000",
                                "FORNECIMENTO_IRREGULAR", "#ff7700",
                                "NORMAL", "#00cc66",
                                "#aeffd5"
                            ],
                            "fill-opacity": 0.35,
                            "fill-outline-color": "#003366"
                        }
                    });

                    map.addLayer({
                        id: "municipios-layer-highlight",
                        type: "fill",
                        source: "municipios",
                        paint: {
                            "fill-color": "#0ec49d",
                            "fill-opacity": 0.2,
                        },
                        filter: ["==", ["get", "NM_BAIRRO"], ""]
                    });

                    map.addLayer({
                        id: "municipios-line",
                        type: "line",
                        source: "municipios",
                        paint: {
                            "line-color": "#2c2927",
                            "line-width": 2
                        },
                        filter: ["==", ["get", "NM_BAIRRO"], ""]
                    });

                });
        });

        // CLICK NO MAPA
        map.on("click", "municipios-layer", async (e) => {

            const nomeMunicipio = e.features[0].properties.NM_BAIRRO;
            const nomeBairro = normalizarTexto(nomeMunicipio);

            document.getElementById("buscarArea").value = nomeMunicipio;

            map.setFilter("municipios-layer-highlight", ["==", ["get", "NM_BAIRRO"], nomeMunicipio]);
            map.setFilter("municipios-line", ["==", ["get", "NM_BAIRRO"], nomeMunicipio]);

            modal(nomeMunicipio, nomeBairro);
        });
    });


// INPUT
document.getElementById("buscarArea").addEventListener("keydown", (input) => {
    if (input.key === "Enter") {
        buscarRegiao(input.target.value);
    }
});

document.getElementById("btnSeach").addEventListener("click", () => {
    buscarRegiao(document.getElementById("buscarArea").value);
});


/* ---- FUNÇÃO ASSINCRONA PARA BUSCAR A REGIÃO NO MAPA ---- */
async function buscarRegiao(nome) { 

    if (!nome) {
        mostrarToast("Digite um bairro!", "red");
        return;
    }

    if (!municipiosData) {
        mostrarToast("Mapa ainda carregando...", "orange");
        return;
    }

    const nomeBusca = normalizarTexto(nome);


    let featureEncontrada = null;

    featureEncontrada = municipiosData.features.find(f =>
        normalizarTexto(f.properties.NM_BAIRRO) === nomeBusca
    );

    if (!featureEncontrada) {
        mostrarToast("Bairro não encontrado!", "red");
        return;
    }

    const bbox = turf.bbox(featureEncontrada);

    map.fitBounds(bbox, { padding: 40, duration: 1000 });

    map.setFilter("municipios-layer-highlight", ["==", ["get", "NM_BAIRRO"], featureEncontrada.properties.NM_BAIRRO]);
    map.setFilter("municipios-line", ["==", ["get", "NM_BAIRRO"], featureEncontrada.properties.NM_BAIRRO]);

    modal(featureEncontrada.properties.NM_BAIRRO, nomeBusca);
}



/* ---- FUNÇÃO ASSINCRONA DO MODAL COM OS STATUS DO BAIRRO ---- */
async function modal(nomeExibicao, nome) {
    const painel = document.querySelector(".painel-body");
    painel.innerHTML = "<p style='color:#aaa;font-size:0.8rem'>Carregando...</p>";

    const data = await buscarDadosBairro(nome);

    if (!data || data.length === 0) {
        painel.innerHTML = "<p style='color:#aaa;font-size:0.8rem'>Nenhum resultado encontrado.</p>";
        return;
    }

    // Mapeia as informações retornadas na variavel data
    painel.innerHTML = data.map(bairro => `
        <div class="painel-item">
            <div class="painel-item-header">
                <span class="painel-nome">${(nomeExibicao).toUpperCase()}</span>
                <span class="painel-atualizacao">Atualizado em: ${formatarData(bairro.atualizado_em)}</span>
            </div>
            <div class="painel-info">
                <div><b> Status Atual:</b> <span class="badge ${colorStatus(bairro.status)}">${bairro.status.replace(/_/g, ' ')}</span></div>
            </div>
            <div class="painel-item-footer">
                <button type="button" class="btn-update"
                    data-bairro-exibicao="${nomeExibicao}"
                    data-bairro="${bairro.bairro}"
                    data-status="${bairro.status}"
                    data-causa="${bairro.causa_interrupcao || ""}"
                    data-inicio="${bairro.inicio_interrupcao || ""}"
                    data-retorno="${bairro.previsao_retorno || ""}"
                    data-area="${bairro.area_afetada || ""}"
                    data-pressao="${bairro.pressao_rede || ""}"
                    data-medida="${bairro.medida_solucao || ""}"
                    data-descricao="${bairro.descricao || ""}"
                    data-atualizado="${formatarData(bairro.atualizado_em)}">
                    Atualizar Status
                </button>
            </div>
        </div>
    `).join("");

    document.querySelectorAll(".btn-update").forEach(btn => {
        btn.addEventListener("click", () => {
            const { bairro, bairroExibicao, status, causa, inicio, retorno, area, pressao, medida, descricao, atualizado } = btn.dataset;

            limparErros();

            const painelUpdate = document.getElementById("painelStatusUpdate");

            painelUpdate.dataset.bairro = bairro; 
            painelUpdate.dataset.bairroExibicao = bairroExibicao;

            const isNormal = status === "NORMAL";

            const camposExtras = ["idCausa", "idInicio", "idRetorno", "idArea", "idPressao", "idMedida", "idDesc"];

            camposExtras.forEach(id => {
                const el = document.getElementById(id);
                el.disabled = isNormal;
                if (isNormal) el.value = "";
            });

            document.getElementById("idBairro").value = bairro;
            document.getElementById("idBairro").textContent = bairroExibicao;
            document.getElementById("idStatus").value = status;
            document.getElementById("idAtualizado").innerHTML = atualizado;
            
            if (!isNormal) { // Se o status for diferente de Normal preenche os campos com os dados passados no botão 
                document.getElementById("idCausa").value   = causa;
                document.getElementById("idInicio").value  = inicio;
                document.getElementById("idRetorno").value = retorno;
                document.getElementById("idArea").value    = area;
                document.getElementById("idPressao").value = pressao;
                document.getElementById("idMedida").value  = medida;
                document.getElementById("idDesc").value    = descricao;
            }

            painelUpdate.style.display = "block";
            painelUpdate.scrollIntoView({ behavior: "smooth", block: "center"}); // Scrolla até o painel de update
            

        });
    });

    document.getElementById("statusBairro").classList.remove("oculto");

    document.getElementById("fecharPainel").onclick = () => {
        document.getElementById("statusBairro").classList.add("oculto");
    };
}



/* ---- FUNÇÃO ASSINCRONA PARA BUSCAR OS DADOS DO BAIRRO SELECIONADO ---- */
async function buscarDadosBairro(nome) { 
    try {
        const response = await fetch(`/status/buscar/dados/${encodeURIComponent(nome)}`); // Chamando a api 
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}



/* ---- ATIVAR OU DESATIVAR OS OUTROS CAMPOS DO PAINEL DE ATUALIZAÇÃO ---- */
document.getElementById("idStatus").addEventListener("change", () => {

    const isNormal = document.getElementById("idStatus").value === "NORMAL"; 
    const camposExtras = ["idCausa", "idInicio", "idRetorno", "idArea", "idPressao", "idMedida", "idDesc"];
    
    camposExtras.forEach(id => {
        const el = document.getElementById(id);
        el.disabled = isNormal;
        if (isNormal) el.value = "";
    });

    if (!isNormal) {
        const agora = new Date();
        const pad = n => String(n).padStart(2, "0");
        const formatado = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}T${pad(agora.getHours())}:${pad(agora.getMinutes())}`;
        document.getElementById("idInicio").value = formatado;
    }
    
    if (isNormal) limparErros(); // Se for Normal, tira o destaque
});



/* ---- FUNÇÃO DO BOTÃO DE CANCELAR ---- */
document.getElementById("btnCancelar").addEventListener("click", () => { // Esconde o painel de atualização e rola a tela de volta para o mapa.
    document.getElementById("painelStatusUpdate").style.display = "none";
    document.getElementById("map").scrollIntoView({ behavior: "smooth", block: "center" });
})



/* ---- FUNÇÃO PARA ATUALIZAR O STATUS DO BAIRRO ---- */
document.querySelector("#painelStatusUpdate #btnUpdate").addEventListener("click", async () => {
    
    const painelUpdate = document.getElementById("painelStatusUpdate");

    const bairro = painelUpdate.dataset.bairro;
    const bairroExibicao = painelUpdate.dataset.bairroExibicao;

    const status = document.getElementById("idStatus").value;
    const causa  = document.getElementById("idCausa").value;
    const inicio = document.getElementById("idInicio").value;
    const retorno = document.getElementById("idRetorno").value;
    const area = document.getElementById("idArea").value;
    const pressao = document.getElementById("idPressao").value;
    const medida = document.getElementById("idMedida").value;
    const descricao = document.getElementById("idDesc").value;

    limparErros();

    if (status !== "NORMAL") { // Só valida os campos obrigatórios se o status não for NORMAL
        const obrigatorios = ["idCausa", "idInicio", "idRetorno", "idArea", "idMedida", "idPressao"];

        //O .filter() retorna apenas os que estão vazios. Se houver algum inválido, destaca todos de uma vez
        const invalidos = obrigatorios.filter(id => !document.getElementById(id).value);

        if (invalidos.length > 0) {
            invalidos.forEach(id => destacarCampo(id));
            mostrarToast("Preencha os campos obrigatórios", "red");
            return;
        }
    }
 
    const response = await fetch(`/status/update/dados/${encodeURIComponent(bairro)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, causa_interrupcao: causa, inicio_interrupcao: inicio, previsao_retorno: retorno, area_afetada: area, pressao_rede: pressao, medida_solucao: medida, descricao })
    });
 
    const result = await response.json();
 
    if (response.ok) {
        mostrarToast(result.message, "green");
        document.getElementById("painelStatusUpdate").style.display = "none";
        document.getElementById("map").scrollIntoView({ behavior: "smooth", block: "center" });
        modal(bairroExibicao, bairro);
    } else {
        mostrarToast(result.erro, "red");
    }
});


/* ---- FUNÇÃO QUE DESTACA OS INPUTS QUE PRECISAM SER PREENCHIDOS ---- */
function destacarCampo(id) {
    const campo = document.getElementById(id);
    campo.classList.add("campo-invalido"); // Adiciona a classe aos campos obrigatorios

    campo.addEventListener("change", () => {
        campo.classList.remove("campo-invalido");
    }, { once: true });
}



/* ---- FUNÇÃO PARA LIMPAR OS ERROS DO INPUT ---- */
function limparErros() { // Percorre todos os elementos com a classe campo-invalido na página e remove o destaque de todos de uma vez
    document.querySelectorAll(".campo-invalido").forEach(el => el.classList.remove("campo-invalido"));
}



/* ---- FUNÇÃO PARA ESTILIZAR O STATUS DO MODAL ---- */
function colorStatus(status) { // Dependendo do status do bairro, o estilo da variavel muda
    const s = status.toUpperCase();
    if (s === "NORMAL") return "badge-active";
    if (s === "SEM_ABASTECIMENTO") return "badge-high";
    if (s === "FORNECIMENTO_IRREGULAR") return "badge-med";
}



/* ---- FUNÇÃO PARA FORMATAR O TEXTO ---- */
function normalizarTexto(texto) { // Formatar o texto
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function formatarData(data) {

    const dataUTC = data.includes("Z") ? data : data.replace(" ", "T") + "Z";

    const dataFormatada = new Date(dataUTC);

    return dataFormatada.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}
