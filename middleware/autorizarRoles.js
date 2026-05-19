const jwt = require("jsonwebtoken");

function autorizarRoles(...rolesPermitidas) {
  return (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
      // Se for uma requisição de página HTML, redireciona; senão, retorna JSON
      const aceitaHTML = req.headers.accept?.includes("text/html");
      if (aceitaHTML) return res.redirect("/login");
      return res.status(401).json({ success: false, message: "Usuário não autenticado" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      const aceitaHTML = req.headers.accept?.includes("text/html");
      if (aceitaHTML) return res.redirect("/login");
      return res.status(401).json({ success: false, message: "Token inválido ou expirado" });
    }

    if (!rolesPermitidas.includes(payload.role)) {
      return res.status(403).json({ success: false, message: "Acesso negado" });
    }

    // Disponibiliza os dados do usuário para as rotas seguintes
    req.user = payload;
    next();
  };
}

module.exports = autorizarRoles;