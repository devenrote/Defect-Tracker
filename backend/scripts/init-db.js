require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

(async () => {
  try {
    const {
      DB_HOST = 'localhost',
      DB_USER = 'postgres',
      DB_PASSWORD = '',
      DB_PORT = 5432,
      DB_NAME = 'defect_tracker_pro',
      DB_SSL = 'false',
    } = process.env;

    const rootClient = new Client({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: Number(DB_PORT),
      ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      database: 'postgres',
    });

    await rootClient.connect();

    const existing = await rootClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
    if (existing.rowCount === 0) {
      console.log(`Creating database ${DB_NAME}`);
      await rootClient.query(`CREATE DATABASE "${DB_NAME}" WITH ENCODING='UTF8' LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8' TEMPLATE=template0;`);
    } else {
      console.log(`Database ${DB_NAME} already exists.`);
    }

    await rootClient.end();

    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      if (sql.trim()) {
        const dbClient = new Client({
          host: DB_HOST,
          user: DB_USER,
          password: DB_PASSWORD,
          port: Number(DB_PORT),
          ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
          database: DB_NAME,
        });
        await dbClient.connect();
        console.log('Importing schema.sql...');
        await dbClient.query(sql);
        console.log('Schema imported.');
        await dbClient.end();
      } else {
        console.log('schema.sql is empty.');
      }
    } else {
      console.log('schema.sql not found at', schemaPath);
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing DB:', err.message || err);
    process.exit(1);
  }
})();
