// @ts-nocheck
import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pgDataDir = path.resolve(__dirname, '..', '.pgdata');
const isAlreadyInitialized = fs.existsSync(path.join(pgDataDir, 'PG_VERSION'));

const pg = new EmbeddedPostgres({
  databaseDir: pgDataDir,
  user: 'postgres',
  password: 'postgrespassword',
  port: 5432,
  persistent: true,
});

async function main() {
  console.log('Starting embedded PostgreSQL...');

  if (!isAlreadyInitialized) {
    await pg.initialise();
  }

  await pg.start();

  // Create the database if it does not exist
  const client = pg.getPgClient();
  await client.connect();
  const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = 'zenri_dev'`);
  if (res.rowCount === 0) {
    await client.query('CREATE DATABASE zenri_dev');
    console.log('Created database: zenri_dev');
  } else {
    console.log('Database zenri_dev already exists.');
  }
  await client.end();

  console.log('PostgreSQL is running on port 5432. Press Ctrl+C to stop.');

  // Keep process alive
  process.on('SIGINT', async () => {
    console.log('\nStopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
