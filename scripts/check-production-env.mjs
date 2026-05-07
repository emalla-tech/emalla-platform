import {
  loadEnv,
  getAppConfig,
  getAuthConfig,
  getDatabaseConfig,
  getEmailConfig,
  getEnvValidation,
  getRuntimeConfig,
  getStorageConfig
} from '../backend/env.js';

const redact = (value = '') => (value ? 'configured' : 'missing');

const main = async () => {
  await loadEnv();

  const runtime = getRuntimeConfig();
  const database = getDatabaseConfig();
  const auth = getAuthConfig();
  const app = getAppConfig();
  const email = getEmailConfig();
  const storage = getStorageConfig();
  const validation = getEnvValidation();

  console.log('E-Malla Rwanda production environment check');
  console.log(`Mode: ${runtime.nodeEnv}`);
  console.log(`DB provider: ${database.provider}`);
  console.log(`DATABASE_URL: ${redact(database.databaseUrl)}`);
  console.log(`PUBLIC_APP_URL: ${app.publicAppUrl ? 'configured' : 'missing'}`);
  console.log(`CORS origins: ${app.corsAllowedOrigins.length}`);
  console.log(`JWT_SECRET: ${redact(auth.jwtSecret)}`);
  console.log(`SESSION_SECRET: ${redact(auth.sessionSecret)}`);
  console.log(`Email provider: ${email.provider}`);
  console.log(`Storage provider: ${storage.provider}`);
  console.log('');

  if (validation.warnings.length) {
    console.log('Warnings:');
    validation.warnings.forEach((warning) => console.log(`- ${warning}`));
    console.log('');
  }

  if (validation.issues.length) {
    console.error('Blocking issues:');
    validation.issues.forEach((issue) => console.error(`- ${issue}`));
    process.exit(1);
  }

  console.log('Environment configuration is ready.');
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
