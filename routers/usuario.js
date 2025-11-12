const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require('../models/users');

router.post("/api/cadastrar", async (req, res) => {
    const { nome_completo, data_nascimento, email, senha, telefone, CEP } = req.body;

    try {
        //verificando se usuario ja existe com Promise e await, para nao executar antes e dar erro.
        const usuarioExistente = await User.findOne({where: {email}});

        if(usuarioExistente){
            return res.status(400).send(`<script>alert('Esse usuário já existe!'); window.history.back();</script>`);
        };

        //criando hash(binarios) a senha do usuario;
        const hashSenha = await bcrypt.hash(senha, 10);

        //inserir usuario usando sequelize
        await User.create({
            nome_completo,
            data_nascimento,
            email,
            senha: hashSenha,
            telefone,
            CEP 
        });
        
        return res.send(`<script>alert('Cadastro realizado com sucesso!'); window.location.href='/login';</script>`);

    } catch (error) {
        console.error("Erro no cadastro:", error);
        return res.status(500).send("Erro interno no servidor");
    }

});

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try{
        //busca usuario pelo email
        const usuario = await User.findOne({where: {email}});

        if(!usuario) {
            return res.status(400).send(`<script>alert('Email ou senha incorretos!'); window.history.back();</script>`)
        };

        //comparar senha com a existente em hash no banco
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if(!senhaValida) {
            return res.status(400).send(`<script>alert('Email ou senha incorretos!'); window.history.back();</script>`);
        };

        console.log('Usuario logado: ', usuario.nome_completo);
        return res.redirect('/inicio');

    } catch (error) {
        console.error("Erro no login: ", error);
        return res.status(500).send("Erro interno no servidor");
    };

});

module.exports = router;