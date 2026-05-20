const express = require("express");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const path = require("path");
const usuarioRouter = require("./routes/usuarios");
const server = express();
const PORT = process.env.PORT || 8080;
const { v4: uuidv4 } = require("uuid");
// const auth = require("./middleware/auth.js");
const funcionarioRouter = require("./routes/admin.js");
const statusMAP = require("./routes/status.js");
const autorizarRole = require("./middleware/autorizarRoles.js");
const { supabase } = require("./config/supabase.js");
const jwt = require("jsonwebtoken");

// Middlewares
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(cookieParser());
server.use(express.static(path.join(__dirname, "public")));

//Middlewares de routers
server.use(usuarioRouter);
server.use("/admin", funcionarioRouter);
server.use("/status", statusMAP);

server.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/sobre.html"));
});

/*---- Páginas gerais ----*/
server.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/login.html"));
});

server.get("/cadastro", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/cadastro.html"));
});

/*---- Página de acesso de usuário ----*/
server.get("/inicio", autorizarRole("users"), (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/inicio.html"));
});

server.get("/perfil", autorizarRole("users"), (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/perfil.html"));
});

server.get("/reporte", autorizarRole("users"), (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/reporte.html"));
});

server.get("/redefinir", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/senhaEsquecida.html"));
});

server.get("/redefinir/confirmar", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/redefinirsenha.html"));
});


/* ---- ROTAS DE ADMIN ---- */

server.get("/admin/dashboard", autorizarRole("funcionario"), (req, res) => {
  res.sendFile(path.join(__dirname, "admin/pages/dashboard.html"));
});

server.get("/admin/reports", autorizarRole("funcionario"), (req, res) => {
  res.sendFile(path.join(__dirname, "admin/pages/reporte.html"));
});

server.get("/admin/poligonos", autorizarRole("funcionario"), (req, res) => {
  res.sendFile(path.join(__dirname, "admin/pages/poligonos.html"));
});

server.get("/admin/relatorios", autorizarRole("funcionario"), (req, res) => {
  res.sendFile(path.join(__dirname, "admin/pages/relatorios.html"));
});

server.get("/admin/usuarios", autorizarRole("funcionario"), (req, res) => {
  res.sendFile(path.join(__dirname, "admin/pages/usuarios.html"));
});

/** ---- API DO MAPA ---- */

server.get("/api/mapKey", (req, res) => {
  res.json({ key: process.env.MAP_KEY });
});

/* ---- Rota de Logout ---- */
server.post("/logout", (req, res) => {
  // Com JWT em cookie, basta limpar o cookie
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  return res.json({
    success: true,
    message: "Sessão encerrada",
    redirect: "/login"
  });
});

/** ---- Rota ME ---- */

//atualizando para pegar o resultado do banco e nao da session apenas
server.get("/me", async (req, res) => {
  const token = req.cookies?.token;
 
  if (!token) {
    return res.json({ tipo: null, user: null });
  }
 
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.json({ tipo: null, user: null });
  }
 
  try {
    if (payload.tipo === "funcionario") {
      const { data: admin, error } = await supabase
        .from("Funcionarios")
        .select("*")
        .eq("id", payload.id)
        .single();
 
      if (error || !admin) return res.json({ user: null });
 
      return res.json({
        tipo: "funcionario",
        user: {
          id: admin.id,
          nome_completo: admin.nome,
          email: admin.email,
          role: admin.role
        }
      });
    }
 
    if (payload.tipo === "users") {
      const { data: user, error } = await supabase
        .from("Users")
        .select("*")
        .eq("id", payload.id)
        .single();
 
      if (error || !user) return res.json({ user: null });
 
      return res.json({
        tipo: "users",
        user: {
          id: user.id,
          nome: user.nome_completo,
          email: user.email,
          telefone: user.telefone,
          nascimento: user.data_nascimento,
          bairro: user.bairro,
          role: user.role
        }
      });
    }
  } catch (err) {
    return res.json({ tipo: null, user: null });
  }
 
  return res.json({ tipo: null, user: null });
});

module.exports = server;