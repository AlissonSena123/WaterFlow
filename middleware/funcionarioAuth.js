function funcionarioAuth(req, res, next){

    if(!req.session.user){
        return res.redirect("/login");
    }

    const role = req.session.user.role;

    if(role !== "funcionario" && role !== "admin"){
        return res.status(403).send("Acesso negado");
    }

    next();
}

module.exports = funcionarioAuth;