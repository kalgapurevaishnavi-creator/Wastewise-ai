import os

from sqlalchemy import text

from app.db.session import engine


def main() -> None:
    expected_database = os.getenv("SQL_DATABASE", "wastewise_db")
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT DB_NAME() AS database_name, SUSER_SNAME() AS login_name")
        ).one()

    actual_database, login_name = result
    if actual_database != expected_database:
        raise RuntimeError(
            f"Connected to {actual_database!r}, expected {expected_database!r}"
        )

    print(f"Connected to database: {actual_database}")
    print(f"Windows login: {login_name}")


if __name__ == "__main__":
    main()
