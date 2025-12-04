//middleware para proteger as rotas com usuarios cadastrados apenas

function protegersessao(req, res, next){
    if(!req.session.userId){
        console.error("Usuario nao autorizado!")
        return res.redirect("/login");
    }

    next();
}

module.exports = protegersessao;