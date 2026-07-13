import express from "express";
import { config } from "dotenv";
config();
import cookieParser from "cookie-parser";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import usuarioRouter from "./routes/usuarios.js";
import funcionarioRouter from "./routes/admin.js";
import statusMAP from "./routes/status.js";
import autorizarRole from "./middleware/autorizarRoles.js";
import { supabase } from "./config/supabase.js";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = express();
const PORT = process.env.PORT || 8080;

// Middlewares
const allowedOrigins = (origin, callback) => {
  // origin is undefined if the request comes from the same server or a non-browser client
  if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/.*\.vercel\.app$/.test(origin)) {
    return callback(null, true);
  }
  return callback(new Error("Not allowed"), false);
};

server.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(cookieParser());

if (!process.env.VERCEL) {
  server.use(express.static(join(__dirname, "public")));
}

// Middlewares de routers
server.use(usuarioRouter);
server.use("/admin", funcionarioRouter);
server.use("/status", statusMAP);

// Serve Angular static files (somente rodando localmente)
let angularDistPath;
if (!process.env.VERCEL) {
  angularDistPath = join(__dirname, "frontend/dist/frontend/browser");
  server.use(express.static(angularDistPath));
}

/** ---- API DO MAPA ---- */

server.get("/api/mapKey", (req, res) => {
  res.json({ key: process.env.MAP_KEY });
});

/* ---- Rota de Logout ---- */
server.post("/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  return res.json({ success: true, message: "Sessão encerrada", redirect: "/login" });
});

/* ---- Rota de Usuarios ---- */
server.get("/api/usuarios", autorizarRole("funcionario"), async (req, res) => {
  try {
    const { nome, role } = req.query;
    
    // Buscar cidadãos
    let usersQuery = supabase.from("Users").select("id, nome_completo, email, telefone, bairro, created_at");
    
    // Buscar admins
    let adminsQuery = supabase.from("Funcionarios").select("id, nome, email, role, created_at");

    const [resUsers, resAdmins] = await Promise.all([usersQuery, adminsQuery]);
    
    if (resUsers.error) throw resUsers.error;
    if (resAdmins.error) throw resAdmins.error;

    let lista = [
      ...resUsers.data.map(u => ({ ...u, role: "user" })),
      ...resAdmins.data.map(a => ({ id: a.id, nome_completo: a.nome, email: a.email, telefone: "", bairro: "", role: "admin", created_at: a.created_at }))
    ];

    if (nome) {
      const p = nome.toLowerCase();
      lista = lista.filter(u => u.nome_completo?.toLowerCase().includes(p) || u.email?.toLowerCase().includes(p));
    }
    if (role) {
      lista = lista.filter(u => u.role === role);
    }

    // Ordenar por mais recente
    lista.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    res.json({ success: true, data: lista });
  } catch (error) {
    res.json({ success: false, erro: error.message });
  }
});

/* ---- Rota de Relatorios ---- */
server.get("/api/relatorios", autorizarRole("funcionario"), async (req, res) => {
  try {
    const { busca, status } = req.query;
    let query = supabase.from("abastecimento").select("*").order("atualizado_em", { ascending: false });

    if (busca) {
      query = query.ilike("bairro", `%${busca}%`);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Mapear os dados para bater com a interface do componente (ex: nome = bairro, created_at = atualizado_em)
    const relatoriosFormatados = data.map(item => ({
      id: item.id,
      nome: item.bairro,
      status: item.status,
      created_at: item.atualizado_em || item.inicio_interrupcao || new Date().toISOString()
    }));

    res.json({ success: true, data: relatoriosFormatados });
  } catch (error) {
    res.json({ success: false, erro: error.message });
  }
});

/** ---- Rota ME ---- */
server.get("/me", async (req, res) => {
  const token = req.cookies?.token;

  if (!token) return res.json({ tipo: null, user: null });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.json({ tipo: null, user: null });
  }

  try {
    if (payload.tipo === "funcionario") {
      const { data: admin, error } = await supabase
        .from("Funcionarios").select("*").eq("id", payload.id).single();
      if (error || !admin) return res.json({ user: null });
      return res.json({ tipo: "funcionario", user: { id: admin.id, nome_completo: admin.nome, email: admin.email, role: admin.role } });
    }

    if (payload.tipo === "users") {
      const { data: user, error } = await supabase
        .from("Users").select("*").eq("id", payload.id).single();
      if (error || !user) return res.json({ user: null });
      return res.json({ tipo: "users", user: { id: user.id, nome: user.nome_completo, email: user.email, telefone: user.telefone, nascimento: user.data_nascimento, bairro: user.bairro, role: user.role } });
    }
  } catch (err) {
    return res.json({ tipo: null, user: null });
  }

  return res.json({ tipo: null, user: null });
});

if (!process.env.VERCEL) {
  server.get("*", (req, res) => {
    res.sendFile(join(angularDistPath, "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

export default server;
