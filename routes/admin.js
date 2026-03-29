const { supabase } = require("../config/supabase");
const express = require("express");
const router = express.Router();

/**  ---- ROTA de Verificar Reports ( GET /api/reports ) ---- */
router.get("/api/reports", async (req, res) => {
    try {
        let { nome, bairro, data } = req.query;

        let query = supabase
            .from("reportUsers")
            .select("*")
            .order("id", { ascending: false });

        // Remove espaços extras
        nome = nome?.trim();
        bairro = bairro?.trim();

        // Filtro por nome
        if (nome) {
            query = query.ilike("nome", `%${nome}%`);
        }

        // Filtro por bairro
        if (bairro) {
            query = query.ilike("bairro", `%${bairro}%`);
        }

        // Filtro por data
        if (data) {
            const inicio = new Date(data + "T00:00:00.000Z");
            const fim = new Date(data + "T23:59:59.999Z");

            query = query
                .gte("created_at", inicio.toISOString())
                .lte("created_at", fim.toISOString());
        }

        const { data: reports, error } = await query;

        if (error) {
            return res.json({ success: false, error });
        }

        res.json({ success: true, data: reports });

    } catch (error) {
        res.json({ success: false, error });
    }
});

/** ---- API BUSCAR TODOS OS STATUS (GET /api/status ) ---- */
router.get("/api/status", async (req, res) => {

    try {
        const { data, error } = await supabase
            .from("abastecimento")
            .select("*");

        if (error) {
            return res.status(500).json({ erro: error.message });
        }

        res.json(data);

    } catch (error) {
        console.error("ERRO GERAL:", error);
        res.status(500).json({ erro: error.message });
    }

});

/** ---- API BUSCAR OS STATUS POR NOME (GET /api/status/:nome ) ---- */
router.get("/api/status/:nome", async (req, res) => {
    const nome = req.params.nome;

    try {
        const { data, error } = await supabase
            .from("abastecimento")
            .select("*")
            .eq("bairro", nome);

        if (error) {
            console.error("ERRO SUPABASE:", error);
            return res.status(500).json({ erro: error.message });
        }

        console.log("DADOS:", data); 

        res.json(data);

    } catch (error) {
        console.error("ERRO GERAL:", error);
        res.status(500).json({ erro: error.message });
    }
});

router.put("/api/status/update/:id", async (req, res) => {

});

module.exports = router;
