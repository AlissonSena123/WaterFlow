const Sequelize = require('sequelize');
            /*Insira nome do seu banco onde tem waterflow*/
const sequelize = new Sequelize('test', 'root', 'sqllocal', {
    host: 'localhost',
    dialect: 'mysql',
});

async function autenticarBanco() {
    try {
        await sequelize.authenticate()
        console.log("Conexao com o banco estabelecido!");
    }catch(error) {
        console.error("Conexao nao estabelecida");
    }
}

autenticarBanco();

module.exports = sequelize;