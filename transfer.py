import sqlite3
from sqlalchemy import create_engine, MetaData, Table, insert


sqlite_conn = sqlite3.connect(r'C:\Users\brian.pisanechi\OneDrive - CFA Institute\Documents\Alt Data Table\Alt Data Table V2\instance\tasks.db')
sqlite_cursor = sqlite_conn.cursor()

postgres_engine = create_engine('postgresql://atldatatable_user:IU8VoPGfRQqy35UXKTqoJA4g958N4yyp@dpg-cgn6tqjh4hsvot3l21ug-a.oregon-postgres.render.com/atldatatable')

metadata = MetaData()
metadata.reflect(bind=postgres_engine)

for table_name in sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table';"):
    table_name = table_name[0]
    table = Table(table_name, metadata, autoload_with=postgres_engine)

    # Fetch data from the SQLite table
    sqlite_cursor.execute(f"SELECT * FROM {table_name}")
    rows = sqlite_cursor.fetchall()

    # Insert data into the PostgreSQL table
    if rows:
        with postgres_engine.begin() as connection:
            connection.execute(table.insert(), [dict(zip([column.name for column in table.columns], row)) for row in rows])

sqlite_conn.close()
