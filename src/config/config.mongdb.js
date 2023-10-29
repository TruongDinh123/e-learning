const dev = {
    app: {
        port: process.env.DEV_APP_PORT || 3052,
    },
    db: {
        host: process.env.DEV_DB_HOST || '127.0.0.1',
        port: process.env.DEV_DB_PORT || 27017,
        name: process.env.DEV_DB_NAME || 'elearning_dev',
    },
}

const production = {
    app: {
        port: process.env.PRODUCTION_DB_PORT || 3000,
    },
    db: {
        host: process.env.PRODUCTION_DB_HOST || '127.0.0.1',
        port: process.env.PRODUCTION_DB_PORT || 27017,
        name: process.env.PRODUCTION_DB_NAME || 'elearning_production',
    },
}


const config = {dev, production};
const env = process.env.NODE_ENV || 'dev';

console.log(config[env], env);
module.exports = config[env];