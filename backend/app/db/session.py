import os
from collections.abc import Generator
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import Session, sessionmaker

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def _environment_flag(name: str, default: str) -> bool:
    value = os.getenv(name, default).strip().lower()
    if value in {"1", "true", "yes"}:
        return True
    if value in {"0", "false", "no"}:
        return False
    raise ValueError(f"{name} must be set to yes/no, true/false, or 1/0")


server = os.getenv("SQL_SERVER", "localhost").strip()
database = os.getenv("SQL_DATABASE", "wastewise_db").strip()
driver = os.getenv("SQL_DRIVER", "ODBC Driver 18 for SQL Server").strip()
trust_server_certificate = _environment_flag(
    "SQL_TRUST_SERVER_CERTIFICATE", "no"
)
connection_timeout = int(os.getenv("SQL_CONNECTION_TIMEOUT", "5"))

if not server:
    raise ValueError("SQL_SERVER must not be empty")
if not database:
    raise ValueError("SQL_DATABASE must not be empty")
if not driver:
    raise ValueError("SQL_DRIVER must not be empty")
if connection_timeout <= 0:
    raise ValueError("SQL_CONNECTION_TIMEOUT must be a positive integer")

odbc_connection_string = (
    f"DRIVER={{{driver}}};"
    f"SERVER={server};"
    f"DATABASE={database};"
    "Trusted_Connection=yes;"
    "Encrypt=yes;"
    f"TrustServerCertificate={'yes' if trust_server_certificate else 'no'};"
    f"Connection Timeout={connection_timeout};"
)

engine = create_engine(
    URL.create("mssql+pyodbc", query={"odbc_connect": odbc_connection_string}),
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()