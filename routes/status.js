const { supabase } = require("../config/supabase");
const express = require("express");
const router = express.Router();

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
                    causa_interrupcao: causa_interrupcao || null,
                    inicio_interrupcao: inicio_interrupcao || null,
                    previsao_retorno: previsao_retorno || null,
                    area_afetada: area_afetada || null,
                    pressao_rede: pressao_rede || "NORMAL",
                    medida_solucao: medida_solucao || null,
                    descricao: descricao || null,
                    atualizado_em: new Date()
                };

        const { data, error } = await supabase
            .from("abastecimento")
            .update(payload)
            .eq("bairro", req.params.bairro)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ erro: "Bairro não encontrado" });

        res.json({ mensagem: "Status atualizado com sucesso!", data: data[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao atualizar status" });
    }
});

module.exports = router;