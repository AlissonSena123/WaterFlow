const express = require("express");
const path = require("path");
const server = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const bcrypt = require('bcrypt');

server.use(bodyParser.urlencoded({ extended: true}));
server.use(express.json());
server.use(express.static(path.join(__dirname, "public")));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'cimatec',
    database: 'WaterFlow'
});

db.connect(err => {
    if(err) {
        console.error('Erro ao conectar no banco');
        return;
    }
    console.log('Conexao com o MYSQL estabelecida!');
})

/*server.get("/teste", (req, res) => {
    res.send(`
        <a href="/login" target="blank">Login</a>
        <a href="/cadastro" target="blank">Cadastro</a> 
        <a href="/inicio" target="blank">Inicio</a>
        <a href="/forum" target="blank">Forum</a> 
        <a href="/perfil" target="blank">Perfil</a>      
    `)
})*/

server.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public/login.html"));
});

server.get("/cadastro", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "cadastro.html"));
});

server.get("/inicio", (req, res) => {
    res.sendFile(path.join(__dirname, "public/inicio.html"));
});

server.get("/forum", (req, res) => {
    res.sendFile(path.join(__dirname, "public/forum.html"));
});

server.get("/perfil", (req, res) => {
    res.sendFile(path.join(__dirname, "public/perfil.html"));
});

server.get("/reporte", (req, res) => {
    res.sendFile(path.join(__dirname, "public/reporte.html"));
});

server.post('/salvar', (req, res) => {
    const { nome, email, telefone, senha } = req.body;

    const sql = 'INSERT INTO usuarios (nome, email, telefone, senha) VALUES (?, ?, ?, ?)';
    db.query(sql, [nome, email, telefone, senha], (err) => {
        if (err) {
            console.error('Erro ao inserir dados:', err.message);
            return res.status(500).send(`<script>alert('Erro ao salvar no banco!'); window.history.back();</script>`);
        }

        res.status(201).send(`<script>alert('Cadastro realizado com sucesso!'); window.location.href = '/login';</script>`);
    });
});

server.post('/log', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).send('Email e senha são obrigatórios!');
    }

    const sql = 'SELECT * FROM usuarios WHERE email = ? AND senha = ?';

    db.query(sql, [email, senha], (err, resultado) => {
        if (err) {
            console.error('Erro ao verificar login:', err.message);
            return res.status(500).send('Erro no servidor!');
        }

        if (resultado.length === 0) {
            return res.send(`
                <script>
                    alert('Usuário ou senha inválidos!');
                    window.location.href = '/log.html';
                </script>
            `);
        }

        return res.send(`
            <script>
                alert('Login realizado com sucesso!');
                window.location.href = '/inicio';
            </script>
        `);
    });
});


server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}/login`);
});