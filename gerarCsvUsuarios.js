import { supabase } from "./config/supabase.js";
import fs from "fs";

async function gerarCSV() {
  const { data, error } = await supabase
    .from("Users")
    .select("email")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  let csv = "email,senha\n";

  data.forEach((usuario) => {
    csv += `${usuario.email},123456789123\n`;
  });

  fs.writeFileSync("usuarios.csv", csv);

  console.log(`CSV gerado com ${data.length} usuários.`);
}

gerarCSV();