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

module.exports = router;