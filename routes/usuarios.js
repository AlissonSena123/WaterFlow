import { supabase } from "../config/supabase.js";
import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import { buscarUsuarioPorEmail } from "../services/userService.js";
import { buscarFuncionarioPorEmail } from "../services/funcionarioService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Helper: gera e seta o cookie JWT
function setAuthCookie(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 1000 // 1 hora
  });
}

// Helper: lê o usuário autenticado do cookie
function getAuthUser(req) {
  const token = req.cookies?.token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// --- ROTA DE CADASTRO ---
router.post("/cadastrar", async (req, res) => {
  const { nome_completo, data_nascimento, email, senha, telefone, cidade, estado, pais, bairro } = req.body;

  if (!nome_completo || !email || !senha || !bairro || !data_nascimento || !telefone) {
    return res.status(400).json({ success: false, message: "Preencha todos os campos" });
  }

  if (senha.length < 10 || senha.length > 15) {
    return res.status(400).json({ success: false, message: "A senha deve ter de 10 a 15 caracteres" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nomeNormalizado = nome_completo.trim().replace(/\s+/g, ' ');
  const nomeRegex = /^[A-Za-zÀ-ÿ' -]{5,100}$/;
  const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;

if (!emailRegex.test(email) || !nomeRegex.test(nomeNormalizado) || !telefoneRegex.test(telefone)) {
  return res.status(400).json({ success: false, message: "Informações inválidas" });
}

try {
  const { data: userExistente, error: selectError } = await supabase
    .from("Users")
    .select("id")
    .eq("email", email);

  if (selectError) throw selectError;

  if (userExistente.length > 0) {
    return res.status(400).json({ success: false, message: "Usuário já cadastrado" });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const { error: insertError } = await supabase
    .from("Users")
    .insert([{ nome_completo, data_nascimento, email, senha: senhaHash, telefone, cidade, estado, pais, bairro }]);

  if (insertError) throw insertError;

  return res.status(200).json({ success: true, message: `Usuário ${nome_completo} cadastrado com sucesso!` });

} catch (err) {
  console.error("Erro ao cadastrar:", err);
  return res.status(500).json({ success: false, message: "Erro ao cadastrar usuário!" });
}
});

// --- ROTA DE LOGIN ---
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ success: false, message: "Preencha todos os campos" });
  }

  try {
    const usuario = await buscarUsuarioPorEmail(email);
    const funcionario = await buscarFuncionarioPorEmail(email);

    if (usuario && funcionario) {
      return res.status(400).json({ success: false, message: "Conta duplicada. Contate o suporte." });
    }

    const conta = usuario || funcionario;

    if (!conta) {
      return res.status(400).json({ success: false, message: "Email ou senha inválidos." });
    }

    const senhaCorreta = await bcrypt.compare(senha, conta.senha);

    if (!senhaCorreta) {
      return res.status(400).json({ success: false, message: "Email ou senha inválidos." });
    }

    if (funcionario) {
      setAuthCookie(res, {
        id: conta.id,
        nome: conta.nome,
        role: conta.role,
        tipo: "funcionario"
      });
      return res.json({ success: true, redirect: "/admin/dashboard" });
    }

    if (usuario) {
      setAuthCookie(res, {
        id: conta.id,
        nome: conta.nome_completo,
        email: conta.email,
        bairro: conta.bairro,
        role: conta.role,
        tipo: "users"
      });
      return res.json({ success: true, redirect: "/inicio" });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Erro interno" });
  }
});

// --- ROTA DE REDEFINIÇÃO DE SENHA ---
router.post("/redefinirSenha", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.send("<script>alert('Parâmetro de email não fornecido.'); window.history.back();</script>");
  }

  const emailLimpo = email.trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("email", emailLimpo)
      .single();

    if (!data || error) {
      return res.status(404).json({ success: false, message: "Email não encontrado" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expirar = new Date();
    expirar.setHours(expirar.getHours() + 1);

    const { error: updateError } = await supabase
      .from("Users")
      .update({ resetToken: token, tokenExpiration: expirar })
      .eq("id", data.id);

    if (updateError) throw updateError;

    const transporte = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      tls: { rejectUnauthorized: false }
    });

    const baseURL = process.env.BASE_URL || "http://localhost:8080";
    const resetURL = `${baseURL}/redefinir-senha/${token}`;

    await transporte.sendMail({
      from: process.env.MAIL_USER,
      to: emailLimpo,
      subject: "Redefinir senha WaterFlow",
      html: `
      <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family:sans-serif; max-width:520px; margin:0 auto; padding: 0px;">
          <div style="background: linear-gradient(135deg, #0ea5e9, #0369a1); padding: 32px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; letter-spacing: 1px;">
              <img src="cid:LogoWaterFlow" style="width: 125px;"/>
            </h1>
          </div>
          <div style="background:#fff;border:1px solid #e2e8f0; padding:10px; border-radius:0px 0px 8px 8px;">
            <h2 style="text-align:center; color: #1e3a5f; font-size: 28px; text-transform: uppercase; margin: 0px;">Redefinir Senha</h2>
            <p style="text-align:center;">Você pediu para redefinir sua senha.</p>
            <p style="text-align:center;">Clique no link abaixo para continuar:</p>
            <a style="text-align:center;" href="${resetURL}">${resetURL}</a>
            <p style="text-align:center;">O link expira em 1 hora.</p>
          </div>
        </body>
        </html>`,
      attachments: [{
        filename: "LogoWhiteV1.png",
        path: "./frontend/public/assets/Img/LogoWhiteV1.png",
        cid: "LogoWaterFlow"
      }]
    });

    // return res.sendFile(path.join(__dirname, "../public/pages/instrucoesEmail.html"));
    return res.status(200).json({ success: true, redirect: "/instrucoes_enviadas" })

  } catch (error) {
    console.error("Erro ao buscar usuário para redefinir senha: ", error);
    res.status(500).send("Erro interno no servidor.");
  }
});

// --- VALIDAÇÃO DE TOKEN (API para Angular) ---
router.get("/api/validar-token-senha/:token", async (req, res) => {
  const { token } = req.params;
  const now = new Date();

  try {
    const { data, error } = await supabase
      .from("Users")
      .select("id, email")
      .eq("resetToken", token)
      .gt("tokenExpiration", now.toISOString())
      .single();

    if (!data || error) {
      return res.status(400).json({ success: false, message: "Link de redefinição inválido ou expirado." });
    }

    return res.json({ success: true, email: data.email });

  } catch (error) {
    console.error("Erro na validação do token:", error);
    res.status(500).json({ success: false, message: "Erro interno." });
  }
});

// --- ATUALIZAR SENHA ---
router.put("/usuarios/atualizar-senha/:token", async (req, res) => {
  const { senha } = req.body;
  const { token } = req.params;
  const now = new Date();

  try {
    if (!senha || !token) {
      return res.status(400).json({ sucesso: false, error: "Todos os campos são obrigatórios." });
    }

    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("resetToken", token)
      .gt("tokenExpiration", now.toISOString())
      .single();

    if (!data || error) {
      return res.status(400).json({ sucesso: false, error: "Link inválido ou expirado." });
    }

    const hash = await bcrypt.hash(senha, 10);

    const { error: updateError } = await supabase
      .from("Users")
      .update({ senha: hash, resetToken: null, tokenExpiration: null })
      .eq("id", data.id);

    if (updateError) throw updateError;

    return res.json({ sucesso: true, message: "Senha atualizada com sucesso!" });

  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    res.status(500).json({ error: "Erro interno." });
  }
});

// --- ATUALIZAR PERFIL ---
router.patch("/usuarios/atualizar/perfil", async (req, res) => {

  const authUser = getAuthUser(req);
  const id = authUser.id;
  const { nome_completo, email, telefone, bairro } = req.body;

  if (!nome_completo || !email || !telefone || !bairro) return res.status(404).json({ success: false, message: "Preencha todos os campos corretamente" });

  const nomeRegex = /^[A-Za-zÀ-ÿ'-]+( [A-Za-zÀ-ÿ'-]+)+$/;
  const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;

  if (!telefoneRegex.test(telefone) || !nomeRegex.test(nome_completo)) {
    return res.status(400).json({ success: false, message: "Informações inválidas para atualização" });
  }

  try {
    if (!authUser) {
      return res.status(401).json({ success: false, message: "Usuário não autorizado" });
    }

    const { data: user, error: erroBusca } = await supabase
      .from("Users")
      .select("*")
      .eq("id", id)
      .single();

    if (!user || erroBusca) {
      return res.status(404).json({ success: false, message: "Informações não foram encontradas!" });
    }

    const dadosAtualizados = {};

    if (nome_completo && nome_completo.trim() !== "") {
      dadosAtualizados.nome_completo = nome_completo.trim();
    }

    if (email && email.trim() !== "") {
      const emailLimpo = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailLimpo)) {
        return res.status(400).json({ success: false, message: "Email contém caracteres incomuns." });
      }
      dadosAtualizados.email = emailLimpo;
    }

    if (telefone && telefone.trim() !== "") dadosAtualizados.telefone = telefone.trim();

    if (bairro && bairro.trim() !== "") {
      dadosAtualizados.bairro = bairro.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    if (Object.keys(dadosAtualizados).length === 0) {
      return res.status(400).json({ message: "Nenhum dado a ser atualizado." });
    }

    if (dadosAtualizados.email) {
      const { data: emailExistente } = await supabase
        .from("Users")
        .select("id")
        .eq("email", dadosAtualizados.email)
        .neq("id", id);

      if (emailExistente && emailExistente.length > 0) {
        return res.status(400).json({ success: false, message: "Este email é igual ao já cadastrado, mude o email!" });
      }
    }

    const { data, error } = await supabase
      .from("Users")
      .update(dadosAtualizados)
      .eq("id", id)
      .select();

    if (error) {
      return res.status(400).json({ success: false, message: "Erro ao atualizar informações" });
    }

    // Renova o cookie com os dados atualizados
    const novoPayload = {
      id: authUser.id,
      nome: dadosAtualizados.nome_completo || authUser.nome,
      email: dadosAtualizados.email || authUser.email,
      bairro: dadosAtualizados.bairro || authUser.bairro,
      role: authUser.role,
      tipo: authUser.tipo
    };
    setAuthCookie(res, novoPayload);

    return res.status(200).json({ success: true, message: "Campos atualizados com sucesso.", dados: dadosAtualizados });

  } catch (error) {
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// --- REPORTAR FALTA D'ÁGUA ---
router.post("/reporte/enviar", async (req, res) => {
  const { nome, email, tipo, rua, bairro, descricao } = req.body;

  if (!email || !nome || !rua || !bairro || !tipo) {
    return res.json({ success: false, message: "Preencha todos os campos" });
  }

  try {
    const { error } = await supabase
      .from("reportUsers")
      .insert([{ nome, email, tipo_problema: tipo, rua, bairro, descricao }]);

    if (error) {
      return res.status(400).json({ sucesso: false, error: "Erro ao enviar reporte" });
    }

    return res.json({ success: true, message: "Report enviado com sucesso!" });

  } catch (error) {
    console.error("Erro ao enviar reporte:", error);
    res.status(500).json({ success: false, message: "Erro interno do servidor" });
  }
});

// --- MEUS REPORTES ---
router.get("/api/meus-reportes", async (req, res) => {
  const authUser = getAuthUser(req);
  const email = authUser?.email;

  if (!email) return res.json({ success: false, error: "Não autenticado." });

  const expiracao = new Date();
  expiracao.setMinutes(expiracao.getMinutes() - 3);

  const { data, error } = await supabase
    .from("reportUsers")
    .select("id, bairro, status, resposta_admin, respondido_em")
    .eq("email", email)
    .not("resposta_admin", "is", null)
    .gte("respondido_em", expiracao.toISOString())
    .order("respondido_em", { ascending: false });

  if (error) return res.json({ success: false, error });
  res.json({ success: true, data });
});

// --- ALERTAS DO BAIRRO ---
router.get("/api/alertas-bairro", async (req, res) => {
  const authUser = getAuthUser(req);
  const bairro = authUser?.bairro;

  if (!bairro) return res.json({ success: false, error: "Não autenticado." });

  const expiracao = new Date();
  expiracao.setDate(expiracao.getDate() - 7);

  const { data, error } = await supabase
    .from("abastecimento")
    .select("id, bairro, status, atualizado_em")
    .ilike("bairro", `%${bairro}%`)
    .neq("status", "NORMAL")
    .gte("atualizado_em", expiracao.toISOString())
    .order("atualizado_em", { ascending: false });

  if (error) return res.json({ success: false, error });
  res.json({ success: true, data });
});

// --- CONTAGEM DE REPORTES ---
router.get("/reportes/contagem/:email", async (req, res) => {
  const { email } = req.params;

  const { count, error } = await supabase
    .from("reportUsers")
    .select("*", { count: "exact", head: true })
    .eq("email", email);

  if (error) return res.status(500).json({ success: false });
  return res.status(200).json({ success: true, total: count });
});

// --- BUSCAR REPORTES DO USUÁRIO ---
router.get("/meus-reportes/:email", async (req, res) => {
  const { email } = req.params;

  const { data, error } = await supabase
    .from("reportUsers")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ success: false });
  return res.status(200).json({ success: true, reportes: data });
});

// --- DELETAR CONTA ---
router.delete("/usuarios/deletar", async (req, res) => {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: "Usuário não autenticado" });
    }

    const id = authUser.id;

    const { error } = await supabase
      .from("Users")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({ success: false, message: "Erro ao deletar conta" });
    }

    res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
    return res.status(200).json({ success: true, message: "Conta deletada com sucesso" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Erro interno do servidor" });
  }
});

export default router;