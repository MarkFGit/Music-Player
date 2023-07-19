from g import get_db_conn, get_db_cursor
import backend_env

import os

# Before running this script, make sure you have all cover images in the appropriate songCovers folder!


dbPTR = get_db_cursor()
db = get_db_conn()

db.autocommit = True

dbPTR.execute("ALTER TABLE `last added` RENAME songs")


dbPTR.execute("ALTER TABLE songs ADD has_cover_image bit")



dbPTR.execute("""SELECT `File Name` FROM songs""")
allSongs = dbPTR.fetchall()

for song_file_name in allSongs:
	song_file_name = song_file_name[0]
	if(os.path.exists(f'./static/media/songCovers/{song_file_name[:-4]}.jpeg')):
		dbPTR.execute("""UPDATE songs SET has_cover_image = %s WHERE `file name` = %s""", (1, song_file_name))
	else:
		dbPTR.execute("""UPDATE songs SET has_cover_image = %s WHERE `file name` = %s""", (0, song_file_name))

dbPTR.execute("SELECT has_cover_image FROM songs WHERE has_cover_image = NULL")
# Check that none are null
assert(len(dbPTR.fetchall()) == 0)


# Update the 'songs' table
dbPTR.execute("ALTER TABLE songs MODIFY COLUMN has_cover_image bit NOT NULL")
dbPTR.execute("ALTER TABLE songs RENAME COLUMN `File Name` TO file_name")
dbPTR.execute("ALTER TABLE songs RENAME COLUMN Title TO title")
dbPTR.execute("ALTER TABLE songs DROP COLUMN `Formatted Song Time`")
dbPTR.execute("ALTER TABLE songs RENAME COLUMN `Song Time Seconds` TO duration_seconds")
dbPTR.execute("ALTER TABLE songs MODIFY COLUMN duration_seconds SMALLINT UNSIGNED NOT NULL")
dbPTR.execute("ALTER TABLE songs RENAME COLUMN Artist TO artist")
dbPTR.execute("ALTER TABLE songs RENAME COLUMN Album TO album")
dbPTR.execute("ALTER TABLE songs RENAME COLUMN `Date Created` TO datetime_created")
dbPTR.execute("ALTER TABLE songs MODIFY COLUMN datetime_created DATETIME NOT NULL")
dbPTR.execute("ALTER TABLE songs RENAME COLUMN Plays TO plays")
dbPTR.execute("ALTER TABLE songs MODIFY COLUMN plays SMALLINT UNSIGNED NOT NULL")



# Update the 'playlist metadata' table
dbPTR.execute("ALTER TABLE `playlist metadata` RENAME playlist_metadata")
dbPTR.execute("ALTER TABLE playlist_metadata RENAME COLUMN `Actual Playlist Name` TO playlist")
dbPTR.execute("ALTER TABLE playlist_metadata DROP PRIMARY KEY, ADD PRIMARY KEY (playlist)")
dbPTR.execute("ALTER TABLE playlist_metadata DROP COLUMN `Table Name`")
dbPTR.execute("ALTER TABLE playlist_metadata RENAME COLUMN `Date Created` TO datetime_created")
dbPTR.execute("ALTER TABLE playlist_metadata MODIFY COLUMN datetime_created DATETIME NOT NULL")
dbPTR.execute("ALTER TABLE playlist_metadata DROP COLUMN `Total Seconds`")
dbPTR.execute("ALTER TABLE playlist_metadata DROP COLUMN `Formatted Total Time`")


dbPTR.execute(
	"""
	CREATE TABLE playlist_songs
	(
		playlist VARCHAR(100),
		index_in_playlist SMALLINT UNSIGNED,
		file_name VARCHAR(200) NOT NULL,
		PRIMARY KEY (playlist, index_in_playlist),
		FOREIGN KEY (file_name) REFERENCES songs(file_name) ON DELETE CASCADE,
		FOREIGN KEY (playlist) REFERENCES playlist_metadata(playlist) ON DELETE CASCADE
	)
	"""
)


db.autocommit = False

# -=-=-=-=-=-=-=-=-=-= Add all playlist songs to the official playlist_songs table =-=-=-=-=-=-=-=-=-=-
dbPTR.execute("""SELECT playlist FROM playlist_metadata WHERE playlist != 'Last Added'""")
playlists = dbPTR.fetchall()


for playlist in playlists:
	# playlist will be something like (`test`,)
	playlist = playlist[0]

	dbPTR.execute("""SELECT `File Name`, `Song Index` FROM `%s`""" %playlist)
	results = dbPTR.fetchall()

	for result in results:
		file_name, index = result
		dbPTR.execute("""INSERT INTO playlist_songs (playlist, index_in_playlist, file_name) VALUES (%s,%s,%s)""", (playlist, index, file_name))
# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-



# -=-=-=-=-=-=-=-=-=-= Erase all old & uneeded tables =-=-=-=-=-=-=-=-=-=-
dbPTR.execute("SELECT table_name FROM information_schema.tables WHERE table_schema=%s", (backend_env.DB_NAME,))
tables = dbPTR.fetchall()

for table in tables:
	# table will be something like (`test`,)
	table = table[0]
	if(table not in ('playlist_metadata', 'playlist_songs', 'songs')):
		dbPTR.execute("DROP TABLE `%s`" %table)

# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


# Finally, commit
db.commit()