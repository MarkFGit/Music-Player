# This module includes any classes/functions which directly access/modify any playlist OR
# any class/function which is only used by playlist methods

from flask import Blueprint, request, render_template, abort, jsonify
from markupsafe import escape
from datetime import datetime
from tinytag import TinyTag
import os


# Imports from local scripts -------------------------------------------------
from g import get_db_conn, get_db_cursor, format_date, DataBaseDataIntegrityError, NoneException
import song
# ----------------------------------------------------------------------------


playlist_routes = Blueprint("playlist_routes", __name__, static_folder="static")


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
			file_name, 
			title, 
			duration_seconds,
			artist, 
			album, 
			plays,
			has_cover_image,
			datetime_created
			FROM songs ORDER BY datetime_created DESC"""
		)

		all_song_infos = db_ptr.fetchall()
		song_object_list = [jsonify(song.LastAddedPlaylistSong(song_info)).get_json() for song_info in all_song_infos]

	else:
		db_ptr.execute(
			"""SELECT
			songs.file_name,
			songs.title,
			songs.duration_seconds,
			songs.artist,
			songs.album,
			songs.plays,
			songs.has_cover_image,
			playlist_songs.index_in_playlist
			FROM playlist_songs LEFT OUTER JOIN songs ON playlist_songs.file_name = songs.file_name
			WHERE playlist_songs.playlist = %s
			ORDER BY playlist_songs.index_in_playlist ASC""", (playlist,)
		)

		all_song_infos = db_ptr.fetchall()

		song_object_list = [jsonify(song.CustomPlaylistSong(song_info)).get_json() for song_info in all_song_infos]

	db_ptr.execute("SELECT datetime_created FROM playlist_metadata WHERE playlist = %s", (playlist,))

	results = db_ptr.fetchall()[0]
	playlist_create_date = format_date(results[0])

	return render_template(
		"playlist.html", 
		playlistName = playlist,
		playlistCreateDate = playlist_create_date,
		numOfSongs = len(song_object_list), 
		songObjectList = song_object_list
	)


@playlist_routes.route("/addPlaylist", methods=["POST"])
def create_playlist() -> str:
	playlist_name = request.data.decode("utf-8")

	db_ptr = get_db_cursor()
 
	db_ptr.execute("INSERT INTO playlist_metadata (playlist, datetime_created) VALUES (%s,%s)", (playlist_name, datetime.now()))

	db = get_db_conn()
	db.commit()
	
	return "OK"


@playlist_routes.route("/deletePlaylist", methods=["POST"])
def delete_playlist() -> str:
	playlist_name = request.data.decode("utf-8")

	if(playlist_name.lower() == "last added"):
		raise Exception("ERROR: Cannot drop Last Added playlist")

	db_ptr = get_db_cursor()

	db_ptr.execute("DELETE FROM playlist_metadata WHERE playlist = %s", (playlist_name,))

	db = get_db_conn()
	db.commit()
	return "OK"


def does_playlist_exist(playlist_name: str) -> bool:
	db_ptr = get_db_cursor()
	print(playlist_name)
	db_ptr.execute("SELECT 1 FROM playlist_metadata WHERE playlist = %s", (playlist_name,))

	if(len(db_ptr.fetchall()) == 0):
		return False
	return True


@playlist_routes.route("/insertNewSong", methods=["POST"])
def insert_song_into_custom_playlist() -> str:
	playlist_name = request.form.to_dict()["playlistName"]
	file_name = request.form.to_dict()["fileName"]

	db_ptr = get_db_cursor()

	db_ptr.execute("SELECT MAX(index_in_playlist) FROM playlist_songs WHERE playlist=%s", (playlist_name,))
	result = db_ptr.fetchone()
	# Checking this only because the LSP complains about it, even though SELECT MAX() will always return either (None,) or (<number>,)
	if(result == None): 
		raise Exception("Somehow the result of a MAX() is None, beware!!!")
	
	max_index = result[0]
	if(max_index == None): # If it's the first song that's being added to the playlist
		db_ptr.execute("""
			INSERT INTO playlist_songs 
			(playlist, index_in_playlist, file_name) 
			VALUES (%s,%s,%s)""", 
			(playlist_name, 0, file_name)
		)
	else:
		# Using max_index + 1 in lieu of auto increment, because auto
		#   increment doesn't work inside a combined key of (playlist, index_in_playlist)
		# This actually shouldn't have any race condition issues, because index_in_playlist is part of the primary key
		db_ptr.execute("""
			INSERT INTO playlist_songs 
			(playlist, index_in_playlist, file_name) 
			VALUES (%s,%s,%s)""", 
			(playlist_name, max_index + 1, file_name)
		)

	db = get_db_conn()
	db.commit()

	return "OK"

@playlist_routes.route("/removeSong", methods=["POST"])
def remove_song_from_playlist() -> str:
	index_in_playlist = request.form.to_dict()["indexInPlaylist"]
	playlist_name = request.form.to_dict()["playlistName"]

	db_ptr = get_db_cursor()
	db_ptr.execute("DELETE FROM playlist_songs WHERE playlist = %s and index_in_playlist = %s", (playlist_name, index_in_playlist))
	
	get_db_conn().commit()

	if(db_ptr.rowcount == 0):
		raise DataBaseDataIntegrityError(
			f"Attempted to remove a song at an index which does not exist. Requested song index remove is {index_in_playlist}"
		)

	return "OK"



# I think this should be moved to songs.py
@playlist_routes.route("/uploadSongFile", methods=["POST"])
def add_song_to_DB() -> str:
	"""
	This function is only invoked when a new song is uploaded to the database.
	This function handles the upload of the song.
	"""
	song_file = request.files["file"]
	song_name = song_file.filename

	if(song_name is None):
		raise NoneException()

	song_folder = os.path.join(playlist_routes.root_path, "static/media/songs")
	song_file.save(f"{song_folder}/{song_name}")

	song_data: TinyTag = TinyTag.get(f"{song_folder}/{song_name}", image=True)
	cover_image_data = song_data.get_image()

	has_cover_image = False
	if(cover_image_data is not None):
		has_cover_image = song.save_cover_img_to_file_system(song_name, cover_image_data)

	db_ptr = get_db_cursor()
	db_ptr.execute(
		"""INSERT INTO songs
		(
			file_name, 
			title, 
			artist, 
			album,
			datetime_created, 
			plays,
			duration_seconds,
			has_cover_image
		) 
		VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""", 
		(song_name, song_data.title, song_data.artist, song_data.album, datetime.now(), 0, song_data.duration, has_cover_image)
	)
	db = get_db_conn() 
	db.commit()

	return "OK"



@playlist_routes.route("/getPlaylists", methods=["POST"])
def get_playlist_names_from_DB() -> dict[str, list[str]]:
	db_ptr = get_db_cursor()

	db_ptr.execute("SELECT playlist FROM playlist_metadata")

	playlist_names: list[str] = [playlist_name[0] for playlist_name in db_ptr.fetchall()]

	return {"PlaylistNames": playlist_names}