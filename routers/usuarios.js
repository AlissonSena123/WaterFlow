const express = require("express");
const bcrypt = require("bcrypt");
const Usuario = require("../models/Usuario");

const router = express.Router();

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

    // Login bem-sucedido
    res.redirect("/inicio");
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).send("Erro interno no servidor");
  }
});


router.post("/redefinirSenha", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.send("<script>alert('Parâmetro de email não fornecido.'); window.history.back();</script>");
  }

  const emailLimpo = email.trim().toLowerCase();

  try {
    const encontrado = await Usuario.findOne({
      where: { email: emailLimpo }
    });

    if (!encontrado) {
      return res.send("<script>alert('Email não encontrado'); window.history.back();</script>");
    }

    if (encontrado) {
      res.writeHead(302, {
        'Location': `/novaSenha?email=${encodeURIComponent(emailLimpo)}`
      });
      res.end();
      return; 
    }

    return res.redirect(`/novaSenha?email=${encodeURIComponent(emailLimpo)}`);

  } catch (error) {
    console.error("Erro ao buscar usuário para redefinir senha: ", error);
    res.status(500).send("Erro interno no servidor.");
  }
});

router.route("/novaSenha")
  .get((req, res) => {
    res.render("novaSenha", { email: req.query.email });
  })
  .post(async (req, res) => {
    const { email, novaSenha } = req.body;
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const newHash = await bcrypt.hash(novaSenha, salt);
    await Usuario.update({ senha: newHash }, { where: { email } });
    res.send(`<script> alert("Senha atualizada!"); window.location.href= '/login';</script>`);
  })

module.exports = router;