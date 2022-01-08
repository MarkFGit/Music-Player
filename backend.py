import os
from flask import Flask, redirect, url_for, render_template, send_from_directory, send_file, request, escape
from tinytag import TinyTag
from PIL import Image, UnidentifiedImageError
from io import BytesIO
import mysql.connector
from datetime import datetime


app = Flask(__name__, template_folder='html', static_folder='static')


@app.route("/playlists/<playlist>", methods=["POST","GET"])
def generatePlaylistOntoPage(playlist):
	if(request.method == "POST"):
		songName = request.form.to_dict().get('name')
		songFile = request.files['file']
		songFile.save(f'static/media/songs/{songName}')

		songPath = f'C:/Users/markr/Desktop/Website/static/media/songs/'
		songData = TinyTag.get(songPath+songName, image=True)

		addNewCoverImgToFS(songName, songData)
		insertNewSongEntryInDatabase(songName, songData)


	escapedPlaylistName = escape(playlist)

	playlistNames = getPlaylistNamesFromDB()['PlaylistNames']
	playlistNames.append("Last Added")
	if(escapedPlaylistName not in playlistNames):
		return renderNotFoundPage(escapedPlaylistName)

	pointer.execute(f"""SELECT * FROM `{escapedPlaylistName}`""")
	allSongInfos = pointer.fetchall()
	if(request.path == "/playlists/Last Added"): # sort by using the date (most recent song goes to top). otherwise sort by song index
		allSongInfos.sort(key=lambda songInfo: songInfo[5], reverse = True)
	else:
		allSongInfos.sort(key=lambda songInfo: songInfo[1], reverse = True)
		for index, songInfo in enumerate(allSongInfos):
			pointer.execute("SELECT * FROM `Last Added` WHERE fileName = %s", (songInfo[0], ))
			allSongInfos[index] = list(pointer.fetchall()[0])
			allSongInfos[index].append(songInfo[1]) #append indice of song in the playlist
	

	songFileNames = []
	songTitles = []
	songArtists = []
	songAlbums = []
	songDurations = []
	songAlbums = []
	songPlays = []
	songIndices = []

	for songInfo in allSongInfos:
		songFileNames.append(songInfo[0])
		songTitles.append(songInfo[1])
		songDurations.append(songInfo[2])
		songArtists.append(songInfo[3])
		songAlbums.append(songInfo[4])
		songPlays.append(songInfo[6])

	if(request.path != "/playlists/Last Added"):
		for songInfo in allSongInfos:
			songIndices.append(songInfo[7])

	numOfSongs = len(songFileNames)

	return render_template('index.html', playlistName = escapedPlaylistName,
										 songNames = songFileNames, 
										 numOfSongs = numOfSongs, 
										 songTitles = songTitles, 
										 songArtists = songArtists, 
										 songDurations = songDurations, 
										 songAlbums = songAlbums,
										 songPlays = songPlays,
										 songIndices = songIndices
										 )


def determineTitle(songData, songName):
	if(isinstance(songData.title, str)):
		return songData.title
	return songName[:-4]


def determineArtist(songData):
	if(isinstance(songData.artist, str)):
		return songData.artist
	return ''

def determineAlbum(songData):
	if(isinstance(songData.album, str)):
		return songData.album
	return ''

def determineSongDurationText(songData):
	if(isinstance(songData.duration, float)):
		minutes = int(songData.duration / 60)
		seconds = int(songData.duration % 60)
		if(seconds < 10):
			seconds = f'0{seconds}'
		return f'{minutes}:{seconds}'
	return ''


def addNewCoverImgToFS(songName, songData):
	try:
		coverPathFolder = 'C:/Users/markr/Desktop/Website/static/media/songCovers/'
		coverNames = os.listdir(coverPathFolder)

		songCoverName = f'{songName[:-4]}.jpeg'; #remove .mp3/.m4a extension, add .jpeg extension

		if(songCoverName not in coverNames):
			coverImage_data = songData.get_image()
			hasCoverImgData = (coverImage_data != None)
			if(hasCoverImgData):
				coverBytes = Image.open(BytesIO(coverImage_data))
				coverBytes.save(f'{coverPathFolder}{songCoverName}')
	except UnidentifiedImageError:
		print("""An UnidentifiedImageError has occurred (probably while trying to open coverImage_data). 
				 Proceeding as if image data does not exist""")


def insertNewSongEntryInDatabase(songName, songData):
	songTitle = determineTitle(songData, songName)
	songDuration = determineSongDurationText(songData)
	songArtist = determineArtist(songData)
	songAlbum = determineAlbum(songData)

	pointer.execute("""INSERT INTO `last added` 
					(fileName, title, durationSecs, artist, album, created, plays) 
					VALUES (%s,%s,%s,%s,%s,%s,%s)""", 
					(songName, songTitle, songDuration, songArtist, songAlbum, datetime.now(), 0))
	db.commit()



@app.route("/insertNewSong", methods=["POST"])
def insertNewSongEntryInPlaylist():
	fileName = request.form.to_dict().get("fileName")
	playlistName = request.form.to_dict().get("playlistName")

	allPlaylistNames = getPlaylistNamesFromDB()['PlaylistNames']
	if(playlistName not in allPlaylistNames):
		return "ERROR, bad playlist name"

	sql = f"""INSERT INTO `{playlistName}` (fileName) VALUES ("{fileName}")"""
	pointer.execute(sql)
	db.commit()

	return "OK"


@app.route("/removeSong", methods=["POST"])
def removeSongFromPlaylist():
	songIndex = request.form.to_dict().get("songPlaylistIndex")
	playlistName = request.form.to_dict().get("playlistName")

	sql = f"""DELETE FROM `{playlistName}` WHERE songIndex = {songIndex}"""
	pointer.execute(sql)
	db.commit()

	return "OK"


@app.route("/deleteSong", methods=["POST"])
def deleteSongFromDB():
	songFileName = request.form.to_dict().get("songFileName")
	songName = request.form.to_dict().get("songName")

	sql = f"""DELETE FROM `Last Added` WHERE filename = "{songFileName}" """
	pointer.execute(sql)
	playlistNames = getPlaylistNamesFromDB()
	db.commit()

	for playlistName in playlistNames['PlaylistNames']:
		sql = f"""DELETE FROM `{playlistName}` WHERE filename = "{songFileName}" """
		pointer.execute(sql)
		db.commit()

	deleteAssociatedSongFiles(songFileName, songName)

	return "OK"


def deleteAssociatedSongFiles(songFileName, songName):
	songFilePath = f"./static/media/songs/{songFileName}"
	songCoverFilePath = f"./static/media/songCovers/{songName}.jpeg"

	if(os.path.exists(songFilePath)):
		os.remove(songFilePath)
	if(os.path.exists(songCoverFilePath)):
		os.remove(songCoverFilePath)

	return "OK"



@app.route("/home/")
def home():
	return render_template('home.html')


@app.route("/updatePlays", methods=["POST"])
def updatePlays():
	songName =  request.form.to_dict().get("songName")
	pointer.execute("SELECT plays FROM `last added` WHERE fileName = %s", (songName, ))
	result = pointer.fetchall()
	newPlayValue = result[0][0] + 1
	pointer.execute("UPDATE `last added` SET plays = %s WHERE fileName = %s", (newPlayValue, songName))
	db.commit()

	return "OK"


@app.route("/addPlaylist", methods=["POST"])
def createPlaylist():
	playlistName = request.form.to_dict().get("playlistName")

	playlistNames = getPlaylistNamesFromDB()
	if(playlistName in playlistNames["PlaylistNames"]):
		return "ERROR: Playlist name already exists"

	if(len(playlistName) > 100):
		return "ERROR: Playlist name cannot exceed 100 characters"

	sql = """CREATE TABLE `%s` (fileName VARCHAR(100) NOT NULL, songIndex smallint UNSIGNED AUTO_INCREMENT KEY)""" %playlistName
	# quotations around %s allow for spaces in table names
	pointer.execute(sql)

	pointer.execute("""INSERT INTO `playlist names`
					(playlistTableName, actualPlaylistName) VALUES (%s, %s)""", (playlistName.lower(), playlistName))

	db.commit()
	
	return "OK"


@app.route("/deletePlaylist", methods=["POST"])
def deletePlaylist():
	playlistName = request.form.to_dict().get("playlistName")

	if(playlistName.lower() == "last added"):
		return "ERROR: Cannot drop Last Added playlist"


	sql = """DROP TABLE `%s`""" %playlistName
	pointer.execute(sql)

	sql = """DELETE FROM `playlist names` WHERE playlistTableName = '%s'""" %playlistName
	pointer.execute(sql)

	db.commit()

	return "OK"


@app.route("/getPlaylists", methods=["POST"])
def getPlaylistNamesFromDB():
	pointer.execute("SELECT actualPlaylistName FROM `playlist names`")
	results = pointer.fetchall()

	playlistNames = []
	for result in results:
		if (result[0] != "Last Added"):
			playlistNames.append(result[0])

	return {"PlaylistNames": playlistNames}


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'media/icons/favicon.ico', mimetype='image/vnd.microsoft.icon')


@app.errorhandler(404)
def renderNotFoundPage(e):
	return render_template('notFound.html')


def createInitialTables():
	pointer.execute("""CREATE TABLE `Last Added` (fileName VARCHAR(100) PRIMARY KEY NOT NULL, 
			title VARCHAR(50), durationSecs VARCHAR(7),  artist VARCHAR(50), 
			album VARCHAR(50), created datetime, plays smallint UNSIGNED)""")

	pointer.execute("""CREATE TABLE `Playlist Names` (playlistTableName VARCHAR(100) PRIMARY KEY NOT NULL, 
			actualPlaylistName VARCHAR(100))""")
	# this table exists due to table names not saving caps, actualPlaylistName will retain the caps

	pointer.execute("""INSERT INTO `Playlist Names` (playlistTableName, actualPlaylistName) VALUES (%s, %s)""",
					('last added', 'Last Added'))

	db.commit()

	return "Created Table: lastAdded"


if __name__ == "__main__":
	db = mysql.connector.connect(
		host="localhost",
		user="root",
		passwd="database",
		database="testDB"
	)

	pointer = db.cursor(buffered=True)

	pointer.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'testdb'") #Select all tables in testdb
	if (len(pointer.fetchall()) == 0):
		createInitialTables()

	app.run(debug=True)