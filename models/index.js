'use strict'

const Sequelize = require('sequelize');
const sequalize = new Sequelize({
    dialect: 'sqlite3',
    storage: 'user.db'
});

const User = sequalize.import("./Users.js");

module.exports={
    User
};