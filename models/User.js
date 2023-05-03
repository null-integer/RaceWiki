const {Model, DataTypes} = require('sequelize');
const sequelize = require('./index');

class User extends Model{}

User.init({
    username:{
        type: DataTypes.STRING
    },
    pwhash: {
        type: DataTypes.STRING
    }
},{
    sequelize,
    modelName: 'user'
})

module.exports = User;