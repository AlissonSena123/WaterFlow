import jwt from "jsonwebtoken";

function autorizarRoles(...rolesPermitidas) {
  return (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
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

    if (!rolesPermitidas.includes(payload.tipo)) {
      return res.status(403).json({ success: false, message: "Acesso negado" });
    }

    req.user = payload;
    next();
  };
}

export default autorizarRoles;