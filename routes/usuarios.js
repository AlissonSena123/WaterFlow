const { supabase } = require("../config/supabase");
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const path = require("path");
const adminAuth = require("../middleware/adminAuth");
const { buscarUsuarioPorEmail } = require("../public/services/userService.js");
const { buscarFuncionarioPorEmail } = require("../public/services/funcionarioService.js");

// --- ROTAS DE CADASTRO ( POST /cadastrar ) ---
router.post("/cadastrar", async (req, res) => {
  const {
    nome_completo,
    data_nascimento,
    email,
    senha,
    telefone,
    cidade,
    estado,
    pais,
    bairro,
  } = req.body;


  if (!nome_completo || !email || !senha || !bairro || !data_nascimento || !telefone) {
    return res.status(400).json({ success: false, message: "Preencha todos os campos", });
  }

  if (senha.length < 10 || senha.length > 15) {
    return res.status(400).json({ success: false, message: "A senha deve teve possuir 10 a 15 caracteres " });
  }

  const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;

  if (!telefoneRegex.test(telefone)) {
    return res.status(400).json({ success: false, message: "Número de telefone inválido" });
  }

  try {

    const { data: userExistente, error: selectError } = await supabase
      .from("Users")
      .select("id")
      .eq("email", email);

    if (selectError) throw selectError;

    if (userExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Usuário já cadastrado",
      });
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Insere novo usuário
    const { error: insertError } = await supabase
      .from("Users")
      .insert([
        {
          nome_completo,
          data_nascimento,
          email,
          senha: senhaHash,
          telefone,
          cidade,
          estado,
          pais,
          bairro,
        },
      ]);

    if (insertError) throw insertError;

    return res.status(200).json({
      success: true,
      message: `Usuário ${nome_completo} cadastrado com sucesso!`,
    });

  } catch (err) {
    console.error("Erro ao cadastrar:", err);

    return res.status(500).json({
      success: false,
      message: "Erro ao cadastrar usuário!",
    });
  }
});

// ---- ROTA DE LOGIN ( POST /login ) ---- 
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      success: false,
      message: "Preencha todos os campos"
    });
  }

  try {
    const usuario = await buscarUsuarioPorEmail(email);
    const funcionario = await buscarFuncionarioPorEmail(email);

    //evita conflito entre tabelas
    if (usuario && funcionario) {
      return res.status(400).json({
        success: false,
        message: "Conta duplicada. Contate o suporte."
      });
    }

    const conta = usuario || funcionario;

    if (!conta) {
      return res.status(400).json({
        success: false,
        message: "Email ou senha inválidos."
      });
    }

    const senhaCorreta = await bcrypt.compare(senha, conta.senha);

    if (!senhaCorreta) {
      return res.status(400).json({
        success: false,
        message: "Email ou senha inválidos."
      });
    }

    //limpa qualquer sessão anterior
    delete req.session.user;
    delete req.session.admin;

    if (funcionario) {
      req.session.admin = {
        id: conta.id,
        nome: conta.nome,
        role: conta.role
      };

      return res.json({
        success: true,
        redirect: "/admin/dashboard"
      });
    }

    if (usuario) {
      req.session.user = {
        id: conta.id,
        nome: conta.nome_completo,
        email: conta.email,
        bairro: conta.bairro,
        role: conta.role
      };

      return res.json({
        success: true,
        redirect: "/inicio"
      });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Erro interno"
    });
  }
});


// --- ROTA DE SOLICITAÇÃO DE REDEFINIÇÃO ( POST /redefinirSenha ) ---
router.post("/redefinirSenha", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.send("<script>alert('Parâmetro de email não fornecido.'); window.history.back();</script>");
  }

  const emailLimpo = email.trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("email", emailLimpo)
      .single()

    // Regra de Segurança: Não diz se o email foi encontrado, mas simula o envio
    if (!data || error) {
      return res.redirect("/instrucoes_enviadas");
    };

    const users = data;

    const token = crypto.randomBytes(32).toString('hex');

    const expirar = new Date();
    expirar.setHours(expirar.getHours() + 1);

    const { error: updateError } = await supabase
      .from("Users")
      .update({ resetToken: token, tokenExpiration: expirar })
      .eq("id", users.id);

    if (updateError) throw updateError;

    const transporte = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });


    const resetURL = `${process.env.BASE_ULR}/redefinir-senha/${token}`;

    await transporte.sendMail({ 
      from: process.env.MAIL_USER,
      to: emailLimpo,
      subject: "Redefinir senha WaterFlow",
      html: `
      <h2>Redefinir Senha</h2>
      <p>Voce pediu para redefinir sua senha.</p>
      <p>Clique no link abaixo para continuar:</p>
      <a href="${resetURL}">${resetURL}</a>
      <p>O link expira em 1 hora.</p>`
    });

    return res.redirect("/instrucoes_enviadas");


  } catch (error) {
    console.error("Erro ao buscar usuário para redefinir senha: ", error);
    res.status(500).send("Erro interno no servidor.");
  }
});

// --- ROTA DE FEEDBACK DE ENVIO ( GET /instrucoes_enviadas ) ---
router.get("/instrucoes_enviadas", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/instrucoesEmail.html"))
});

// --- ROTA DE VALIDAÇÃO DE TOKEN ( GET /novaSenha/:token ) ---
// Formato de rota tradicional para maior compatibilidade
router.get("/redefinir-senha/:token", async (req, res) => {
  const { token } = req.params;
  const now = new Date();

  try {
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("resetToken", token)
      .gt("tokenExpiration", now.toISOString())
      .single();

    if (!data || error) {
      return res.send("<script>alert('Link de redefinição inválido ou expirado.'); window.location.href= '/login';</script>");
    }

    return res.sendFile(path.join(__dirname, "../public/pages/redefinirsenha.html"));

  } catch (error) {
    console.error("Erro na validação do token:", error);
    res.status(500).send("Erro interno.");
  }
});

// ---- ROTA DE ATUALIZAR SENHA ( PUT /usuarios/atualizar-senha/:token ) ---- 
router.put("/usuarios/atualizar-senha/:token", async (req, res) => {
  const { senha } = req.body; // AGORA bate com o frontend
  const { token } = req.params;
  const now = new Date();

  try {
    if (!senha || !token) {
      return res.status(400).json({
        sucesso: false,
        error: "Todos os campos são obrigatórios."
      });
    }

    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("resetToken", token)
      .gt("tokenExpiration", now.toISOString())
      .single();

    if (!data || error) {
      return res.status(400).json({
        sucesso: false,
        error: "Link inválido ou expirado."
      });
    }

    const hash = await bcrypt.hash(senha, 10);

    const { error: updateError } = await supabase
      .from("Users")
      .update({
        senha: hash,
        resetToken: null,
        tokenExpiration: null
      })
      .eq("id", data.id);

    if (updateError) throw updateError;

    return res.json({
      sucesso: true,
      message: "Senha atualizada com sucesso!"
    });

  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    res.status(500).json({ error: "Erro interno." });
  }
});

// ---- ROTA PARA ATUALIZAR PERFIL ( PATCH /usuarios/atualizar/perfil ) ---- 
router.patch("/usuarios/atualizar/perfil", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: "Usuário não autorizado" })
    }
    const id = req.session.user.id;
    const { nome_completo, email, telefone, bairro } = req.body;
    //Verificamos se o usuario existe no banco (passivo a mudanças).
    const { data: user, error: erroBusca } = await supabase
      .from("Users")
      .select("*")
      .eq("id", id)
      .single()
    //condiçao onde se nao tiver para a rota e retorna esse json de erro.
    if (!user || erroBusca) return res.status(404).json({ success: false, message: "Informações não foram encontradas!" });
    //Objeto onde iremos pegar os novos dados inseridos pelo usuário e atualizar no banco 
    const dadosAtualizados = {};

    //se nome não vier vazio (undefined), manda a chave nome com o valor da variavel nome nome = nome;
    if (nome_completo && nome_completo.trim() !== "") {
      dadosAtualizados.nome_completo = nome_completo.trim();
    }

    //se email não vier vazio (undefined), manda a chave nome com o valor da variavel email = email;
    if (email && email.trim() !== "") {
      //limpamos e igualamos o email
      const emailLimpo = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //evitando que caracteres estranhos sejam adicionados ao email

      //condicional que verifica se o email veio ou não com caractéres estranhos.
      if (!emailRegex.test(emailLimpo)) {
        return res.status(400).json({ success: false, message: "Email contém caractéres incomuns." });
      };

      dadosAtualizados.email = emailLimpo;
    };

    if (telefone && telefone.trim() !== "") {
      dadosAtualizados.telefone = telefone.trim();
    };

    if (bairro && bairro.trim() !== "") {
      dadosAtualizados.bairro = bairro
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    };

    //Aqui verificamos se dados atualizados (em forma de array com as chaves), veio vazio ou com os elementos e se vier pula para alterar, se não retorna a mensagem
    if (Object.keys(dadosAtualizados).length === 0) return res.status(400).json({ message: "Nenhum dado a ser atualizado." })

    //verifica se o novo email recebido é igual ao email antigo, evitando duplicidade.
    if (dadosAtualizados.email) {
      const { data: emailExistente } = await supabase
        .from("Users")
        .select("id")
        .eq("email", dadosAtualizados.email)
        .neq("id", id);

      if (emailExistente && emailExistente.length > 0) {
        return res.status(400).json({ success: false, message: "Este email é igual ao já cadastrado, mude o email!" });
      };
    };

    if (dadosAtualizados.nome_completo) {
      req.session.user.nome = dadosAtualizados.nome_completo;
    }

    console.log("DADOS RECEBIDOS:", req.body);
    console.log("DADOS ATUALIZADOS:", dadosAtualizados);

    const { data, error } = await supabase
      .from("Users")
      .update(dadosAtualizados)
      .eq("id", id)
      .select();

    console.log("UPDATE DATA:", data);
    console.log("UPDATE ERROR:", error);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Erro ao atualizar informações"
      });
    };

    return res.status(200).json({ success: true, message: "Campos atualizados com sucesso.", dados: dadosAtualizados });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// ---- ROTA DE REPORTAR FALTA D'ÁGUA ( POST /reporte/enviar/ )  ----
router.post("/reporte/enviar", async (req, res) => {
  const { nome, email, tipo, rua, bairro, descricao } = req.body

  if (!email || !nome || !rua || !bairro || !tipo) {
    return res.json({ success: false, message: "Preencha todos os campos" });
  }

  try {
    const { data, error } = await supabase
      .from("reportUsers")
      .insert([
        {
          nome: nome,
          email: email,
          tipo_problema: tipo,
          rua: rua,
          bairro: bairro,
          descricao: descricao
        }
      ]);

    if (error) {
      return res.status(400).json({
        sucesso: false,
        error: "Erro ao enviar reporte"
      });
    }

    return res.json({ success: true, message: "Report enviado com sucesso!" });

  } catch (error) {
    console.error("Erro na validação do token:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor"
    });
  }

});

// ---- ROTA PARA BUSCAR OS REPORTES (GET /api/meus-reportes ) ---- 
router.get("/api/meus-reportes", async (req, res) => {
  const email = req.session.user?.email;

  if (!email) return res.json({ success: false, error: "Não autenticado." });

  const expiracao = new Date();
  expiracao.setMinutes(expiracao.getMinutes() - 3);

  const { data, error } = await supabase
    .from("reportUsers")
    .select("id, bairro, status, resposta_admin, respondido_em")
    .eq("email", email)
    .not("resposta_admin", "is", null)
    .gte("respondido_em", expiracao.toISOString())
    .order("respondido_em", { ascending: false });

  if (error) return res.json({ success: false, error });
  res.json({ success: true, data });
});

// ---- ROTA PARA BUSCAR BAIRRO DO USUÁRIO (GET /api/alertas-bairro ) ---- 
router.get("/api/alertas-bairro", async (req, res) => {
  const bairro = req.session.user?.bairro;

  if (!bairro) return res.json({ success: false, error: "Não autenticado." });

  const expiracao = new Date();
  expiracao.setDate(expiracao.getDate() - 7);

  const { data, error } = await supabase
    .from("abastecimento")
    .select("id, bairro, status, atualizado_em")
    .ilike("bairro", `%${bairro}%`)
    .neq("status", "NORMAL")
    .gte("atualizado_em", expiracao.toISOString())
    .order("atualizado_em", { ascending: false });

  if (error) return res.json({ success: false, error });
  res.json({ success: true, data });
});

// ---- ROTA PARA CONTAGEM DE REPORTES DO USUÁRIO (GET, /reportes/contagem/:email ) ----
router.get("/reportes/contagem/:email", async (req, res) => {
    const { email } = req.params;

    const { count, error } = await supabase
        .from("reportUsers")
        .select("*", { count: "exact", head: true })
        .eq("email", email);

    if (error) return res.status(500).json({ success: false });

    return res.status(200).json({ success: true, total: count });
});

// ---- ROTA PARA BUSCAR OS REPORTES DO USUÁRIO (GET, /meus-reportes/:email) ----
router.get("/meus-reportes/:email", async (req, res) => {
    const { email } = req.params;

    const { data, error } = await supabase
        .from("reportUsers")
        .select("*")
        .eq("email", email)
        .order("created_at", { ascending: false })

    if (error) return res.status(500).json({ success: false });

    return res.status(200).json({ success: true, reportes: data });
});

/* ---- ROTA PARA O USUÁRIO DELETAR A CONTA (DELETE, /usuarios/deletar) ---- */
router.delete("/usuarios/deletar", async (req, res) => {
    try {

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Usuário não autenticado"
            });
        }

        const id = req.session.user.id;

        const { error } = await supabase
            .from("Users")
            .delete()
            .eq("id", id);

        if (error) {
            return res.status(500).json({
                success: false,
                message: "Erro ao deletar conta"
            });
        }
        
        req.session.destroy((err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Erro ao encerrar sessão"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Conta deletada com sucesso"
            });

        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Erro interno do servidor"
        });
    }
});

module.exports = router;