const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const usuarioRouter = require("./routers/usuario"); // rotas com Sequelize
const sequelize = require('./routers/bancoDados'); // importa e executa a conexão com o banco

const server = express();
const PORT = 8080;

// Middlewares
server.use(bodyParser.urlencoded({ extended: true }));
server.use(express.json());
server.use(express.static(path.join(__dirname, "public")));

// Rotas principais
server.use(usuarioRouter);

// Páginas HTML
server.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

server.get("/cadastro", (req, res) => {
  res.sendFile(path.join(__dirname, "public/cadastro.html"));
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

// Inicialização do servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}/login`);
});
