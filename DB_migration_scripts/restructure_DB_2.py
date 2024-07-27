from g import get_db_conn, get_db_cursor


dbPTR = get_db_cursor()
db = get_db_conn()

dbPTR.execute("ALTER TABLE songs MODIFY COLUMN album VARCHAR(100)")
db.commit()