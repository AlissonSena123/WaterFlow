const express = require('express');
const router = express.Router();
const db = require('./bancoDados');
const bcrypt = require("bcrypt");

router.post("/api/cadastrar", async (req, res) => {
    const { nome_completo, data_nascimento, email, senha, telefone, CEP } = req.body;

    try {
        //verificando se usuario ja existe com Promise e await, para nao executar antes e dar erro.
        const sqlVerificar = 'SELECT * FROM usuarios WHERE email = ?';
        const usuarioExistente = await new Promise((resolve, reject) => {
            db.query(sqlVerificar, [email], (err, resultado) => {
                if (err) return reject(err);
                resolve(resultado);
            });
        });

        if (usuarioExistente.length > 0) {
            return res.status(400).send(`<script>alert('Esse usuário já existe!'); window.history.back();</script>`)
        };

        //criando hash(binarios) a senha do usuario;
        const hashSenha = await bcrypt.hash(senha, 10);

        const sqlInserir = "INSERT INTO usuarios(nome_completo, data_nascimento, email, senha, telefone, CEP) VALUES(?, ?, ?, ?, ?, ?) ";

        await new Promise((resolve, reject) => {
            db.query(sqlInserir, [nome_completo, data_nascimento, email, hashSenha, telefone, CEP], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        return res.send(`<script>alert('Cadastro realizado com sucesso!'); window.location.href='/login';</script>`);
    } catch (error) {
        console.error("Erro no cadastro:", error.message);
        return res.status(500).send("Erro interno no servidor");
    }

});

router.post('/login', (req, res) => {
    const { email, senha } = req.body;

    const sql = 'SELECT * FROM usuarios WHERE email = ? AND senha = ?';

    db.query(sql, [email, senha], (err, resultado) => {
        if (err) {
            console.error("Erro ao buscar no banco:", err.message);
            return res.status(500).send("Erro interno no servidor");
        }

        if (resultado.length === 0) {
            return res.send("<script>alert('Email ou senha incorretos'); window.history.back();</script>");
        }

        return res.redirect('/inicio');
    });
});

module.exports = router;