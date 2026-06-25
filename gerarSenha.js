import bcrypt from "bcryptjs";
import { supabase } from "./config/supabase.js";
(async () => {
  const senha = "123456";
  const hash = await bcrypt.hash(senha, 10);

    const {data:usuario,error} = await supabase
    .from("Funcionarios")
    .insert([
        {
            nome: "Roberto",
            email: "roberto@waterflow.com",
            senha: hash,
            role: "funcionario"
        }
    ])

    if (error) throw error

    return console.log("usuario criado!", usuario)

  console.log(hash);
})();