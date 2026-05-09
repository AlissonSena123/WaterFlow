const { supabase } = require("../config/supabase");
const { enviarRespostaReport } = require("../public/services/emailServices.js");
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

/* ---- ROTA PARA RESPONDER REPORTE DO USUÁRIO ---- */
router.post("/api/reports/:id/responder", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resposta } = req.body;

        const statusValidos = ["recebido", "em_analise", "resolvido"];
        if (!statusValidos.includes(status)) {
            return res.status(400).json({ success: false, erro: "Status inválido." });
        }
        if (!resposta || resposta.trim() === "") {
            return res.status(400).json({ success: false, erro: "Resposta não pode ser vazia." });
        }

        const { data: reporte, error: erroReporte } = await supabase
            .from("reportUsers")
            .select("*")
            .eq("id", id)
            .single();

        if (erroReporte || !reporte) {
            return res.status(404).json({ success: false, erro: "Reporte não encontrado." });
        }

        const { error: erroUpdate } = await supabase
            .from("reportUsers")
            .update({
                status,
                resposta_admin: resposta.trim(),
                respondido_em:  new Date().toISOString(),
            })
            .eq("id", id);

        if (erroUpdate) {
            return res.status(500).json({ success: false, erro: erroUpdate.message });
        }

        const labelStatus = {
            recebido:   "Recebido",
            em_analise: "Em análise",
            resolvido:  "Resolvido",
        };

        await supabase
            .from("notificacoes")
            .insert({
                usuario_email: reporte.email,
                reporte_id: Number(id),
                mensagem: `Seu reporte foi respondido, verifique seu email!`,
            });

        await enviarRespostaReport({
            para:     reporte.email,
            nome:     reporte.nome,
            bairro:   reporte.bairro,
            status:   labelStatus[status],
            resposta: resposta.trim(),
        });

        res.json({ success: true, mensagem: "Resposta enviada com sucesso." });

    } catch (error) {
        res.status(500).json({ success: false, erro: error.message });
    }
});
module.exports = router;
