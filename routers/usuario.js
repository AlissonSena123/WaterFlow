const express = require('express');
const router = express.Router();
const db = require('./bancoDados');

router.post("/api/cadastrar", (req, res) => {
    const {nome_completo, data_nascimento, email, senha, telefone, CEP} = req.body;

    let sqlVerificar = 'SELECT * FROM usuarios WHERE email = ?';

    db.query(sqlVerificar, [email], (err, resultado) => {
        if (err) {
            console.error("Erro ao verificar o email: ", err.message);
            return res.status(500).send("Erro interno no servidor");
        };

        if(resultado.length > 0) {
            return res.status(400).send(`<script>alert('Esse usuario já existe!'); window.history.back();</script>`)
        };
    });

    const sqlInserir = "INSERT INTO usuarios(nome_completo, data_nascimento, email, senha, telefone, CEP) VALUES(?, ?, ?, ?, ?, ?) ";
    
    db.query(sqlInserir, [nome_completo, data_nascimento, email, senha, telefone, CEP], (err) => {
        if(err){
            console.error("Erro ao inserir no banco: ", err.message);
            return res.send("Erro ao cadastrar no banco!");
        }
        res.send(`<script>alert('Cadastro realizado com sucesso!'); window.location.href='/login';</script>`);
    });
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