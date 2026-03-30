const { supabase } = require("../config/supabase");
const express = require("express");
const router = express.Router();

router.get("/bairro", async (req, res) => {
    console.log("✅ Rota /status/bairro chamada");
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

module.exports = router;

