# This file is responsible for the communication between the Filesystem/Database and the client web page
# So far this is only inteded for local use, since SQL injection is possible with some of the statements
	# This will be fixed later.

from flask import Flask, render_template, send_from_directory
from datetime import datetime
import os
from pathlib import Path

# Documentation about APSchedular can be found here https://apscheduler.readthedocs.io/en/master/userguide.html
from apscheduler.schedulers.background import BackgroundScheduler

# Imports used to type variables ---------------------------------------------
from flask.wrappers import Response
# ----------------------------------------------------------------------------

# Imports from local scripts -------------------------------------------------
from g import get_db_conn, get_db_cursor
from playlist import playlist_routes
from song import song_routes

import backend_env
from helper_scripts.backup_db import back_up_db
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

	db_ptr.execute(
		"""
		CREATE TABLE songs 
		(
			file_name VARCHAR(200) PRIMARY KEY, 
			title VARCHAR(100),
			duration_seconds SMALLINT UNSIGNED NOT NULL,
			artist VARCHAR(100), 
			album VARCHAR(50), 
			datetime_created DATETIME NOT NULL, 
			plays SMALLINT UNSIGNED NOT NULL,
			has_cover_image BIT NOT NULL
		)
		"""
	)

	db_ptr.execute(
		"""
		CREATE TABLE playlist_metadata
		( 
			playlist VARCHAR(100) PRIMARY KEY, 
			datetime_created DATETIME NOT NULL
		)
		"""
	)

	db_ptr.execute("INSERT INTO playlist_metadata (playlist, datetime_created) VALUES (%s, %s)", ("Last Added", datetime.now()))

	db_ptr.execute(
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

	db = get_db_conn()
	db.commit()


if __name__ == "__main__":
	scheduler = BackgroundScheduler(daemon=True)
	# misfire_grace_time is 1 day, because if my computer is turned off the job will not activate until the computer is turned on
		# and the backup should be daily
	scheduler.add_job(lambda: back_up_db(backend_env.DB_NAME), 'cron', hour='0', minute='0', replace_existing=True, misfire_grace_time=86400)
	scheduler.start()
	print("Backup cycle starting...")

	create_init_tables_if_needed()
	media_path = Path(playlist_routes.root_path + "/static/media")

	if not media_path.joinpath("songs").exists():
		media_path.joinpath("songs").mkdir()
	if not media_path.joinpath("songCovers").exists():
		media_path.joinpath("songCovers").mkdir()

	if not Path(playlist_routes.root_path + "/local backups").exists():
		Path(playlist_routes.root_path + "/local backups").mkdir()

	app.run(port=backend_env.PORT, debug=backend_env.DEBUG_OPTION)
	