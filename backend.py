# This file is responsible for the communication between the Filesystem/Database and the client web page
# So far this is only inteded for local use, since SQL injection is possible with some of the statements
	# This will be fixed later.

from flask import Flask, render_template, send_from_directory
from datetime import datetime
import os

# Imports used to type variables ---------------------------------------------
from flask.wrappers import Response
# ----------------------------------------------------------------------------

# Imports from local scripts -------------------------------------------------
from g import get_db_conn, get_db_cursor
from playlist import playlist_routes
from song import song_routes
# ----------------------------------------------------------------------------


app = Flask(__name__, template_folder="html", static_folder="static")
app.register_blueprint(playlist_routes)
app.register_blueprint(song_routes)


@app.route("/favicon.ico")
def favicon() -> Response:
    return send_from_directory(
    	os.path.join(app.root_path, "static"), 
    	"media/icons/favicon.ico", 
    	mimetype="image/vnd.microsoft.icon"
    )


@app.route("/home/")
def render_home_page() -> str:
	return render_template("home.html")


@app.errorhandler(404)
def render_not_found_page(_) -> str:
	return render_template("notFound.html")


def create_init_tables_if_needed() -> None:

	db_ptr = get_db_cursor()
	db_ptr.execute("SHOW TABLES") 
	if (len(db_ptr.fetchall()) != 0):
		return

	# Varchar 9 allows for hh:mm:ss
	db_ptr.execute(
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
	db_ptr.execute(
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
	

	db_ptr.execute(
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

	db = get_db_conn()
	db.commit()


if __name__ == "__main__":
	create_init_tables_if_needed()

	app.run(port=5000, debug=True)