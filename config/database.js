const Sequelize = require('sequelize');
const sequelize = new Sequelize('wtfl', 'root', 'L@tus_40', {
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