//const { DataTypes } = require("sequelize");


module.exports = function(sequalize, DataTypes){
    return sequalize.define('users',{
        id:{
            type: DataTypes.INTEGER,
            allowNull: true,
            primaryKey: true,
            autoIncrement: true
        },
        username:{
            type: DataTypes.TEXT,
            allowNull: false
        },
        pwhash:{
            type: DataTypes.TEXT,
            allowNull: false
        }
        
    });
};