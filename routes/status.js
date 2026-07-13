import { supabase } from "../config/supabase.js";
import { Router } from "express";
const router = Router();
import { enviarAlertaEmail } from "../services/emailServices.js";

router.get("/bairro", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("abastecimento")
            .select("bairro, status, causa_interrupcao, medida_solucao");

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
        const bairroBusca = req.params.bairro
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");

        const { data, error } = await supabase
            .from("abastecimento")
            .select(`
                bairro,
                status,
                causa_interrupcao,
                inicio_interrupcao,
                previsao_retorno,
                area_afetada,
                pressao_rede,
                medida_solucao,
                descricao,
                atualizado_em
            `);

        if (error) throw error;

        const resultado = data.filter(item => {
            const bairroBanco = item.bairro
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, "");

            return bairroBanco === bairroBusca;
        });

        res.json(resultado);

    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao buscar dados do bairro" });
    }
});

// router.get("/buscar/dados/:bairro", async (req, res) => {
//     try {
//         console.log("Recebido:", req.params.bairro);

//         const { data: dadoNovo } = await supabase
//             .from("abastecimento")
//             .select("bairro")
//             .ilike("bairro", `%${req.params.bairro}%`);

//         console.log(dadoNovo);

//         const { data, error } = await supabase
//             .from("abastecimento")
//             .select("bairro, status, causa_interrupcao, inicio_interrupcao, previsao_retorno, area_afetada, pressao_rede, medida_solucao, descricao, atualizado_em")
//             .eq("bairro", req.params.bairro);

//         if (error) throw error;

//         res.json(data);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ erro: "Erro ao buscar dados do bairro" });
//     }
// });

/** ---- API ATUALIZAR STATUS DO BAIRRO (PUT /update/dados/ ) ---- */

router.put("/update/dados/:bairro", async (req, res) => {
    try {

        const {
            status,
            causa_interrupcao,
            inicio_interrupcao,
            previsao_retorno,
            area_afetada,
            pressao_rede,
            medida_solucao,
            descricao
        } = req.body;

        console.log("Recebido PUT:", req.params.bairro);

        const bairroBusca = normalizarTexto(req.params.bairro);

        console.log("Bairro normalizado:", bairroBusca);

        // Busca todos os bairros cadastrados
        const { data: bairros, error: bairrosError } = await supabase
            .from("abastecimento")
            .select("bairro");

        if (bairrosError) throw bairrosError;

        const bairroEncontrado = bairros.find(item =>
            normalizarTexto(item.bairro) === bairroBusca
        );

        console.log("bairroBusca:", bairroBusca);
        console.log("bairroEncontrado:", bairroEncontrado);

        if (!bairroEncontrado) {
            return res.status(404).json({
                erro: "Bairro não encontrado."
            });
        }

        // Nome exatamente como está salvo no banco
        const bairro = bairroEncontrado.bairro;

        console.log("bairro utilizado no update:", bairro);

        const {
            data: statusAtualData,
            error: errorStatus
        } = await supabase
            .from("abastecimento")
            .select("status")
            .eq("bairro", bairro)
            .single();

        console.log("Status atual:", statusAtualData);
        console.log("Erro status:", errorStatus);

        if (errorStatus) throw errorStatus;

        const statusAtual = statusAtualData?.status;
        const statusMudou = statusAtual !== status;

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
                    causa_interrupcao,
                    inicio_interrupcao: inicio_interrupcao || null,
                    previsao_retorno,
                    area_afetada,
                    pressao_rede: pressao_rede || "NORMAL",
                    medida_solucao: medida_solucao || null,
                    descricao: descricao || null,
                    atualizado_em: new Date()
                };

        console.log(payload);

        const { data, error } = await supabase
            .from("abastecimento")
            .update(payload)
            .eq("bairro", bairro)
            .select();

        console.log("Resultado update:", data);
        console.log("Erro update:", error);

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({
                erro: "Bairro não encontrado."
            });
        }

        if (statusMudou) {

            const {
                data: usuarios,
                error: usuariosError
            } = await supabase
                .from("Users")
                .select("email, bairro");

            console.log("Erro usuários:", usuariosError);
            console.log("Usuarios encontrados:", usuarios);

            if (usuariosError) throw usuariosError;

            const usuariosFiltrados = usuarios.filter(user => {

                const bairroUsuario = normalizarTexto(user.bairro);

                console.log(
                    "Comparando:",
                    bairroUsuario,
                    "==",
                    bairroBusca
                );

                return bairroUsuario === bairroBusca;
            });

            console.log(
                `Enviando email para ${usuariosFiltrados.length} usuários`
            );

            try {
                await Promise.all(
                    usuariosFiltrados.map(user =>
                        enviarAlertaEmail(user.email, bairro, status)
                    )
                );
                console.log("Emails enviados com sucesso!");
            } catch (emailError) {
                console.error("Falha ao enviar emails de alerta. A atualização do banco foi mantida.", emailError);
            }
        }

        res.json({
            message: "Status atualizado com sucesso!",
            data: data[0]
        });

    } catch (error) {
        console.error("[PUT /status/update/dados] Erro detalhado:", {
            message: error?.message,
            code: error?.code,
            details: error?.details,
            hint: error?.hint,
            stack: error?.stack,
            bairro: req.params.bairro
        });

        res.status(500).json({
            message: "Erro ao atualizar status",
            erro: error?.message || "Erro desconhecido"
        });
    }
});

/** ---- API DE CONTAGEM DE BAIRROS COM STATUS IGUAIS (GET /contagem ) ---- */
router.get("/contagem", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("abastecimento")
            .select("status")

        if (error) return res.status(500).json({ error })

        const contagem = data.reduce((result, row) => {
            result[row.status] = (result[row.status] || 0) + 1
            return result;
        }, {});

        res.json(contagem);

    } catch (error) {
        return res.status(500).json({ error });
    }
});

/** ---- API BUSCAR OS BAIRROS SEM ABASTECIMENTO (GET /buscar/bairros/sem-abastecimento ) ---- */
router.get("/buscar/bairros/sem-abastecimento", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("abastecimento")
            .select("bairro, causa_interrupcao, medida_solucao")
            .eq("status", "SEM_ABASTECIMENTO")
            .order("atualizado_em", { ascending: true })

        if (error) return res.status(500).json({ error: error.message });
        res.json(data)

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

export default router;