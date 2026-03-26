const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase.js");

//buscar status dos bairros
router.get("/", async(req, res) => {
    const { data, error } = await supabase.from("status_bairros").select("*");

    if(error) return res.status(500).json(error);

    res.json(data);
});

//salvar status dos bairros

router.post("/", async (req, res) => {
    const {bairro, status, tipo, periodo} = req.body;

    const {data, erro} = await 
})