const express = require("express");
require("dotenv").config();
const session = require("express-session"); //criando sessao de login
const path = require("path");
const usuarioRouter = require("./routes/usuarios");
const server = express();
const PORT = 8080;
const { v4: uuidv4 } = require("uuid");
const auth = require("./middleware/auth.js");
const funcionarioRouter = require("./routes/funcionario.js")
const poligonosRouter = require("./routes/poligonos.js")

// Middlewares
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(express.static(path.join(__dirname, "public")));

//middleware de sessao
server.use(session({
    genid: function(req){
      return uuidv4(); //gerar id aleatorio com biblioteca uuid;
    },
    secret: '=fmLV*U@FL`N]]~/zqtFCch.pBTGoU',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 } // 1 hora
}));

server.use(usuarioRouter);
server.use("/funcionario", funcionarioRouter)
server.use("/poligonos", poligonosRouter)

server.get("/session", (req, res) => {
    res.send(req.sessionID);
});

server.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/sobre.html"));
});

// Páginas HTML
server.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/login.html"));
});

server.get("/cadastro", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/cadastro.html"));
});

server.get("/inicio", auth,  (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/inicio.html"));
});

server.get("/forum", auth,  (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/forum.html"));
});

server.get("/perfil", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/perfil.html"));
});

server.get("/reporte", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/reporte.html"));
});

server.get("/redefinir", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/senhaEsquecida.html"));
});

server.get("/redefinir/confirmar", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/redefinirsenha.html"));
})

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}/login`);
});
