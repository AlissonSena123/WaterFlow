const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Usuario = sequelize.define("Usuario", {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome_completo: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
  },
  senha: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  telefone: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  CEP: {
    type: DataTypes.STRING(9),
    allowNull: false,
  },
  cidade: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  pais: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  data_nascimento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  criado_em: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  atualizado_em: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "usuarios",
  timestamps: false,
});

module.exports = Usuario;
