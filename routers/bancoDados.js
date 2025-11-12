/*const mysql = require('mysql2');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "L@tus_40",
    database: "Waterflow"
});

db.connect((err) => {
    if(err){
        console.error("Erro ao conectar com o Banco SQL: ", err.message);
    }
    console.log("Conexão com o Banco SQL realizado com sucesso!");
});

module.exports = db;*/

const Sequelize = require('sequelize');
const sequelize = new Sequelize('waterflow','root','L@tus_40', {
    host: 'localhost',
    dialect: 'mysql'
});

sequelize.authenticate().then(() => {
    console.log("Conectado com sucesso");
}).catch((error) => {
    console.log("Falha ao conectar com banco de dados!", error);
});

module.exports = sequelize;