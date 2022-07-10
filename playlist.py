# This module includes any classes/functions which directly access/modify any playlist OR
# any class/function which is only used by playlist methods

from flask import Blueprint, request, render_template, abort, jsonify
from markupsafe import escape
from datetime import datetime
from tinytag import TinyTag
import os


# Imports from local scripts -------------------------------------------------
from g import get_db_conn, get_db_cursor, format_date, format_duration_text, DataBaseDataIntegrityError, NoneException
import song
# ----------------------------------------------------------------------------


playlist_routes = Blueprint("playlist_routes", __name__, static_folder="static")


class BadPlaylistNameError(Exception):
	""" Raised when a playlist name which does not exist is used. """
	pass

class NegativePlaylistTimeError(Exception):
	""" Raised if playlist time is negative after decrementing playlist time. """
	pass


@playlist_routes.route("/playlists/<playlist>")
def playlist_page_load(playlist: str) -> str:
	""" Retrieves all songs from a particular playlist, sorts it, grabs additional info and sends it all to client. """
	playlist = str(escape(playlist))

	if(not does_playlist_exist(playlist)):
		abort(404) # This will render the 'not found' page

	db_ptr = get_db_cursor()
	is_last_added_playlist = (request.path == "/playlists/Last Added")
	if(is_last_added_playlist):
		db_ptr.execute(
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

		all_song_infos = db_ptr.fetchall()
		song_object_list = [jsonify(song.LastAddedPlaylistSong(song_info)).get_json() for song_info in all_song_infos]

	else:
		db_ptr.execute(
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

		all_song_infos = db_ptr.fetchall()
		song_object_list = [jsonify(song.CustomPlaylistSong(song_info)).get_json() for song_info in all_song_infos]

	db_ptr.execute(
		"""
		SELECT 
		`Date Created`, 
		`Formatted Total Time`
		FROM `Playlist Metadata` 
		WHERE `Table Name` = %s
		""", (playlist,)
	)

	results = db_ptr.fetchall()[0]
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


@playlist_routes.route("/addPlaylist", methods=["POST"])
def create_playlist() -> str:
	playlist_name = request.data.decode("utf-8")
	playlist_names = get_playlist_names_from_DB()["PlaylistNames"]

	if(playlist_name in playlist_names):
		raise BadPlaylistNameError(f"ERROR: Playlist name `{playlist_name}` already exists")
	if(len(playlist_name) > 100):
		raise BadPlaylistNameError(f"ERROR: Playlist name `{playlist_name}` cannot exceed 100 characters")

	db_ptr = get_db_cursor()
 
	db_ptr.execute(
		"""CREATE TABLE `%s` (`File Name` VARCHAR(100) NOT NULL, 
		`Song Index` smallint UNSIGNED AUTO_INCREMENT KEY)""" %playlist_name
	)

	db_ptr.execute(
		"""
		INSERT INTO `Playlist Metadata` 
		(`Table Name`, `Actual Playlist Name`, `Date Created`, `Total Seconds`, `Formatted Total Time`) 
		VALUES (%s, %s, %s, %s, %s)
		""", (playlist_name.lower(), playlist_name, datetime.now(), 0, "00:00:00")
	)

	db = get_db_conn()
	db.commit()
	
	return "OK"


@playlist_routes.route("/deletePlaylist", methods=["POST"])
def delete_playlist() -> str:
	playlist_name = request.data.decode("utf-8")

	if(playlist_name.lower() == "last added"):
		raise BadPlaylistNameError("ERROR: Cannot drop Last Added playlist")

	db_ptr = get_db_cursor()
	db_ptr.execute("""DROP TABLE `%s`""" %playlist_name)

	db_ptr.execute(
		"DELETE FROM `Playlist Metadata` WHERE `Table Name` = %s", (playlist_name,)
	)

	db = get_db_conn()
	db.commit()
	return "OK"


def does_playlist_exist(playlist_name: str) -> bool:
	db_ptr = get_db_cursor()
	db_ptr.execute(
		"SELECT 1 FROM `Playlist Metadata` WHERE `Actual Playlist Name` = %s", (playlist_name,)
	)

	if(len(db_ptr.fetchall()) == 0):
		return False
	return True


@playlist_routes.route("/insertNewSong", methods=["POST"])
def insert_song_into_custom_playlist() -> str:
	playlist_name = request.form.to_dict()["playlistName"]
	if(not does_playlist_exist(playlist_name)):
		raise BadPlaylistNameError(
			f"Tried to add song to a playlist which doesn't exist. Given playlist name: {playlist_name}"
		)

	file_name = request.form.to_dict()["fileName"]
	db_ptr = get_db_cursor()
	db_ptr.execute(f"INSERT INTO `{playlist_name}` (`File Name`) VALUES (%s)", (file_name,))
	
	change_playlist_time_metadata(song.get_time_of_song(file_name), playlist_name)
	db = get_db_conn()
	db.commit()

	return "OK"

@playlist_routes.route("/removeSong", methods=["POST"])
def remove_song_from_playlist() -> str:
	song_index = request.form.to_dict()["songPlaylistIndex"]
	playlist_name = request.form.to_dict()["playlistName"]

	db_ptr = get_db_cursor()
	db_ptr.execute(f"SELECT `File Name` FROM `{playlist_name}` WHERE `Song Index` = %s", (song_index,))
	results = db_ptr.fetchall()
	if(len(results) == 0):
		raise DataBaseDataIntegrityError(
			f"Attempted to remove a song at an index which does not exist. Requested song index remove is {song_index}"
		)

	file_name = results[0][0]
	song_time = song.get_time_of_song(file_name)
	change_playlist_time_metadata(-song_time, playlist_name)

	db_ptr.execute(f"DELETE FROM `{playlist_name}` WHERE `Song Index` = %s", (song_index,))

	db = get_db_conn()
	db.commit()

	return "OK"



@playlist_routes.route("/uploadSongFile", methods=["POST"])
def add_song_to_last_added_playlist() -> str:
	"""
	This function is only invoked when a new song is uploaded to the database.
	This function handles the upload of the song.
	"""
	song_file = request.files["file"]
	song_name = song_file.filename

	if(song_name is None):
		raise NoneException()

	song_file.save(f"static/media/songs/{song_name}")

	song_folder = os.path.join(playlist_routes.root_path, "static/media/songs")
	song_data: TinyTag = TinyTag.get(f"{song_folder}/{song_name}", image=True)
	insert_song_entry_in_DB(song_name, song_data)

	cover_image_data = song_data.get_image()
	if(cover_image_data is not None):
		song.save_cover_img_to_file_system(song_name, cover_image_data)

	return "OK"



def insert_song_entry_in_DB(song_name: str, song_data: TinyTag) -> None:
	song_title = song.get_title(song_data.title, song_name)

	if(song_data.duration is None):
		raise NoneException()

	formatted_duration = format_duration_text(song_data.duration)

	db_ptr = get_db_cursor()
	db_ptr.execute(
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
	db = get_db_conn() 
	db.commit()

	change_playlist_time_metadata(song_data.duration, "last added")


@playlist_routes.route("/deleteSong", methods=["POST"])
def delete_song_from_DB() -> str:
	song_file_name = request.form.to_dict()["songFileName"]

	db_ptr = get_db_cursor()
	db_ptr.execute("SELECT 1 FROM `Last Added` WHERE `File Name` = %s", (song_file_name,))
	results = db_ptr.fetchall()
	if(len(results) == 0):
		raise DataBaseDataIntegrityError(
			f"Attempted to delete a song which does not exist. Requested song deletion is {song_file_name}"
		)


	song_time = song.get_time_of_song(song_file_name)

	db = get_db_conn()
	playlist_names = get_playlist_names_from_DB()["PlaylistNames"]
	for playlist in playlist_names:
		db_ptr.execute(f"DELETE FROM `{playlist}` WHERE `File Name` = %s", (song_file_name,))
		db.commit()

		num_of_deleted_songs = db_ptr.rowcount
		if(num_of_deleted_songs > 0):
			playlist_decrement_time = num_of_deleted_songs * song_time
			change_playlist_time_metadata(-playlist_decrement_time, playlist)

	song_name = request.form.to_dict()["songName"]
	song.delete_associated_song_files(song_file_name, song_name)

	return "OK"


@playlist_routes.route("/getPlaylists", methods=["POST"])
def get_playlist_names_from_DB() -> dict[str, list[str]]:
	db_ptr = get_db_cursor()

	db_ptr.execute("SELECT `Actual Playlist Name` FROM `Playlist Metadata`")

	playlist_names: list[str] = [playlist_name[0] for playlist_name in db_ptr.fetchall()]

	return {"PlaylistNames": playlist_names}


def change_playlist_time_metadata(song_time: float, playlist_name: str) -> None:
	song_time = round(song_time)

	db_ptr = get_db_cursor()
	db_ptr.execute(
		"SELECT `Total Seconds` FROM `Playlist Metadata` WHERE `Table Name` = %s", (playlist_name,)
	)
	total_time: int = db_ptr.fetchall()[0][0]
	
	total_time += song_time
	if(total_time < 0):
		raise NegativePlaylistTimeError(
			f"ERROR: total playlist time for playlist `{playlist_name}` is now {total_time}.",
			" This value should not have become negative, but it is."
		)

	duration_text = format_duration_text(total_time)

	db_ptr.execute(
		"""
		UPDATE `Playlist Metadata` 
		SET `Total Seconds` = %s, `Formatted Total Time` = %s 
		WHERE `Table Name` = %s
		""", (total_time, duration_text, playlist_name)
	)

	db = get_db_conn() 
	db.commit()


@playlist_routes.route("/getPlaylistTime", methods=["POST"])
def get_formatted_playlist_time() -> dict[str, str]:
	db_ptr = get_db_cursor()

	table_name = request.data.decode("utf-8")
	db_ptr.execute(
		"SELECT `Formatted Total Time` FROM `Playlist Metadata` WHERE `Table Name` = %s", (table_name,)
	)

	return {"totalTime": db_ptr.fetchall()[0]}

