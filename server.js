const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const path = require("path");
const { createConnection } = require("net");

const server = express();
const PORT = 8080;

server.use(express.urlencoded({ extended: true }));
server.use(express.json());

server.use(express.static(path.join(__dirname, "public")));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "cimatec",
    database: "Waterflow"
});

db.connect((err) => {
    if(err){
        console.error("Erro ao conectar com o Banco SQL: ", err.message);
    }
    console.log("Conexão com o Banco SQL realizado com sucesso!");
});

server.get("/teste", (req, res) => {
    res.send(`
        <a href="/login" target="blank">Login</a>
        <a href="/cadastro" target="blank">Cadastro</a> 
        <a href="/inicio" target="blank">Inicio</a>
        <a href="/forum" target="blank">Forum</a> 
        <a href="/perfil" target="blank">Perfil</a>      
    `)
})

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

server.post("/api/cadastrar", (req, res) => {
    const {nome_completo, data_nascimento, email, senha, telefone, CEP} = req.body;

    const sql = "INSERT INTO usuarios(nome_completo, data_nascimento, email, senha, telefone, CEP) VALUES(?, ?, ?, ?, ?, ?) ";
    
    db.query(sql, [nome_completo, data_nascimento, email, senha, telefone, CEP], (err) => {
        if(err){
            console.error("Erro ao inserir no banco: ", err.message);
            return res.send("Erro ao cadastrar no banco!");
        }
        res.send(`Usuário ${nome_completo} cadastrado com sucesso!`);
    })
})

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}/teste`);
});