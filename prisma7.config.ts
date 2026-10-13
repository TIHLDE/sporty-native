import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // `prisma generate` (postinstall, også i CI) trenger ikke databasen, så URL-en kan mangle der.
    url: process.env.DATABASE_URL ?? '',
  },
});
