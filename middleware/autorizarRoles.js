//Nova rota que unifica os dois middlewares de acesso (usuario, funcionario e admin);

function autorizarRoles(...rolesPermitidas) {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({success: false, message: "Usuário não autenticado"});
        };

        const role = req.session.user.role

        if(!rolesPermitidas.includes(role)) {
            return res.status(403).json({success: false, message: "Acesso negado"});
        };

        next();
    };
};

module.exports = autorizarRoles;