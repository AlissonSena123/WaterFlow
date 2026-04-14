const { supabase } = require("../config/supabase");
const express = require("express");
const router = express.Router();
const { enviarAlertaEmail } = require("../public/services/emailServices.js");

router.get("/bairro", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("abastecimento")
            .select("bairro, status");

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao buscar status dos bairros" });
    }
});

/** ---- API BUSCAR TODOS OS STATUS (GET /buscar/dados/ ) ---- */
router.get("/buscar/dados/:bairro", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("abastecimento")
            .select("bairro, status, causa_interrupcao, inicio_interrupcao, previsao_retorno, area_afetada, pressao_rede, medida_solucao, descricao")
            .eq("bairro", req.params.bairro);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao buscar dados do bairro" });
    }
});

/** ---- API ATUALIZAR STATUS DO BAIRRO (PUT /update/dados/ ) ---- */
router.put("/update/dados/:bairro", async (req, res) => {
    try {
        const { status, causa_interrupcao, inicio_interrupcao, previsao_retorno, area_afetada, pressao_rede, medida_solucao, descricao } = req.body;

        const bairro = req.params.bairro;

        const { data: statusAtualData, error: errorStatus } = await supabase
            .from("abastecimento")
            .select("status")
            .eq("bairro", bairro)
            .single();

        console.log("ERRO STATUS:", errorStatus);
        console.log("DATA STATUS:", statusAtualData);

        const statusAtual = statusAtualData?.status;

        const statusMudou = statusAtual !== status;

        console.log("StatusAtualData:", statusAtualData);

        // if (status !== "NORMAL" && (!causa_interrupcao || !previsao_retorno || !area_afetada || !medida_solucao)) {
        //     return res.status(400).json({ message: "Preencha os valores obrigatórios" });
        // }

        console.log("ANTES:", statusAtual);
        console.log("DEPOIS:", status);
        console.log("Mudou?", statusMudou);

        const payload =
            status === "NORMAL"
                ? {
                    status,
                    causa_interrupcao: null,
                    inicio_interrupcao: null,
                    previsao_retorno: null,
                    area_afetada: null,
                    pressao_rede: "NORMAL",
                    medida_solucao: null,
                    descricao: null,
                    atualizado_em: new Date()
                }
                : {
                    status,
                    causa_interrupcao: causa_interrupcao,
                    inicio_interrupcao: inicio_interrupcao || null,
                    previsao_retorno: previsao_retorno,
                    area_afetada: area_afetada,
                    pressao_rede: pressao_rede || "NORMAL",
                    medida_solucao: medida_solucao || null,
                    descricao: descricao || null,
                    atualizado_em: new Date()
                };

        const { data, error } = await supabase
            .from("abastecimento")
            .update(payload)
            .eq("bairro", bairro)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ erro: "Bairro não encontrado" });

        if (statusMudou) {
            const { data: usuarios } = await supabase
                .from("Users")
                .select("email, bairro");
            console.log("Usuarios encontrados:", usuarios);

            const usuariosFiltrados = usuarios.filter(u => {
                const b = u.bairro?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const bairroNormalizado = bairro.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                console.log("Comparando:", b, "==", bairroNormalizado);

                return b === bairroNormalizado;
            });

            console.log(`Enviando email para ${usuariosFiltrados.length} usuários`);

            usuariosFiltrados.forEach(user => {
                enviarAlertaEmail(user.email, bairro, status)
                    .catch(err => console.log("Erro ao enviar email: ", err))
            })
        };

        res.json({ message: "Status atualizado com sucesso!", data: data[0] });
        console.log(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao atualizar status" });
    }
});

module.exports = router;