    import { supabase } from "../config/supabase.js";
    import { enviarRespostaReport } from "../services/emailServices.js";
    import { Router } from "express";
    const router = Router();

    /**  ---- ROTA PARA BUSCAR REPORTES DOS USUÁRIOS ( GET /api/reports ) ---- */
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

    /* ---- ROTA PARA RESPONDER REPORTE DO USUÁRIO ( POST /api/reports/:id/responder ) ---- */
    router.post("/api/reports/:id/responder", async (req, res) => {
        try {
            const { id } = req.params; // Esse id em da URL
            const { status, resposta } = req.body;

            const statusValidos = ["recebido", "em_analise", "resolvido"]; // Lista com os status permitidos

            if (!statusValidos.includes(status)) { // Verifica se o status enviado existe no array
                return res.status(400).json({ success: false, erro: "Status inválido." });
            }

            if (!resposta || resposta.trim() === "") { // Verifica se a resposta existe
                return res.status(400).json({ success: false, erro: "Resposta não pode ser vazia." });
            }

            const { data: reporte, error: erroReporte } = await supabase // Consulta o supabase
                .from("reportUsers") // <= Nome da tabela
                .select("*") // <= Seleciona todas as colunas
                .eq("id", id) // <= Busca o reporte com o ID recebido
                .single(); // <= Espera apenas um objeto

            if (erroReporte || !reporte) { // Caso aconteça algum erro
                return res.status(404).json({ success: false, erro: "Reporte não encontrado." });
            }

            const { error: erroUpdate } = await supabase // Consulta o supabase de novo
                .from("reportUsers")
                .update({ // Faz a atualização no banco
                    status,
                    resposta_admin: resposta.trim(),
                    respondido_em:  new Date().toISOString(),
                })
                .eq("id", id);

            if (erroUpdate) {
                return res.status(500).json({ success: false, erro: erroUpdate.message });
            }

            const labelStatus = { // Objeto para converter
                recebido:   "Recebido",
                em_analise: "Em análise",
                resolvido:  "Resolvido",
            };

            try {
                await enviarRespostaReport({ // Chama função importada responsável por enviar email
                    para:     reporte.email, // Destinatario
                    nome:     reporte.nome, // Nome do usuário
                    bairro:   reporte.bairro, // Bairro do usuário
                    status:   labelStatus[status], // Converte o status técnico em texto
                    resposta: resposta.trim(), // Envia a resposta sem espaços extras
                });
            } catch (emailError) {
                console.error("Falha ao enviar email de resposta ao reporte. A atualização do banco foi mantida.", emailError);
            }

            res.json({ success: true, mensagem: "Resposta enviada com sucesso." });

        } catch (error) {
            res.status(500).json({ success: false, erro: error.message });
        }
    });

    export default router;
