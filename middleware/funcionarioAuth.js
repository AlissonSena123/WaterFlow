function funcionarioAuth(req, res, next){

    if(!req.session.user){
        return res.redirect("/login");
    }

    const role = req.session.user.role;

    if(role !== "funcionario"){
        return res.status(403).send("Acesso negado");
    }

    next();
}

export default funcionarioAuth;