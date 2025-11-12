const Sequelize = require('sequelize');

const sequelize = new Sequelize('waterflow', 'root', 'cimatec', {
    host: 'localhost',
    dialect: 'mysql',
});

sequelize.authenticate().then(() => {
    console.log('Conectado ao banco com sucesso!');
}).catch((err) => {
    console.log("Erro ao se conectar com o banco: ", err);
});

module.exports = sequelize;