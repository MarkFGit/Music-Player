# This module includes any classes/functions which are generally accessed by other multiple modules
# This module serves to act as "globals"


import mysql.connector


# Imports used to type variables ---------------------------------------------
from mysql.connector import MySQLConnection
from mysql.connector.cursor import MySQLCursor

from datetime import datetime
# ----------------------------------------------------------------------------


class DataBaseDataIntegrityError(Exception):
	"""
	Raised when selecting from a table returns zero results when it should return 1 or more results.
	i.e. a violation of data integrity 
	"""
	pass


class NoneException(Exception):
	""" Raised when data sent from the client is None when it shouldn't be. """
	pass



# This global var should NEVER be imported
_db: MySQLConnection = mysql.connector.connect(
	host="localhost",
	user="root",
	passwd="database",
	database="testdb"
)


def get_db_conn() -> MySQLConnection:
	if(not _db.is_connected()):
		_db.reconnect(attempts=3, delay=1)

	return _db


def get_db_cursor() -> MySQLCursor:
    DB = get_db_conn()
    return DB.cursor()


def format_date(song_date: datetime) -> str:
	"""Takes in a date and returns it in mm/dd/YY format"""

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


def remove_file_extension(file_name: str) -> str:
	file_extension_dot_pos = file_name.rindex(".")
	return file_name[:file_extension_dot_pos]


def format_duration_text(song_duration: int) -> str:
	"""Takes a duration of time in seconds and converts it to hh:mm:ss or mm:ss format"""

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