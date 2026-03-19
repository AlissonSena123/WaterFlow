const { supabase } = require("../config/supabase");
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const crypto = require("crypto");
const nodemailer = require("nodemailer")
const path = require("path");


// --- ROTAS DE CADASTRO E LOGIN (MANTIDAS) ---
router.post("/api/cadastrar", async (req, res) => {
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

  try {
    const { data, error } = await supabase
      .from("Users")
      .select("id")
      .eq("email", email);

    if (error) throw error;

    if (data.length > 0) {
      return res
        .status(400)
        .send("<script>alert('E-mail já cadastrado!'); window.history.back();</script>");
    }

    const senhaHash = await bcrypt.hash(senha, 10);

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

    res.send(`<script>alert('Usuário ${nome_completo} cadastrado com sucesso!'); window.location.href = '/login';</script>`);

  } catch (err) {
    console.error("Erro ao cadastrar:", err);
    res.status(500).send("Erro ao cadastrar usuário!");
  }
});

// ROTA DE LOGIN
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if(!email || !senha){
    return res.json({success:false, message:"Preencha todos os campos"});
  }

  try {
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return res.json({success:false, message:"Email ou senha inválidos"});
    }

    const users = data;

    // Compara a senha digitada com o hash armazenado
    const senhaCorreta = await bcrypt.compare(senha, users.senha);

    if (!senhaCorreta) {
      return res.json({success:false, message:"Email ou senha inválidos"});
    }

    //salvar sessao do usuario;
    req.session.userId = users.id;
    req.session.username = users.nome_completo;
    // Login bem-sucedido
    
    res.json({success:true});

  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({success:false, message:"Erro interno no servidor, tente de novo mais tarde"});
  }
});


// --- ROTA DE SOLICITAÇÃO DE REDEFINIÇÃO (POST /redefinirSenha) ---
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

    const token = crypto.randomBytes(32).toString('hex')

    const expirar = new Date();
    expirar.setHours(expirar.getHours() + 1);

    const { error: updateError } = await supabase
      .from("Users")
      .update({resetToken: token, tokenExpiration: expirar})
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


    const resetURL = `http://localhost:8080/redefinir-senha/${token}`;

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

// --- ROTA DE FEEDBACK DE ENVIO (GET /instrucoes_enviadas) ---

router.get("/instrucoes_enviadas", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/instrucoesEmail.html"))
});

// --- ROTA DE VALIDAÇÃO DE TOKEN (GET /novaSenha/:token) ---
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

      if(updateError) throw updateError;

    return res.json({
      sucesso: true,
      message: "Senha atualizada com sucesso!"
    });

  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.post("/reporte/enviar", async (req, res) => {
  const { nome, email, rua, bairro, descricao } = req.body

  if(!email || !nome || !rua || !bairro){
    return res.json({success:false, message:"Preencha todos os campos"});
  }

  try {
    const { data, error } = await supabase
      .from("reportUsers")
      .insert([
        {
          nome: nome,
          email: email,
          rua: rua,
          bairro: bairro,
          descricao: descricao
        }
      ]);

      if (!data || error) {
        return res.status(400).json({
          sucesso: false,
          error: "Erro ao enviar reporte"
        });
      }

      if(error) throw error;

      return res.json({ success: true, message: "Dados enviados com sucesso!" });

  } catch (error) {
    console.error("Erro na validação do token:", error);
    res.status(500).send("Erro interno do servidor.");
  }

});

//rota de logout
router.post("/logout", (req, res) => {
  if(req.session.userId){
    req.session.destroy((err) => {
      if(err){
        console.log(err);
        return res.status(500).json({error: "Erro ao fazer logout!"});
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({message: "Logout realizado com sucesso!", redirect: "/login"});
    });
  } else {
    res.status(400).json({ error: "Nenhum usuário logado." });
  }
});

module.exports = router;
