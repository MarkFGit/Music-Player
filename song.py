# This module includes any classes/functions which only pertain to songs OR
# any class/function which is only used by song methods


from flask import request, jsonify, Blueprint
from dataclasses import dataclass
from abc import ABC
from PIL import Image, UnidentifiedImageError
from io import BytesIO
import jsonpickle
import os


# Imports used to type variables ---------------------------------------------
from datetime import datetime
# ----------------------------------------------------------------------------


# Imports from local scripts -------------------------------------------------
from g import get_db_conn, get_db_cursor, remove_file_extension, format_date, DataBaseDataIntegrityError, _db
# ----------------------------------------------------------------------------



song_routes = Blueprint("song_routes", __name__, static_folder="static")

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


def get_title(song_title: str | None, song_name: str) -> str:
	if(song_title is not None):
		return song_title
	return remove_file_extension(song_name)


def get_time_of_song(file_name: str) -> int:
	db_ptr = get_db_cursor()
	db_ptr.execute("SELECT `Song Time Seconds` FROM `Last Added` WHERE `File Name` = %s", (file_name,))
	results = db_ptr.fetchall()

	if(len(results) == 0):
		raise DataBaseDataIntegrityError(f"Song with file name: `{file_name}` was not present even though it should've been.")
	return results[0][0]


@song_routes.route("/getSongInfo", methods=["POST"])
def get_song_obj_info() -> dict:
	song_file_name = request.data.decode("utf-8")

	db_ptr = get_db_cursor()
	db_ptr.execute(
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

	song_info = db_ptr.fetchall()[0]
	song_obj = jsonify(LastAddedPlaylistSong(song_info)).get_json()

	return {"songObj": song_obj}


@song_routes.route("/updatePlays", methods=["POST"])
def increment_plays_count() -> str:
	song_name =  request.data.decode("utf-8")

	db_ptr = get_db_cursor()
	db_ptr.execute("SELECT Plays FROM `last added` WHERE `File Name` = %s", (song_name,)) 
	new_play_value = db_ptr.fetchall()[0][0] + 1
	db_ptr.execute(
		"UPDATE `last added` SET Plays = %s WHERE `File Name` = %s", (new_play_value, song_name)
	)

	db = get_db_conn()
	db.commit()

	return "OK"	


@song_routes.route("/updateSongInfo", methods=["POST"])
def update_song_info_from_user_edit() -> str:
	song_file_name = request.form.to_dict()["songFileName"]

	new_img_file = request.files.to_dict().get("newSongImg")
	if(new_img_file is not None):
		save_cover_img_to_file_system(song_file_name, new_img_file.stream.read())

	new_info: dict[str, datetime | str] = jsonpickle.decode(request.form.to_dict()["newInfo"])
	db_ptr = get_db_cursor()
	db = get_db_conn() 
	if(new_info["newDate"] != ""):
		db_ptr.execute(
			"UPDATE `Last Added` SET `Date Created` = %s WHERE `File Name` = %s", (new_info["newDate"], song_file_name)
		)
		db.commit()


	db_ptr.execute(
		"""
		UPDATE `Last Added` 
		SET Title = %s, Artist = %s, Album = %s 
		WHERE `File Name` = %s
		""", (new_info["newTitle"], new_info["newArtist"], new_info["newAlbum"], song_file_name)
	)
	db.commit()

	return "OK"	


@song_routes.route("/findImage", methods=["POST"])
def find_image_on_server() -> dict:
	song_cover_name = request.data.decode("utf-8")
	song_cover_path = f"./static/media/songCovers/{song_cover_name}"

	if(os.path.exists(song_cover_path)):
		return {"imageFound": True, "lastModTime": os.path.getmtime(song_cover_path)}
	return {"imageFound": False}


def save_cover_img_to_file_system(file_name: str, cover_image_data: bytes) -> None:
	cover_path_folder = os.path.join(song_routes.root_path, "static/media/songCovers")
	song_cover_name = f"{remove_file_extension(file_name)}.jpeg"

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


def delete_associated_song_files(song_file_name: str, song_name: str) -> None:
	song_file_path = f"./static/media/songs/{song_file_name}"
	song_cover_file_path = f"./static/media/songCovers/{song_name}.jpeg"

	if(not os.path.exists(song_file_path)):
		raise DataBaseDataIntegrityError(
			f"Tried to delete a song which doesn't exist. Song filename: {song_file_name}"
		)
	os.remove(song_file_path)

	if(os.path.exists(song_cover_file_path)):
		os.remove(song_cover_file_path)

