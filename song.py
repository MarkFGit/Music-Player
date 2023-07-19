# This module includes any classes/functions which only pertain to songs OR
# any class/function which is only used by song methods


from flask import request, jsonify, Blueprint
from dataclasses import dataclass
from abc import ABC
from PIL import Image, UnidentifiedImageError
from io import BytesIO
import os


# Imports from local scripts -------------------------------------------------
from g import get_db_conn, get_db_cursor, remove_file_extension, format_date, DataBaseDataIntegrityError
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
	hasCoverImage: bool

	def __init__(self, songInfo):
		self.fileName = songInfo[0]
		self.title = songInfo[1]
		self.duration = songInfo[2]
		self.artist = songInfo[3]
		self.album = songInfo[4]
		self.plays = songInfo[5]
		self.hasCoverImage = songInfo[6]


@dataclass
class LastAddedPlaylistSong(Song):
	"""Stores info for any song rendered in the `Last Added` playlist."""

	date: str
	def __init__(self, songInfo):
		Song.__init__(self, songInfo)
		self.date = format_date(songInfo[7])


@dataclass
class CustomPlaylistSong(Song):
	"""Stores info for any song rendered in a playlist which isn't `Last Added` """

	indexInPlaylist: int
	def __init__(self, songInfo):
		Song.__init__(self, songInfo)
		self.indexInPlaylist = songInfo[7]


def get_title(song_title: str | None, song_name: str) -> str:
	if(song_title is not None):
		return song_title
	return remove_file_extension(song_name)


@song_routes.route("/getSongInfo", methods=["POST"])
def get_song_obj_info() -> dict:
	""" Used to get the official song info of a song that has just been uploaded. """
	song_file_name = request.data.decode("utf-8")

	db_ptr = get_db_cursor()
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
		FROM songs WHERE file_name = %s""", (song_file_name,)
	)

	song_info = db_ptr.fetchone()
	song_obj = jsonify(LastAddedPlaylistSong(song_info)).get_json()

	return {"songObj": song_obj}


@song_routes.route("/updateSongInfo", methods=["POST"])
def update_song_info() -> str:
	song_file_name = request.form.to_dict()["songFileName"]
	new_value = request.form.to_dict()["newValue"]
	attribute = request.form.to_dict()["attribute"]

	db_ptr = get_db_cursor()
	db = get_db_conn()

	match attribute:
		case "album":
			db_ptr.execute("UPDATE songs SET album = %s WHERE file_name = %s", (new_value,	song_file_name))
		case "artist":
			db_ptr.execute("UPDATE songs SET artist = %s WHERE file_name = %s", (new_value, song_file_name))
		case "date":
			db_ptr.execute("UPDATE songs SET datetime_created = %s WHERE file_name = %s", (new_value, song_file_name))
		case "plays":
			db_ptr.execute("UPDATE songs SET plays = %s WHERE file_name = %s", (new_value,	song_file_name))
		case "title":
			db_ptr.execute("UPDATE songs SET title = %s WHERE file_name = %s", (new_value,	song_file_name))
		case _:
			raise Exception(f"Invalid attribute type, got attribute: {attribute}")

	db.commit()

	return "OK"


@song_routes.route("/updateSongImage", methods=["POST"])
def update_song_cover_img() -> str:
	song_file_name = request.form.to_dict()["songFileName"]
	new_img_file = request.files.to_dict()["newSongImage"]

	save_cover_img_to_file_system(song_file_name, new_img_file.stream.read())

	return "OK"


# Nuke this function once everything looks good...
@song_routes.route("/findImage", methods=["POST"])
def find_image_on_server() -> dict:
	song_cover_name = request.data.decode("utf-8")
	song_cover_path = os.path.join(song_routes.root_path, f"static/media/songCovers/{song_cover_name}")

	# NEED TO CREATE ANOTHER ATTRIBUTE ON songs TABLE FOR LAST MODIFIED TIME
	# Instead could add another attribute named something like: number_of_times_cover_image_modified (lol so long)
	# May NOT need this attribute, try testing the following:
		# Have song objects on the front end have this attr, initialized to 0
		# Have the image path be {image_path}?{number_of_times_cover_image_modified}
		# Test this: Does, upon page refresh, the image use the newest image or does it used the cached, out-of-date image?
	if(os.path.exists(song_cover_path)):
		return {"imageFound": True, "lastModTime": os.path.getmtime(song_cover_path)}
	return {"imageFound": False}


# Returns a bool, True means successful, False means unsuccessful
def save_cover_img_to_file_system(file_name: str, cover_image_data: bytes) -> bool:
	cover_path_folder = os.path.join(song_routes.root_path, "static/media/songCovers")
	song_cover_name = f"{remove_file_extension(file_name)}.jpeg"

	try:
		coverBytes = Image.open(BytesIO(cover_image_data))
		coverBytes.save(f"{cover_path_folder}/{song_cover_name}")
		return True
	except UnidentifiedImageError:
		print(
			f"""
			An UnidentifiedImageError has occurred (probably while trying to open cover_image_data). 
			\nProceeding as if image data does not exist. Offending song file name: {file_name}
			"""
		)

		return False


@song_routes.route("/deleteSong", methods=["POST"])
def delete_song_from_db() -> str:
	song_file_name = request.form.to_dict()["songFileName"]

	db_ptr = get_db_cursor()
	db_ptr.execute("DELETE FROM songs WHERE file_name = %s", (song_file_name,))
	if(db_ptr.rowcount == 0):
		raise DataBaseDataIntegrityError(
			f"Attempted to delete a song which does not exist. Song filename: {song_file_name}"
		)	

	song_name = remove_file_extension(song_file_name)

	song_file_path = f"./static/media/songs/{song_file_name}"
	song_cover_file_path = f"./static/media/songCovers/{song_name}.jpeg"

	if(not os.path.exists(song_file_path)):
		raise DataBaseDataIntegrityError(
			f"Attempted to delete a song's associated files that don't exist. Song filename: {song_file_name}"
		)

	os.remove(song_file_path)

	if(os.path.exists(song_cover_file_path)):
		os.remove(song_cover_file_path)

	db = get_db_conn()
	db.commit()

	return "OK"