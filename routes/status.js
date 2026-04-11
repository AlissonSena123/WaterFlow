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

        if (status !== "NORMAL" && (!causa_interrupcao || !previsao_retorno || !area_afetada || !medida_solucao || !inicio_interrupcao)) {
            return res.status(400).json({ message: "Preencha os valores obrigatórios" });
        }

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
                    inicio_interrupcao: inicio_interrupcao,
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
            .eq("bairro", req.params.bairro)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ erro: "Bairro não encontrado" });

        res.json({ message: "Status atualizado com sucesso!", data: data[0] });
        console.log(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao atualizar status" });
    }
});

router.get("/contagem", async (req, res) => {
    try {
        const {data, error} = await supabase
            .from("abastecimento")
            .select("status")

        if (error) return res.status(500).json({ error })

        const contagem = data.reduce((result, row) => {
            result[row.status] = (result[row.status] || 0) + 1
            return result;
        }, {});

        res.json(contagem)

    } catch (error) {
        return res.status(500).json({ error });
    }
})

module.exports = router;