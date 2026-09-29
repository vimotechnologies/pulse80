// JSON-lines bridge for the Python suite, backed by an in-memory PostgreSQL engine.
import { createRequire } from 'node:module';
import { createInterface } from 'node:readline';
const require = createRequire(new URL('../../../pulse80-backend/package.json', import.meta.url));
const { PGlite } = require('@electric-sql/pglite');
const db = new PGlite();
await db.waitReady;
console.log(JSON.stringify({ ready: true }));
try {
  for await (const line of createInterface({ input: process.stdin })) {
    const request = JSON.parse(line);
    try {
      if (request.operation === 'close') break;
      if (request.operation === 'script') {
        await db.exec(request.sql);
        console.log(JSON.stringify({ rows: [] }));
      } else {
        const result = await db.query(request.sql, request.params ?? []);
        console.log(JSON.stringify({ rows: result.rows.map(row => result.fields.map(field => row[field.name])) }));
      }
    } catch (error) {
      console.log(JSON.stringify({ error: error.message, code: error.code }));
    }
  }
} finally {
  await db.close();
}
