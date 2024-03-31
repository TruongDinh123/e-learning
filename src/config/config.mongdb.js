("use strict");
const dotenv = require("dotenv");
dotenv.config();

const dev = {
    app: {
        port: process.env.DEV_APP_PORT || 3052,
    },
    db: {
        url: process.env.DEV_DB_URL,
    },
}

const production = {
    app: {
        port: process.env.PRODUCTION_DB_PORT || 3000,
    },
    db: {
        url: process.env.PRODUCTION_DB_URL,
    },
}


const config = {dev, production};
const env = process.env.NODE_ENV || 'dev';

console.log(config[env], env);
module.exports = config[env];