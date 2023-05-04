const {Model, DataTypes} = require('sequelize');
const sequelize = require('./model');

class User extends Model{}

User.init({
    username:{
        type: DataTypes.STRING
    },
    pwhash: {
        type: DataTypes.STRING
    },
    permission:{
        type: DataTypes.STRING
    }
},{
    sequelize,
    modelName: 'user'
})

module.exports = User;