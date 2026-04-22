const { supabase } = require("../config/supabase");
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const path = require("path");
const adminAuth = require("../middleware/adminAuth");

// --- ROTAS DE CADASTRO (POST /cadastrar) ---
router.post("/cadastrar", async (req, res) => {
  const {
    nome_completo,
    data_nascimento,
    email,
    senha,
    telefone,
    cidade,
    estado,
    pais,
    bairro,
  } = req.body;


  if (!nome_completo || !email || !senha || !bairro) {
    return res.status(400).json({ success: false, message: "Preencha os campos obrigatórios", });
  }

  if (senha.length < 10 || senha.length > 15) {
    return res.status(400).json({ sucess: false, message: "A senha deve ter no minimo 10 a 15 caracteres " });
  }

  try {

    const { data: userExistente, error: selectError } = await supabase
      .from("Users")
      .select("id")
      .eq("email", email);

    if (selectError) throw selectError;

    if (userExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Usuário já cadastrado",
      });
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Insere novo usuário
    const { error: insertError } = await supabase
      .from("Users")
      .insert([
        {
          nome_completo,
          data_nascimento,
          email,
          senha: senhaHash,
          telefone,
          cidade,
          estado,
          pais,
          bairro,
        },
      ]);

    if (insertError) throw insertError;

    return res.status(200).json({
      success: true,
      message: `Usuário ${nome_completo} cadastrado com sucesso!`,
    });

  } catch (err) {
    console.error("Erro ao cadastrar:", err);

    return res.status(500).json({
      success: false,
      message: "Erro ao cadastrar usuário!",
    });
  }
});

// ---- ROTA DE LOGIN (POST /login) ---- 
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.json({ success: false, message: "Preencha todos os campos" });
  }

  try {
    const { data: usuario, error } = await supabase
      .from("Users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !usuario) {
      return res.json({ success: false, message: "Email ou senha inválidos" });
    }

    // Compara a senha digitada com o hash armazenado
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.json({ success: false, message: "Email ou senha inválidos" });
    }
    //*---Forma de salvar sessao antiga---*
    //salvar sessao do usuario;
    //req.session.userId = users.id;
    //req.session.username = users.nome_completo;

    //*---Forma atualizada---*
    req.session.user = {
      id: usuario.id,
      nome: usuario.nome_completo,
      role: usuario.role
    };

    //*--Redirecionar por role--*
    if (usuario.role === "users") {
      return res.json({
        success: true,
        redirect: "/inicio"
      });
    }

    if (usuario.role === "funcionario" || usuario.role === "admin") {
      return res.json({
        success: true,
        redirect: "/admin/dashboard"
      });
    }
    // Login bem-sucedido

    res.json({ success: true });

  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ success: false, message: "Erro interno no servidor" });
  }
});


// --- ROTA DE SOLICITAÇÃO DE REDEFINIÇÃO (POST /redefinirSenha) ---
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
      .single()

    // Regra de Segurança: Não diz se o email foi encontrado, mas simula o envio
    if (!data || error) {
      return res.redirect("/instrucoes_enviadas");
    };

    const users = data;

    const token = crypto.randomBytes(32).toString('hex')

    const expirar = new Date();
    expirar.setHours(expirar.getHours() + 1);

    const { error: updateError } = await supabase
      .from("Users")
      .update({ resetToken: token, tokenExpiration: expirar })
      .eq("id", users.id);

    if (updateError) throw updateError;

    const transporte = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });


    const resetURL = `http://localhost:8080/redefinir-senha/${token}`;

    await transporte.sendMail({
      from: process.env.MAIL_USER,
      to: emailLimpo,
      subject: "Redefinir senha WaterFlow",
      html: `
      <h2>Redefinir Senha</h2>
      <p>Voce pediu para redefinir sua senha.</p>
      <p>Clique no link abaixo para continuar:</p>
      <a href="${resetURL}">${resetURL}</a>
      <p>O link expira em 1 hora.</p>`
    });

    return res.redirect("/instrucoes_enviadas");


  } catch (error) {
    console.error("Erro ao buscar usuário para redefinir senha: ", error);
    res.status(500).send("Erro interno no servidor.");
  }
});

// --- ROTA DE FEEDBACK DE ENVIO (GET /instrucoes_enviadas) ---
router.get("/instrucoes_enviadas", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pages/instrucoesEmail.html"))
});

// --- ROTA DE VALIDAÇÃO DE TOKEN (GET /novaSenha/:token) ---
// Formato de rota tradicional para maior compatibilidade
router.get("/redefinir-senha/:token", async (req, res) => {
  const { token } = req.params;
  const now = new Date();

  try {
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("resetToken", token)
      .gt("tokenExpiration", now.toISOString())
      .single();

    if (!data || error) {
      return res.send("<script>alert('Link de redefinição inválido ou expirado.'); window.location.href= '/login';</script>");
    }

    return res.sendFile(path.join(__dirname, "../public/pages/redefinirsenha.html"));

  } catch (error) {
    console.error("Erro na validação do token:", error);
    res.status(500).send("Erro interno.");
  }
});

// ---- ROTA DE ATUALIZAR SENHA (PUT /usuarios/atualizar-senha/:token) ---- 
router.put("/usuarios/atualizar-senha/:token", async (req, res) => {
  const { senha } = req.body; // AGORA bate com o frontend
  const { token } = req.params;
  const now = new Date();

  try {
    if (!senha || !token) {
      return res.status(400).json({
        sucesso: false,
        error: "Todos os campos são obrigatórios."
      });
    }

    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("resetToken", token)
      .gt("tokenExpiration", now.toISOString())
      .single();

    if (!data || error) {
      return res.status(400).json({
        sucesso: false,
        error: "Link inválido ou expirado."
      });
    }

    const hash = await bcrypt.hash(senha, 10);

    const { error: updateError } = await supabase
      .from("Users")
      .update({
        senha: hash,
        resetToken: null,
        tokenExpiration: null
      })
      .eq("id", data.id);

    if (updateError) throw updateError;

    return res.json({
      sucesso: true,
      message: "Senha atualizada com sucesso!"
    });

  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    res.status(500).json({ error: "Erro interno." });
  }
});

/*ATUALIZAR CAMPOS DE CADASTRO*/
router.patch("/usuarios/atualizar-cadastro", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: "Usuário não autorizado" })
    }
    const id = req.session.user.id;
    const { nome_completo, email, telefone, bairro } = req.body;
    //Verificamos se o usuario existe no banco (passivo a mudanças).
    const { data: user, error: erroBusca } = await supabase
      .from("Users")
      .select("*")
      .eq("id", id)
      .single()
    //condiçao onde se nao tiver para a rota e retorna esse json de erro.
    if (!user || erroBusca) return res.status(404).json({ success: false, message: "Informações não foram encontradas!" });
    //Objeto onde iremos pegar os novos dados inseridos pelo usuário e atualizar no banco 
    const dadosAtualizados = {};

    //se nome não vier vazio (undefined), manda a chave nome com o valor da variavel nome nome = nome;
    if (nome_completo && nome_completo.trim() !== "") {
      dadosAtualizados.nome_completo = nome_completo.trim();
    }

    //se email não vier vazio (undefined), manda a chave nome com o valor da variavel email = email;
    if (email && email.trim() !== "") {
      //limpamos e igualamos o email
      const emailLimpo = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //evitando que caracteres estranhos sejam adicionados ao email

      //condicional que verifica se o email veio ou não com caractéres estranhos.
      if (!emailRegex.test(emailLimpo)) {
        return res.status(400).json({ success: false, message: "Email contém caractéres incomuns." });
      };

      dadosAtualizados.email = emailLimpo;
    };

    if (telefone && telefone.trim() !== "") {
      dadosAtualizados.telefone = telefone.trim();
    };

    if (bairro && bairro.trim() !== "") {
      dadosAtualizados.bairro = bairro
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    };

    //Aqui verificamos se dados atualizados (em forma de array com as chaves), veio vazio ou com os elementos e se vier pula para alterar, se não retorna a mensagem
    if (Object.keys(dadosAtualizados).length === 0) return res.status(400).json({ message: "Nenhum dado a ser atualizado." })

    //verifica se o novo email recebido é igual ao email antigo, evitando duplicidade.
    if (dadosAtualizados.email) {
      const { data: emailExistente } = await supabase
        .from("Users")
        .select("id")
        .eq("email", dadosAtualizados.email)
        .neq("id", id);

      if (emailExistente && emailExistente.length > 0) {
        return res.status(400).json({ success: false, message: "Este email é igual ao já cadastrado, mude o email!" });
      };
    };

    if (dadosAtualizados.nome_completo) {
      req.session.user.nome = dadosAtualizados.nome_completo;
    }

    const { error: updateError } = await supabase
      .from("Users")
      .update(dadosAtualizados)
      .eq("id", id);
    if (updateError) return res.status(400).json({ success: false, message: "Erro ao atualizar informações" });

    return res.status(200).json({ success: true, message: "Campos atualizados com sucesso.", dados: dadosAtualizados });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
});

//Rota para cadastrar funcionarios na página do admin
router.post("/cadastrar/funcionarios", adminAuth, async (req, res) => {
  const {
    nome_completo,
    data_nascimento,
    email,
    senha,
    telefone,
    cidade,
    estado,
    pais,
    bairro,
  } = req.body;

  const { role: roleRecebida } = req.body;

  if (!nome_completo || !email || !senha || !bairro || !roleRecebida) {
    return res.status(400).json({ success: false, message: "Preencha os campos obrigatórios", });
  };

  const emailLimpo = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(emailLimpo)) {
    return res.status(400).json({
      success: false,
      message: "Email inválido"
    });
  }

  if (senha.length < 10 || senha.length > 15) {
    return res.status(400).json({ success: false, message: "A senha deve ter no minimo 10 a 15 caracteres " });
  };

  const bairroNormalizado = normalizarBairro(bairro);

  if (bairroNormalizado === "") {
    return res.status(400).json({ success: false, message: "Bairro inválido" });
  }

  const rolesPermitidas = ["funcionario", "admin"];

  if (!rolesPermitidas.includes(roleRecebida)) {
    return res.status(400).json({ success: false, message: "Role Inválida" })
  };

  if (roleRecebida === "admin") {
    return res.status(403).json({ success: false, message: "Erro, admin nao pode cadastrar outro admin!" });
  };

  const roleFinal = roleRecebida;

  try {

    const { data: userExistente, error: selectError } = await supabase
      .from("Users")
      .select("id")
      .limit(1)
      .eq("email", emailLimpo);

    if (selectError) throw selectError;

    if (Array.isArray(userExistente) && userExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Usuário já cadastrado",
      });
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Insere novo usuário
    const { error: insertError } = await supabase
      .from("Users")
      .insert([
        {
          nome_completo,
          data_nascimento,
          email: emailLimpo,
          senha: senhaHash,
          telefone,
          cidade,
          estado,
          pais,
          bairro: bairroNormalizado,
          role: roleFinal
        },
      ]);

    if (insertError) throw insertError;

    return res.status(200).json({
      success: true,
      message: `Funcionário ${nome_completo} cadastrado com sucesso!`,
    });

  } catch (err) {
    console.error("Erro ao cadastrar:", err);

    return res.status(500).json({
      success: false,
      message: "Erro ao cadastrar usuário!",
    });
  }
});


/* ROTA DE REPORTAR FALTA D'ÁGUA */
router.post("/reporte/enviar", async (req, res) => {
  const { nome, email, rua, bairro, descricao } = req.body

  if (!email || !nome || !rua || !bairro) {
    return res.json({ success: false, message: "Preencha todos os campos" });
  }

  try {
    const { data, error } = await supabase
      .from("reportUsers")
      .insert([
        {
          nome: nome,
          email: email,
          rua: rua,
          bairro: bairro,
          descricao: descricao
        }
      ]);

    if (error) {
      return res.status(400).json({
        sucesso: false,
        error: "Erro ao enviar reporte"
      });
    }

    return res.json({ success: true, message: "Dados enviados com sucesso!" });

  } catch (error) {
    console.error("Erro na validação do token:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor"
    });
  }

});

//rota de logout
router.post("/logout", (req, res) => {
  if (req.session.user) {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Erro ao fazer logout!" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logout realizado com sucesso!", redirect: "/login" });
    });
  } else {
    res.status(400).json({ error: "Nenhum usuário logado." });
  }
});

function normalizarBairro(bairro) {
  return bairro
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = router;