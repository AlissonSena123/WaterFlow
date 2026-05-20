function auth(req,res,next){

   console.log("SESSION:", req.session);

   if(!req.session.user){
      console.log("Usuario não autorizado!");
      return res.redirect("/login");
   }

   next();
}

export default auth;