//Nova rota que unifica os dois middlewares de acesso (usuario, funcionario e admin);

function autorizarRoles(...rolesPermitidas) {
    return (req, res, next) => {

        const session = req.session.user || req.session.admin;

        if (!session) {
            return res.status(401).json({success: false, message: "Usuário não autenticado"});
        };

        const role = session.role;

        if(!rolesPermitidas.includes(role)) {
            return res.status(403).json({success: false, message: "Acesso negado"});
        };

        next();
    };
};

module.exports = autorizarRoles;