# Rules for DB Migration Scripts

### Rules for running these scripts 
- Run from the base folder. (where backend.py is)

### Migration script naming convention
- Naming convention for restructuring the DB should be restructure_DB_\<migration_number>
	- Where \<migration_number> is simply the most recent migration number + 1

### Whenever commiting a migration
- Give a commit message of DB Restructured: Migration #`migration_number`
    - This way it is easy to find when a specific migration occurred.

### Retoring a MYSQL Backup
1. Locate the mysql backup file of your choosing (file should end in .sql)
2. If you can, get mysql.exe added to PATH congrats. Skip to step #4
3. Bring the backup file to the MYSQL bin folder (for me it's: 'C:\Program Files\MySQL\MySQL Server 8.0\bin')
4. Run the command (and enter your password when prompted): .\mysql.exe -u root -p
	- Note: if you were able to use mysql.exe from PATH, then instead type: mysql.exe -u root -p
5. Choose the database you want to import to by running: use \<db_name>
6. Then import the file by running: source \<db_backup_name.sql>
7. Finally, you can quit the MySQL terminal by typing: quit