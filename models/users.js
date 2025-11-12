const dataTypes = require('sequelize');
const sequelize = require('../routers/bancoDados');

const User = sequelize.define('usuarios', {
    id: {
        type: dataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    nome_completo: {
        type: dataTypes.STRING,
        allowNull: false
    },

    data_nascimento: {
        type: dataTypes.DATEONLY,
        allowNull: false
    },

     email: {
        type: dataTypes.STRING,
        allowNull: false,
        unique: true
    },

    senha: {
        type: dataTypes.STRING,
        allowNull: false
    },

     telefone: {
        type: dataTypes.STRING,
        allowNull: false
    },

     CEP: {
        type: dataTypes.STRING,
        allowNull: false
    }
    }, {
        tableName: 'usuarios',
        timestamps: false 
});

module.exports = User;