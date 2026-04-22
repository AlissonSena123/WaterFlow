function auth(req,res,next){

   console.log("SESSION:", req.session);

   if(!req.session.user){
      console.log("Usuario nao autorizado!");
      return res.redirect("/login");
   }

   next();
}

module.exports = auth;