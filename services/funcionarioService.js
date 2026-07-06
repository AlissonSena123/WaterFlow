import { supabase } from "../config/supabase.js";

//aqui temos o service com a mesma logica do usuario.
async function buscarFuncionarioPorEmail(email) {
    const { data: user, error} = await supabase
    .from("Funcionarios")
    .select("*")
    .eq("email", email)
    .maybeSingle();

    if (error) console.log("Erro: ", error);

    return user;
};

export { buscarFuncionarioPorEmail };