const { supabase } = require("../config/supabase");
const express = require("express");
const router = express.Router();

/**  ---- ROTA GET report /api/reports ---- */
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

module.exports = router;
