function adminAuth(req, res, next){

    if(!req.session.user){
        return res.redirect("/login");
    }

    const role = req.session.user.role;

    if(role !== "admin"){
        return res.status(403).send("Acesso negado");
    }

    next();
}

export default adminAuth;