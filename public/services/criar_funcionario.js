const bcrypt = require("bcrypt");
const { supabase } = require("../../config/supabase.js");

async function criarFuncionario() {
    const senha = "123456";

    const senhaHash = await bcrypt.hash(senha, 10);

    const { data: funcionario, error} = await supabase
    .from("Funcionarios")
    .insert([{
        nome: "Carlos",
        email: "carlos@waterflow.com",
        senha: senhaHash,
        role: "funcionario"
    }]);

    if (error) {
        console.error("Erro:", error);
    } else {
        console.log("Funcionário criado com sucesso");
        console.log("Senha usada:", senha);
    }
    return funcionario;
};

criarFuncionario();