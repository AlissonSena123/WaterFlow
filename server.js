const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const usuarioRouter = require("./routers/usuarios");
const sequelize = require("./config/database");

const server = express();
const PORT = 8080;

server.use(bodyParser.urlencoded({ extended: true }));
server.use(express.json());
server.use(express.static(path.join(__dirname, "public")));
server.use(usuarioRouter);

server.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/login.html"));
});

server.get("/cadastro", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/cadastro.html"));
});

server.get("/inicio", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/inicio.html"));
});

server.get("/forum", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/forum.html"));
});

server.get("/perfil", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/perfil.html"));
});

server.get("/reporte", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/reporte.html"));
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}/login`);
});
