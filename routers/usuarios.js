const express = require("express");
const bcrypt = require("bcrypt");
const Usuario = require("../models/Usuario");
const router = express.Router();
const crypto = require("crypto");
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const nodemailer = require("nodemailer")
// --- ROTAS DE CADASTRO E LOGIN (MANTIDAS) ---

router.post("/api/cadastrar", async (req, res) => {
  const {
    nome_completo,
    data_nascimento,
    email,
    senha,
    telefone,
    CEP,
    cidade,
    estado,
    pais,
  } = req.body;

  try {
    // Verifica se o e-mail já existe
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res
        .status(400)
        .send("<script>alert('E-mail já cadastrado!'); window.history.back();</script>");
    }

    // Criptografa a senha antes de salvar
    const senhaHash = await bcrypt.hash(senha, 10);

    await Usuario.create({
      nome_completo,
      data_nascimento,
      email,
      senha: senhaHash,
      telefone,
      CEP,
      cidade,
      estado,
      pais,
    });

    res.send(`<script>alert('Usuário ${nome_completo} cadastrado com sucesso!'); window.location.href = '/login';</script>`);
  } catch (err) {
    console.error("Erro ao cadastrar:", err);
    res.status(500).send("Erro ao cadastrar usuário!");
  }
});

router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.send("<script>alert('Email não encontrado'); window.history.back();</script>");
    }

    // Compara a senha digitada com o hash armazenado
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.send("<script>alert('Senha incorreta'); window.history.back();</script>");
    }

    //salvar sessao do usuario;
    req.session.userId = usuario.id;
    req.session.username = usuario.nome_completo;
    // Login bem-sucedido
    res.redirect("/inicio");
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).send("Erro interno no servidor");
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
    const usuario = await Usuario.findOne({
      where: { email: emailLimpo }
    });

    // Regra de Segurança: Não diz se o email foi encontrado, mas simula o envio
    if (!usuario) {
      return res.redirect("/instrucoes_enviadas");
    };

    const token = crypto.randomBytes(32).toString('hex')

    const expirar = new Date();
    expirar.setHours(expirar.getHours() + 1);

    usuario.resetToken = token;
    usuario.tokenExpiration = expirar;
    await usuario.save();

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
      <p>Voce pediu par redefinir sua senha.</p>
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
  res.send(`
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
  <meta charset="UTF-8">
  <title>Instruções Enviadas</title>
  <style>
  body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; }
  h1 { color: #333; }
  p { color: #555; }
  .btn { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
  </head>
  <body>
  <h1>Verifique a sua caixa de entrada!</h1>
  <p>Se a conta existir, você receberá em breve um e-mail com o link seguro para redefinir sua senha.</p>
  <p>O link é válido por aproximadamente 60 minutos.</p>
  <a href="/login" class="btn">Ir para a página de Login</a>
  </body>
  </html>
  `);
});

// --- ROTA DE VALIDAÇÃO DE TOKEN (GET /novaSenha/:token) ---
// Formato de rota tradicional para maior compatibilidade

router.get("/redefinir-senha/:token", async (req, res) => {
  const { token } = req.params;
  const now = new Date();

  try {
    const usuario = await Usuario.findOne({
      where: {
        resetToken: token,
        tokenExpiration: { [Op.gt]: now }
      }
    });

    if (!usuario) {
      return res.send("<script>alert('Link de redefinição inválido ou expirado.'); window.location.href= '/login';</script>");
    }

    const path = require("path");
    return res.sendFile(path.join(__dirname, "../public/pages/redefinirsenha.html"));

  } catch (error) {
    console.error("Erro na validação do token:", error);
    res.status(500).send("Erro interno.");
  }
});


router.put("/usuarios/atualizar-senha/:token", async (req, res) => {
  const { senha, token } = req.body; // AGORA bate com o frontend
  const now = new Date();

  try {
    if (!senha || !token) {
      return res.status(400).json({
        sucesso: false,
        error: "Todos os campos são obrigatórios."
      });
    }

    const usuario = await Usuario.findOne({
      where: {
        resetToken: token,
        tokenExpiration: { [Op.gt]: now }
      }
    });

    if (!usuario) {
      return res.status(400).json({
        sucesso: false,
        error: "Link inválido ou expirado."
      });
    }

    const hash = await bcrypt.hash(senha, 10);

    usuario.senha = hash;
    usuario.resetToken = null;
    usuario.tokenExpiration = null;
    await usuario.save();

    return res.json({
      sucesso: true,
      message: "Senha atualizada com sucesso!"
    });

  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    res.status(500).json({ error: "Erro interno." });
  }
});

//rota de logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao destruir sessão:", err);
      return res.status(500).send("Erro ao fazer logout!");
    }
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});

module.exports = router;