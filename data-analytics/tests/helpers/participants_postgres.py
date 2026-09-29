"""Small test-only adapter for the isolated PostgreSQL process."""

import json
from pathlib import Path
import re
import subprocess


class PostgresError(Exception):
    def __init__(self, message, code):
        super().__init__(message)
        self.code = code


class QueryResult:
    def __init__(self, rows):
        self.rows = rows

    def fetchone(self):
        return self.rows[0] if self.rows else None


class PostgresDatabase:
    def __init__(self):
        self.process = subprocess.Popen(
            ["node", str(Path(__file__).with_name("participants-postgres.mjs"))],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE,
            stderr=subprocess.PIPE, text=True,
        )
        ready = self.process.stdout.readline()
        if not ready:
            _, error = self.process.communicate(timeout=10)
            raise RuntimeError(
                "Could not start PostgreSQL. Run npm ci --prefix pulse80-backend.\n" + error
            )
        if not json.loads(ready).get("ready"):
            self.close()
            raise RuntimeError("PostgreSQL did not report readiness")

    def request(self, operation, sql, params=()):
        self.process.stdin.write(json.dumps({
            "operation": operation, "sql": sql, "params": params,
        }) + "\n")
        self.process.stdin.flush()
        response = json.loads(self.process.stdout.readline())
        if "error" in response:
            raise PostgresError(response["error"], response.get("code"))
        return QueryResult(response["rows"])

    def execute(self, sql, params=()):
        # Only fixture INSERT statements use SQLite's positional placeholders.
        # The production query is sent unchanged through query().
        positions = iter(range(1, len(params) + 1))
        sql = re.sub(r"\?", lambda _: f"${next(positions)}", sql)
        return self.query(sql, params)

    def query(self, sql, params=()):
        return self.request("query", sql, params)

    def executemany(self, sql, rows):
        for row in rows:
            self.execute(sql, row)

    def executescript(self, sql):
        self.request("script", sql)

    def close(self):
        try:
            self.process.communicate('{"operation":"close"}\n', timeout=10)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.communicate()
