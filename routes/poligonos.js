const express = require("express");
const router = express.Router();
const Poligono = require("../models/Poligono")

module.exports = router;


router.post("/", async (req,res) => {
    try{
        const { nome_area, geojson} = req.body;

        const poligono = await Poligono.create({
            nome_area,
            geojson
        })

        res.json(Poligono);
    }catch(err){
        res.status(500).json({
            erro: "Erro ao salvar poligono"
        })
    }
});

router.get("/", async (req, res) => {
    try{
        const poligonos = await Poligono.findAll();

        res.json(poligonos);
    }catch(err){
        res.status(500).json({
            erro: "Erro ao buscar poligonos"
        })
    }
})

router.delete("/:id", async (req, res) => {
    const {id} = req.params;

    await Poligono.destroy({
        where: {id}
    })

    res.json({ mensagem: "Poligono deletado"})
})