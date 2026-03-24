const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Poligono = sequelize.define("Poligono", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    nome_area: {
        type: DataTypes.STRING,
        allowNull: false
    },

    status: {
        type: DataTypes.STRING,
        defaultValue: "sem_agua"
    },

    cor: {
        type: DataTypes.STRING,
        defaultValue: "red"
    },

    geojson: {
        type: DataTypes.JSON 
    }
})

async function criarTables() {
    await Poligono.sync();
};

criarTables();

module.exports = Poligono;