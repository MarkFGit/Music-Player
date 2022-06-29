# This file is responsible for the communication between the Filesystem/Database and the client web page
# So far this is only inteded for local use, since SQL injection is possible with some of the statements
	# This will be fixed later.


from click import DateTime
from flask import Flask, render_template, send_from_directory, request, abort, jsonify
from flask.json import jsonify
from markupsafe import escape
import mysql
from tinytag import TinyTag
from PIL import Image, UnidentifiedImageError
from io import BytesIO
from datetime import datetime
from dataclasses import dataclass
from abc import ABC
import mysql.connector
import jsonpickle
import os


# Imports used to type variables ---------------------------------------------
from flask.wrappers import Response

from mysql.connector import MySQLConnection
from mysql.connector.cursor import MySQLCursor
from werkzeug.datastructures import FileStorage
# ----------------------------------------------------------------------------


app = Flask(__name__, template_folder="html", static_folder="static")

class BadPlaylistNameError(Exception):
	""" Raised when a playlist name which does not exist is used. """
	pass

class NegativePlaylistTimeError(Exception):
	""" Raised if playlist time is negative after decrementing playlist time. """
	pass

class DataBaseDataIntegrityError(Exception):
	"""
	Raised when selecting from a table returns zero results when it should return 1 or more results.
	i.e. a violation of data integrity 
	"""
	pass


class NoneException(Exception):
	""" Raised when data sent from the client is None when it shouldn't be. """
	pass




@dataclass
class Song(ABC):
	"""Generic class used for specific song types to derive from"""

	fileName: str
	title: str
	duration: str
	artist: str
	album: str
	plays: int

	def __init__(self, songInfo):
		self.fileName = songInfo[0]
		self.title = songInfo[1]
		self.duration = songInfo[2]
		self.artist = songInfo[3]
		self.album = songInfo[4]
		self.plays = songInfo[5]


@dataclass
class LastAddedPlaylistSong(Song):
	"""Stores info for any song rendered in the `Last Added` playlist."""

	date: str
	def __init__(self, songInfo):
		Song.__init__(self, songInfo)
		self.date = format_date(songInfo[6])


@dataclass
class CustomPlaylistSong(Song):
	"""Stores info for any song rendered in a playlist which isn't `Last Added` """

	index: int
	def __init__(self, songInfo):
		Song.__init__(self, songInfo)
		self.index = songInfo[6]


@app.route("/playlists/<playlist>", methods=["GET"])
def send_playlist_info_to_client(playlist: str) -> str:
	playlist = str(escape(playlist))

	if(not does_playlist_exist(playlist)):
		abort(404) # This will render the 'not found' page

	is_last_added_playlist = (request.path == "/playlists/Last Added")
	if(is_last_added_playlist):
		DB_PTR.execute(
			"""SELECT 
			`File Name`, 
			Title, 
			`Formatted Song Time`, 
			Artist, 
			Album, 
			Plays, 
			`Date Created`
			FROM `Last Added` ORDER BY `Date Created` DESC"""
		)

		all_song_infos = DB_PTR.fetchall()
		song_object_list = [jsonify(LastAddedPlaylistSong(song_info)).get_json() for song_info in all_song_infos]

	else:
		DB_PTR.execute(
			"""SELECT
			la_pl.`File Name`,
			la_pl.Title,
			la_pl.`Formatted Song Time`,
			la_pl.Artist,
			la_pl.Album,
			la_pl.Plays,
			custom_pl.`Song Index`
			FROM `%s` AS custom_pl LEFT OUTER JOIN `Last Added` AS la_pl ON custom_pl.`File Name` = la_pl.`File Name`
			ORDER BY custom_pl.`Song Index` ASC""" %playlist
		)

		all_song_infos = DB_PTR.fetchall()
		song_object_list = [jsonify(CustomPlaylistSong(song_info)).get_json() for song_info in all_song_infos]

	DB_PTR.execute(
		"""
		SELECT 
		`Date Created`, 
		`Formatted Total Time`
		FROM `Playlist Metadata` 
		WHERE `Table Name` = %s
		""", (playlist,)
	)

	results = DB_PTR.fetchall()[0]
	playlist_create_date = format_date(results[0])
	formatted_total_time = results[1]

	return render_template(
		"index.html", 
		playlistName = playlist,
		playlistCreateDate = playlist_create_date,
		formattedTotalTime = formatted_total_time,
		numOfSongs = len(song_object_list), 
		songObjectList = song_object_list
	)



def format_date(song_date: datetime) -> str:
	date_str = str(song_date.date())
	year_month_day = date_str.split("-")
	concat_year = year_month_day[0][2:] # Take last 2 digits of year. Ex: Turn 2022 into 22
	month = year_month_day[1]
	if(month[0] == "0"): # Ex: turn January (which is "01") into just "1"
		month = month[1]
	day = year_month_day[2]
	if(day[0] == "0"): # Ex: turn the 9th (which is "09") into just "9"
		day = day[1]

	return f"{month}/{day}/{concat_year}"


def get_title(song_title: str | None, song_name: str) -> str:
	if(song_title is not None):
		return song_title
	return remove_file_extension(song_name)


def format_song_duration_text(song_duration: int) -> str:
	"""Takes a duration of song in seconds and returns that in **:**:** or **:** format"""

	hours = int(song_duration / 3600)
	remaining_time = song_duration - (hours * 3600)
	minutes = int(remaining_time / 60)
	seconds = int(remaining_time % 60)

	if(seconds < 10):
		seconds = f"0{seconds}"
	if(hours == 0):
		return f"{minutes}:{seconds}"

	if(minutes < 10):
		minutes = f"0{minutes}"
	return f"{hours}:{minutes}:{seconds}"


def remove_file_extension(file_name: str) -> str:
	file_extension_dot_pos = file_name.rindex(".")
	return file_name[:file_extension_dot_pos]


@app.route("/uploadSongFile", methods=["POST"])
def upload_new_file() -> str:
	song_file = request.files["file"]
	song_name = song_file.filename

	if(song_name is None):
		raise NoneException()

	song_file.save(f"static/media/songs/{song_name}")

	song_folder = os.path.join(app.root_path, "static/media/songs")
	song_data: TinyTag = TinyTag.get(f"{song_folder}/{song_name}", image=True)
	insert_song_entry_in_DB(song_name, song_data)

	cover_image_data = song_data.get_image()
	if(cover_image_data is not None):
		save_cover_img_to_file_system(song_name, cover_image_data)

	return "OK"


def save_cover_img_to_file_system(file_name: str, cover_image_data: bytes) -> None:
	cover_path_folder = os.path.join(app.root_path, "static/media/songCovers")
	song_cover_name = f"{remove_file_extension(file_name)}.jpeg"
	song_cover_path = f"{cover_path_folder}/{song_cover_name}"

	try:
		coverBytes = Image.open(BytesIO(cover_image_data))
		coverBytes.save(f"{cover_path_folder}/{song_cover_name}")
	except UnidentifiedImageError:
		print(
			f"""
			An UnidentifiedImageError has occurred (probably while trying to open cover_image_data). 
			Proceeding as if image data does not exist.
			Offending song file name: {file_name}
			"""
		)

def insert_song_entry_in_DB(song_name: str, song_data: TinyTag) -> None:
	song_title = get_title(song_data.title, song_name)

	if(song_data.duration is None):
		raise NoneException()

	formatted_duration = format_song_duration_text(song_data.duration)

	DB_PTR.execute(
		"""INSERT INTO `last added` 
		(
			`File Name`, 
			Title, 
			`Formatted Song Time`, 
			Artist, 
			Album, 
			`Date Created`, 
			Plays, 
			`Song Time Seconds`
		) 
		VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""", 
		(song_name, song_title, formatted_duration, song_data.artist, song_data.album, datetime.now(), 0, song_data.duration)
	)
	DB.commit()

	change_playlist_time_metadata(song_data.duration, "last added", True)


def change_playlist_time_metadata(song_time: float, playlist_name: str, isIncrement: bool) -> None:
	song_time = round(song_time)

	DB_PTR.execute(
		"SELECT `Total Seconds` FROM `Playlist Metadata` WHERE `Table Name` = %s", (playlist_name,)
	)
	total_time: int = DB_PTR.fetchall()[0][0]
	
	if(isIncrement):
		total_time += song_time
	else:
		total_time -= song_time
		if(total_time < 0):
			raise NegativePlaylistTimeError(
				f"ERROR: total playlist time is now {total_time}. This value should not have become negative, but it is."
			)

	duration_text = format_song_duration_text(total_time)

	DB_PTR.execute(
		"""
		UPDATE `Playlist Metadata` 
		SET `Total Seconds` = %s, `Formatted Total Time` = %s 
		WHERE `Table Name` = %s
		""", (total_time, duration_text, playlist_name)
	)

	DB.commit()



@app.route("/updateSongInfo", methods=["POST"])
def update_song_info_from_user_edit() -> str:
	song_file_name = request.form.to_dict()["songFileName"]

	new_img_file = request.files.to_dict().get("newSongImg")
	if(new_img_file is not None):
		save_cover_img_to_file_system(song_file_name, new_img_file.stream.read())

	new_info: dict[str, DateTime | str] = jsonpickle.decode(request.form.to_dict()["newInfo"])
	if(new_info["newDate"] != ""):
		DB_PTR.execute(
			"UPDATE `Last Added` SET `Date Created` = %s WHERE `File Name` = %s", (new_info["newDate"], song_file_name)
		)
		DB.commit()


	DB_PTR.execute(
		"""
		UPDATE `Last Added` 
		SET Title = %s, Artist = %s, Album = %s 
		WHERE `File Name` = %s
		""", (new_info["newTitle"], new_info["newArtist"], new_info["newAlbum"], song_file_name)
	)
	DB.commit()

	return "OK"

	


@app.route("/getSongInfo", methods=["POST"])
def get_song_obj_info() -> dict:
	song_file_name = request.data.decode("utf-8")

	DB_PTR.execute(
		"""SELECT 
		`File Name`, 
		Title, 
		`Formatted Song Time`,
		Artist, 
		Album, 
		Plays, 
		`Date Created`
		FROM `Last Added` WHERE `File Name` = %s""", (song_file_name,)
	)

	song_info = DB_PTR.fetchall()[0]
	song_obj = jsonify(LastAddedPlaylistSong(*song_info)).get_json()

	return {"songObj": song_obj}



@app.route("/insertNewSong", methods=["POST"])
def insert_song_into_custom_playlist() -> str:
	playlist_name = request.form.to_dict()["playlistName"]
	if(not does_playlist_exist(playlist_name)):
		raise BadPlaylistNameError(f"ERROR: Bad playlist name. Given playlist name: {playlist_name}")

	file_name = request.form.to_dict()["fileName"]
	DB_PTR.execute(f"INSERT INTO `{playlist_name}` (`File Name`) VALUES (%s)", (file_name,))
	
	change_playlist_time_metadata(get_time_of_song(file_name), playlist_name, True)
	DB.commit()

	return "OK"


def does_playlist_exist(playlist_name: str) -> bool:
	DB_PTR.execute(
		"SELECT 1 FROM `Playlist Metadata` WHERE `Actual Playlist Name` = %s", (playlist_name,)
	)

	if(len(DB_PTR.fetchall()) == 0):
		return False
	return True


def get_time_of_song(file_name: str) -> int:
	DB_PTR.execute("SELECT `Song Time Seconds` FROM `Last Added` WHERE `File Name` = %s", (file_name,))
	return DB_PTR.fetchall()[0][0]


@app.route("/removeSong", methods=["POST"])
def remove_song_from_playlist() -> str:
	song_index = request.form.to_dict()["songPlaylistIndex"]
	playlist_name = request.form.to_dict()["playlistName"]

	DB_PTR.execute(f"SELECT `File Name` FROM `{playlist_name}` WHERE `Song Index` = %s", (song_index,))
	results = DB_PTR.fetchall()
	if(len(results) == 0):
		raise DataBaseDataIntegrityError(
			f"Attempted to remove a song at an index which does not exist. Requested song index remove is {song_index}"
		)

	file_name = results[0][0]
	song_time = get_time_of_song(file_name)
	change_playlist_time_metadata(song_time, playlist_name, False)

	DB_PTR.execute(f"DELETE FROM `{playlist_name}` WHERE `Song Index` = %s", (song_index,))
	DB.commit()

	return "OK"


@app.route("/deleteSong", methods=["POST"])
def delete_song_from_DB() -> str:
	song_file_name = request.form.to_dict()["songFileName"]
	DB_PTR.execute("SELECT 1 FROM `Last Added` WHERE `File Name` = %s", (song_file_name,))
	results = DB_PTR.fetchall()
	if(len(results) == 0):
		raise DataBaseDataIntegrityError(
			f"Attempted to delete a song which does not exist. Requested song deletion is {song_file_name}"
		)


	song_time = get_time_of_song(song_file_name)


	playlist_names = get_playlist_names_from_DB()["PlaylistNames"]
	for playlist in playlist_names:
		DB_PTR.execute(f"DELETE FROM `{playlist}` WHERE `File Name` = %s", (song_file_name,))
		DB.commit()

		num_of_deleted_songs = DB_PTR.rowcount
		if(num_of_deleted_songs > 0):
			playlist_decrement_time = num_of_deleted_songs * song_time
			change_playlist_time_metadata(playlist_decrement_time, playlist, False)

	song_name = request.form.to_dict()["songName"]
	delete_associated_song_files(song_file_name, song_name)

	return "OK"


def delete_associated_song_files(song_file_name: str, song_name: str) -> None:
	song_file_path = f"./static/media/songs/{song_file_name}"
	song_cover_file_path = f"./static/media/songCovers/{song_name}.jpeg"

	assert(os.path.exists(song_file_path))
	os.remove(song_file_path)

	if(os.path.exists(song_cover_file_path)):
		os.remove(song_cover_file_path)



@app.route("/addPlaylist", methods=["POST"])
def create_playlist() -> str:
	playlist_name = request.data.decode("utf-8")
	playlist_names = get_playlist_names_from_DB()["PlaylistNames"]

	if(playlist_name in playlist_names):
		raise BadPlaylistNameError(f"ERROR: Playlist name `{playlist_name}` already exists")
	if(len(playlist_name) > 100):
		raise BadPlaylistNameError(f"ERROR: Playlist name `{playlist_name}` cannot exceed 100 characters")
 
	DB_PTR.execute(
		"""CREATE TABLE `%s` (`File Name` VARCHAR(100) NOT NULL, 
		`Song Index` smallint UNSIGNED AUTO_INCREMENT KEY)""" %playlist_name
	)

	DB_PTR.execute(
		"""
		INSERT INTO `Playlist Metadata` 
		(`Table Name`, `Actual Playlist Name`, `Date Created`, `Total Seconds`, `Formatted Total Time`) 
		VALUES (%s, %s, %s, %s, %s)
		""", (playlist_name.lower(), playlist_name, datetime.now(), 0, "00:00:00")
	)
	DB.commit()
	
	return "OK"


@app.route("/deletePlaylist", methods=["POST"])
def delete_playlist() -> str:
	playlist_name = request.data.decode("utf-8")

	if(playlist_name.lower() == "last added"):
		raise BadPlaylistNameError("ERROR: Cannot drop Last Added playlist")

	DB_PTR.execute("""DROP TABLE `%s`""" %playlist_name)

	DB_PTR.execute(
		"DELETE FROM `Playlist Metadata` WHERE `Table Name` = %s", (playlist_name,)
	)

	DB.commit()

	return "OK"



@app.route("/updatePlays", methods=["POST"])
def increment_plays_count() -> str:
	song_name =  request.data.decode("utf-8")

	DB_PTR.execute("SELECT Plays FROM `last added` WHERE `File Name` = %s", (song_name,)) 
	new_play_value = DB_PTR.fetchall()[0][0] + 1
	DB_PTR.execute(
		"UPDATE `last added` SET Plays = %s WHERE `File Name` = %s", (new_play_value, song_name)
	)

	DB.commit()

	return "OK"	


@app.route("/getPlaylists", methods=["POST"])
def get_playlist_names_from_DB() -> dict[str, list[str]]:
	DB_PTR.execute("SELECT `Actual Playlist Name` FROM `Playlist Metadata`")

	playlist_names: list[str] = [playlist_name[0] for playlist_name in DB_PTR.fetchall()]

	return {"PlaylistNames": playlist_names}


@app.route("/getPlaylistTime", methods=["POST"])
def get_formatted_playlist_time() -> dict[str, str]:
	table_name = request.data.decode("utf-8")
	DB_PTR.execute(
		"SELECT `Formatted Total Time` FROM `Playlist Metadata` WHERE `Table Name` = %s", (table_name,)
	)

	return {"totalTime": DB_PTR.fetchall()[0]}


@app.route("/findImage", methods=["POST"])
def find_image_on_server() -> dict:
	song_cover_name = request.data.decode("utf-8")
	song_cover_path = f"./static/media/songCovers/{song_cover_name}"

	if(os.path.exists(song_cover_path)):
		return {"imageFound": True, "lastModTime": os.path.getmtime(song_cover_path)}
	return {"imageFound": False}



@app.route("/favicon.ico")
def favicon() -> Response:
    return send_from_directory(
    	os.path.join(app.root_path, "static"), 
    	"media/icons/favicon.ico", 
    	mimetype="image/vnd.microsoft.icon"
    )


@app.route("/home/")
def home() -> str:
	return render_template("home.html")


@app.errorhandler(404)
def render_not_found_page(_) -> str:
	return render_template("notFound.html")


def create_initial_tables() -> None:
	# Varchar 9 allows for **:**:** (H:M:S)

	DB_PTR.execute(
		"""
		CREATE TABLE `Last Added` 
		(
			`File Name` VARCHAR(200) PRIMARY KEY NOT NULL, 
			Title VARCHAR(100), 
			`Formatted Song Time` VARCHAR(9), 
			`Song Time Seconds` smallint UNSIGNED,  
			Artist VARCHAR(100), 
			Album VARCHAR(50), 
			`Date Created` datetime, 
			plays smallint UNSIGNED
		)
		"""
	)

	# this table exists due to table names not saving caps, actualPlaylistName will retain the caps
		# As well as storing other information about the playlists
	# MEDIUMINT - Max unsigned num can represent ~ 194 days in length
		# SMALLINT - Max unsigned num can represent ~ 18 hours. <-- too small
	DB_PTR.execute(
		"""CREATE TABLE `Playlist MetaData` 
		(
			`Table Name` VARCHAR(100) PRIMARY KEY NOT NULL, 
			`Actual Playlist Name` VARCHAR(100), 
			`Date Created` DATETIME, 
			`Total Seconds` mediumint UNSIGNED, 
			`Formatted Total Time` VARCHAR(12)
		)
		"""
	)
	

	DB_PTR.execute(
		"""INSERT INTO `Playlist MetaData` 
		(
			`Table Name`,
			`Actual Playlist Name`,
			`Date Created`,
			`Total Seconds`,
			`Formatted Total Time`
		) 
		VALUES (%s, %s, %s, %s, %s)""",
		("last added", "Last Added", datetime.now(), 0, "00:00:00")
	)

	DB.commit()
	return


if __name__ == "__main__":
	DB: MySQLConnection = mysql.connector.connect(
		host="localhost",
		user="root",
		passwd="database",
		database="testdb"
	)

	DB_PTR: MySQLCursor = DB.cursor(buffered=True)

	# Select all tables in testdb
	DB_PTR.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'testdb'") 
	if (len(DB_PTR.fetchall()) == 0):
		create_initial_tables()

	app.run(debug=True)


	# DB_PTR.execute("""ALTER TABLE `Playlist Metadata` RENAME COLUMN `Playlist Duration Seconds` TO `Total Seconds`""")