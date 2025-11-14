const Sequelize = require('sequelize');
            /*Insira nome do seu banco onde tem waterflow*/
<<<<<<< HEAD
const sequelize = new Sequelize('test', 'root', 'sqllocal', {
=======
const sequelize = new Sequelize('waterflow3', 'root', 'L@tus_40', {
>>>>>>> 2e493357b7fb80233ac285fca251cebde0d6f487
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