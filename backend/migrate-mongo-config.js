/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();

// Extract database name from connection string if present
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/WettenHalls';
const dbName = url.split('/').pop()?.split('?')[0] || 'WettenHalls';

const config = {
  mongodb: {
    url: url.replace(`/${dbName}`, ''), // Base URL without DB name
    databaseName: dbName,

    options: {
      // connectTimeoutMS: 3600000,
      // socketTimeoutMS: 3600000,
    },
  },

  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  lockCollectionName: 'changelog_lock',
  lockTtl: 0,
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'commonjs',
};

module.exports = config;
