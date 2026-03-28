const express = require("express");
require("dotenv").config();
const session = require("express-session"); //criando sessao de login
const path = require("path");
const usuarioRouter = require("./routes/usuarios");
const server = express();
const PORT = 8080;
const { v4: uuidv4 } = require("uuid");
const auth = require("./middleware/auth.js");
const funcionarioRouter = require("./routes/admin.js")
const statusRouter = require("./routes/statusBairros.js")

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

//Middlewares de routers
server.use(usuarioRouter);
server.use("/admin", funcionarioRouter)
server.use("/status-bairros", statusRouter);

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
});


/* ---- ROTAS DE ADMIN ---- */

server.get("/admin/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "admin/pages/dashboard.html"));
})

server.get("/admin/reports", (req, res) => {
  res.sendFile(path.join(__dirname, "admin/pages/reporte.html"));
});

server.get("/admin/poligonos", (req, res) => {
  res.sendFile(path.join(__dirname, "admin/pages/poligonos.html"));
});

server.get("/admin/relatorios", (req, res) => {
  res.sendFile(path.join(__dirname, "admin/pages/relatorios.html"));
})

server.get("/admin/usuarios", (req, res) => {
  res.sendFile(path.join(__dirname, "admin/pages/usuarios.html"));
})

/** ---- API DO MAPA ---- */

server.get("/api/mapKey", (req, res) => {
  res.json({key: process.env.MAP_KEY});
});



server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}/login`);
  console.log(`Servidor rodando em http://localhost:${PORT}/admin/dashboard`);
});
