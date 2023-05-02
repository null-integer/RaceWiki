const {Sequelize} = require('sequelize');

const sequelize = new Sequelize('users','username','pwhash',{
    dialect: 'sqlite',
    host: './user.sqlite'
})

module.exports = sequelize;