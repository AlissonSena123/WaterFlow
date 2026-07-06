//Service para busca de usuario no banco de dados para unificar a rota de login no router de usuarios.js

//importamos o supabase;
import { supabase } from "../config/supabase.js";

//funçao assincrona para buscar o usuario por email (a senha nao entra aqui, porque caso ele n encontre usuario padrao, vai para outra funçao de buscar funcionario);

async function buscarUsuarioPorEmail(email) {
    const { data: user, error} = await supabase
    .from("Users")
    .select("*")
    .eq("email", email)
    .maybeSingle(); //maybesingle é uma funçao do supabase que impede que de erro caso no encontre, o intuito com ele é caso ele retorne null, ele deixe passar ao inves de barrar

    if (error) {
        console.error("Erro ao buscar usuário: ", error);
        throw error;
    };

    return user;
};

export { buscarUsuarioPorEmail };