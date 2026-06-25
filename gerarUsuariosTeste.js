import { supabase } from "./config/supabase.js";
import bcrypt from "bcryptjs";

const bairros = [
  "Boca da Mata",
  "Centro",
  "Boa Vista",
  "Cohab",
  "Planalto",
  "São José",
  "Novo Horizonte",
  "Santa Rita",
  "Liberdade",
  "Jardim"
];

async function main() {
  const senhaHash = await bcrypt.hash("123456789123", 10);

  const usuarios = [];

  for (let i = 1; i <= 100; i++) {
    usuarios.push({
      nome_completo: `Usuário Teste ${i}`,
      email: `usuario${String(i).padStart(3, "0")}@teste.com`,
      senha: senhaHash,
      data_nascimento: "2000-01-01",
      telefone: `8199999${String(i).padStart(4, "0")}`,
      cidade: "Salvador",
      estado: "Bahia",
      pais: "Brasil",
      bairro: "Boca da Mata",
      role: "users"
    });
  }

  const { error } = await supabase
    .from("Users")
    .insert(usuarios);

  if (error) {
    console.error(error);
    return;
  }
}

main();