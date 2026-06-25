import fs from "fs"

const usuarios = fs
    .readFileSync("usuarios.csv", "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .map(linha => {

        const [email, senha] = linha.split(",");

        return {
            email
        };

    });


const tipos = [
    "SEM ÁGUA",
    "PRESSÃO BAIXA",
    "VAZAMENTO",
    "OUTRO"
];


const bairros = [
    "Barra",
    "Pituba",
    "Ondina",
    "Brotas",
    "Cabula"
];


let csv = 
"nome,email,tipo,rua,bairro,descricao\n";


usuarios.forEach((usuario,index)=>{


    const tipo =
        tipos[
            Math.floor(
                Math.random()*tipos.length
            )
        ];


    const bairro =
        bairros[
            Math.floor(
                Math.random()*bairros.length
            )
        ];


    csv +=
`Usuario Teste ${index+1},${usuario.email},${tipo},Rua Teste ${index+1},${bairro},Problema de ${tipo.toLowerCase()} registrado pelo usuário\n`;

});


fs.writeFileSync(
    "reportes.csv",
    csv
);


console.log(
    "reportes.csv criado com sucesso"
);