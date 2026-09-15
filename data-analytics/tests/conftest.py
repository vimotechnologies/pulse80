"""Real disposable PostgreSQL; never reads a cloud connection string or real data."""
from pathlib import Path
import pgserver
from urllib.parse import urlparse
import psycopg
import pytest

ROOT = Path(__file__).resolve().parents[2]

def pytest_addoption(parser):
    parser.addoption('--local-test-dsn', default=None,
                     help='Optional EMPTY disposable PostgreSQL on loopback only; never a cloud database.')


@pytest.fixture(scope='session')
def server(tmp_path_factory, request):
    dsn = request.config.getoption('--local-test-dsn')
    if dsn:
        if urlparse(dsn).hostname not in ('localhost', '127.0.0.1', '::1'):
            raise ValueError('Only a disposable loopback database is allowed')
        class LocalDatabase:
            def get_uri(self):
                return dsn
        yield LocalDatabase()
        return
    instance = pgserver.get_server(tmp_path_factory.mktemp('pulse80-pg'), cleanup_mode='delete')
    yield instance
    instance._cleanup()

@pytest.fixture(scope='session')
def database(server):
    with psycopg.connect(server.get_uri(), autocommit=True) as connection:
        if connection.execute("SELECT count(*) FROM pg_tables WHERE schemaname IN ('public','auth','storage','analytics')").fetchone()[0]:
            raise ValueError('Test database must be empty; refusing to modify an existing database')
        connection.execute((Path(__file__).parent / 'supabase_test_shim.sql').read_text())
        for migration in sorted((ROOT / 'pulse80-backend/supabase/migrations').glob('*.sql')):
            try:
                connection.execute(migration.read_text())
            except Exception as error:
                raise RuntimeError(f'Migration failed: {migration.name}') from error
        sql = (ROOT / 'data-analytics/sql/001_dashboard_analytics_views.sql').read_text()
        connection.execute(sql)
        connection.execute(sql)  # Reapplying the view definitions must be safe.
    yield server.get_uri()

@pytest.fixture
def db(database):
    with psycopg.connect(database) as connection:
        try:
            yield connection
        finally:
            connection.rollback()
