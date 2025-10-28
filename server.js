const express = require("express");
const path = require("path");
const server = express();
const PORT = 8080;

server.use(express.urlencoded({ extended: true }));
server.use(express.json());

server.use(express.static(path.join(__dirname, "public")));

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

server.post("/imprimir", (req, res) => {
    console.log(req.body);
    res.send("<h1>usuário cadastrado com sucesso</h1>");
});

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}/teste`);
});