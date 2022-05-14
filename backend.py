# This file is responsible for the communication between the Filesystem/Database and the client web page
# So far this is only inteded for local use, since SQL injection is possible with some of the statements
	# This will be fixed later.


import os
from flask import Flask, redirect, url_for, render_template, send_from_directory, send_file, request, escape, abort
from tinytag import TinyTag
from PIL import Image, UnidentifiedImageError
from io import BytesIO
import mysql.connector
from datetime import datetime
import jsonpickle


app = Flask(__name__, template_folder='html', static_folder='static')


class songObject:
	def __init__(self, songInfo):
		self.fileName = songInfo[0]
		self.title = songInfo[1]
		self.duration = songInfo[2]
		self.artist = songInfo[3]
		self.album = songInfo[4]
		self.date = "" # song objects will only specify dates if the "Last Added" playlist is being loaded
		self.plays = songInfo[6]
		self.index = "" # Indices will only be included when other, custom playlists are being loaded


@app.route("/playlists/<playlist>", methods=["POST","GET"])
def generatePlaylistOntoPage(playlist):
	if(request.method == "POST"):
		songFile = request.files['file']
		songName = songFile.filename

		songFile.save(f'static/media/songs/{songName}')

		songFolder = f'C:/Users/markr/Desktop/Website/static/media/songs'
		songData = TinyTag.get(f'{songFolder}/{songName}', image=True)

		addNewCoverImgToFS(songName, songData)
		insertNewSongEntryInDatabase(songName, songData)

	playlistNames = getPlaylistNamesFromDB()["PlaylistNames"]
	playlistNames.append("Last Added")
	if(playlist not in playlistNames):
		return renderNotFoundPage(playlist)

	isLastAddedPlaylist = (request.path == "/playlists/Last Added")
	songObjectList = []
	if(isLastAddedPlaylist):
		pointer.execute(f"""SELECT * FROM `{playlist}` ORDER BY `Date Created` DESC""")
		allSongInfos = pointer.fetchall()
		for songInfo in allSongInfos:
			songObj = songObject(songInfo)
			songObj.date = formatDate(songInfo)
			jsonSongObject = jsonpickle.encode(songObj)
			songObjectList.append(jsonSongObject)
	else:
		pointer.execute(f"""SELECT * FROM `{playlist}` ORDER BY `Song Index` ASC""")
		allSongInfos = pointer.fetchall()
		for index, songInfo in enumerate(allSongInfos):
			fileName = songInfo[0]
			songIndex = songInfo[1]

			pointer.execute("SELECT * FROM `Last Added` WHERE `File Name` = %s", (fileName, ))
			allSongInfos[index] = list(pointer.fetchall()[0])
			allSongInfos[index].append(songIndex)
		
			songObj = songObject(allSongInfos[index])
			songObj.index = songIndex
			jsonSongObject = jsonpickle.encode(songObj)
			songObjectList.append(jsonSongObject)

	pointer.execute("SELECT * FROM `Playlist Metadata` WHERE `Table Name` = %s", (playlist, ))
	results = pointer.fetchall()[0]
	playlistCreateDate = results[2].date()
	formattedTotalTime = results[4]

	return render_template('index.html', playlistName = playlist,
										 playlistCreateDate = playlistCreateDate,
										 formattedTotalTime = formattedTotalTime,
										 numOfSongs = len(songObjectList), 
										 songObjectList = songObjectList
										 )



def formatDate(songInfo):
	dateStr = str(songInfo[5].date())
	yearMonthDay = dateStr.split("-")
	concatYear = yearMonthDay[0][2:] # Take last 2 digits of year. Ex: Turn 2022 into 22
	month = yearMonthDay[1]
	if(month[0] == "0"): # Ex: turn January (which is "01") into just "1"
		month = month[1]
	day = yearMonthDay[2]
	if(day[0] == "0"): # Ex: turn the 9th (which is "09") into just "9"
		day = day[1]

	return f"{month}/{day}/{concatYear}"


def getTitle(songTitle, songName):
	if(isinstance(songTitle, str)):
		return songTitle
	return songName[:-4]

def getArtist(songArtist):
	if(isinstance(songArtist, str)):
		return songArtist
	return ''

def getAlbum(songAlbum):
	if(isinstance(songAlbum, str)):
		return songAlbum
	return ''

def formatSongDurationText(songDuration):
	if(not isinstance(songDuration, float) and not isinstance(songDuration, int)):
		return ''

	hours = int(songDuration / 3600)
	remainingTime = songDuration - (hours * 3600)
	minutes = int(remainingTime / 60)
	seconds = int(remainingTime % 60)

	if(seconds < 10):
		seconds = f'0{seconds}'
	if(hours != 0):
		if(minutes < 10):
			minutes = f'0{minutes}'
		return f'{hours}:{minutes}:{seconds}'
	return f'{minutes}:{seconds}'


def addNewCoverImgToFS(songName, songData):
	try:
		coverPathFolder = 'C:/Users/markr/Desktop/Website/static/media/songCovers'
		songCoverName = f'{songName[:-4]}.jpeg'; #remove .mp3/.m4a extension, add .jpeg extension
		songCoverPath = f'{coverPathFolder}/{songCoverName}'

		# No need to add a new cover image if that cover image already exists
		if(os.path.exists(songCoverPath)):
			return

		coverImage_data = songData.get_image()
		if(coverImage_data == None):
			return

		coverBytes = Image.open(BytesIO(coverImage_data))
		coverBytes.save(f'{coverPathFolder}/{songCoverName}')
	except UnidentifiedImageError:
		print("""An UnidentifiedImageError has occurred (probably while trying to open coverImage_data). 
				 Proceeding as if image data does not exist""")


def insertNewSongEntryInDatabase(songName, songData):
	songTitle = getTitle(songData.title, songName)
	formattedSongDuration = formatSongDurationText(songData.duration)
	songArtist = getArtist(songData.artist)
	songAlbum = getAlbum(songData.album)

	pointer.execute("""INSERT INTO `last added` (`File Name`, Title, `Formatted Song Time`, 
					Artist, Album, `Date Created`, Plays, `Song Time Seconds`) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""", 
					(songName, songTitle, formattedSongDuration, songArtist, songAlbum, datetime.now(), 0, songData.duration))

	changePlaylistTimeMetadata(songData.duration, 'last added', 'increment')
	db.commit()



@app.route("/insertNewSong", methods=["POST"])
def insertNewSongEntryInPlaylist():
	fileName = request.form.to_dict().get("fileName")
	playlistName = request.form.to_dict().get("playlistName")

	allPlaylistNames = getPlaylistNamesFromDB()["PlaylistNames"]
	if(playlistName not in allPlaylistNames):
		print("ERROR, bad playlist name")
		print(f"playlist name is {playlistName}")
		print(f"playlist list is {allPlaylistNames}")
		return

	sql = f"""INSERT INTO `{playlistName}` (`File Name`) VALUES ("{fileName}")"""
	pointer.execute(sql)

	pointer.execute("SELECT `Song Time Seconds` FROM `Last Added` WHERE `File Name` = %s", (fileName, ))
	songTime = pointer.fetchall()[0][0]

	changePlaylistTimeMetadata(songTime, playlistName, 'increment')
	db.commit()

	return "OK"


def changePlaylistTimeMetadata(songTime, playlistName, op):
	pointer.execute("SELECT `Playlist Duration Seconds` FROM `Playlist Metadata` WHERE `Table Name` = %s", (playlistName, ))
	totalTime = pointer.fetchall()[0][0]
	if(op.lower() == 'increment'):
		totalTime += songTime
	elif(op.lower() == 'decrement'):
		totalTime -= songTime
		# This case should never happen if everything is correct.
		if(totalTime < 0):
			print(f'ERROR: total playlist time is now {totalTime}. This value should not have become negative, but it is.')
	else:
		abort(404) # This should never happen!

	durationText = formatSongDurationText(totalTime)

	pointer.execute("""UPDATE `Playlist Metadata` SET `Playlist Duration Seconds` = %s, 
					`Formatted Total Time` = %s WHERE `Table Name` = %s""", 
					(totalTime, durationText, playlistName))
	db.commit()




@app.route("/removeSong", methods=["POST"])
def removeSongFromPlaylist():
	songIndex = request.form.to_dict().get("songPlaylistIndex")
	playlistName = request.form.to_dict().get("playlistName")

	pointer.execute(f"SELECT `File Name` FROM `{playlistName}` WHERE `Song Index` = %s", (songIndex, ))
	queryResults = pointer.fetchall()
	if(len(queryResults) == 0):
		print(f"Requested song index remove is {songIndex}")
		print("""Bad input! Song must not exist in playlist. Either the user
				sent bad data or something is wrong with the data""")
		return

	fileName = queryResults[0][0]

	pointer.execute("""SELECT `Song Time Seconds` FROM `Last Added` WHERE `File Name` = %s""", (fileName, ))
	songTime = pointer.fetchall()[0][0]
	changePlaylistTimeMetadata(songTime, playlistName, 'decrement')

	pointer.execute(f"DELETE FROM `{playlistName}` WHERE `Song Index` = %s", (songIndex, ))
	db.commit()

	return "OK"



@app.route("/deleteSong", methods=["POST"])
def deleteSongFromDB():
	songFileName = request.form.to_dict().get("songFileName")
	songName = request.form.to_dict().get("songName")

	pointer.execute("SELECT `Song Time Seconds` FROM `Last Added` WHERE `File Name` = %s", (songFileName, ))
	songTime = pointer.fetchall()[0][0]

	changePlaylistTimeMetadata(songTime, 'Last Added', 'decrement')

	pointer.execute("DELETE FROM `Last Added` WHERE `File Name` = %s", (songFileName, ))
	playlistNames = getPlaylistNamesFromDB()["PlaylistNames"]
	db.commit()

	for playlistName in playlistNames:
		pointer.execute(f"DELETE FROM `{playlistName}` WHERE `File Name` = %s", (songFileName, ))
		db.commit()

		numOfDeletedSongs = pointer.rowcount

		decrementedPlaylistTime = numOfDeletedSongs * songTime
		changePlaylistTimeMetadata(decrementedPlaylistTime, playlistName, 'decrement')

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
	pointer.execute("SELECT Plays FROM `last added` WHERE `File Name` = %s", (songName, ))
	result = pointer.fetchall()
	newPlayValue = result[0][0] + 1
	pointer.execute("UPDATE `last added` SET Plays = %s WHERE `File Name` = %s", (newPlayValue, songName))
	db.commit()

	return "OK"


@app.route("/addPlaylist", methods=["POST"])
def createPlaylist():
	playlistName = request.form.to_dict().get("playlistName")

	playlistNames = getPlaylistNamesFromDB()["PlaylistNames"]
	if(playlistName in playlistNames):
		return "ERROR: Playlist name already exists"

	if(len(playlistName) > 100):
		return "ERROR: Playlist name cannot exceed 100 characters"

	sql = """CREATE TABLE `%s` (`File Name` VARCHAR(100) NOT NULL, `Song Index` smallint UNSIGNED AUTO_INCREMENT KEY)""" %playlistName
	pointer.execute(sql)

	pointer.execute("""INSERT INTO `Playlist Metadata` (`Table Name`, 
					`Actual Playlist Name`, `Date Created`, `Playlist Duration Seconds`, 
					`Formatted Total Time`) VALUES (%s, %s, %s, %s, %s)""", 
					(playlistName.lower(), playlistName, datetime.now(), 0, "00:00:00"))
	db.commit()
	
	return "OK"


@app.route("/deletePlaylist", methods=["POST"])
def deletePlaylist():
	playlistName = request.form.to_dict().get("playlistName")

	if(playlistName.lower() == "last added"):
		return "ERROR: Cannot drop Last Added playlist"


	sql = """DROP TABLE `%s`""" %playlistName
	pointer.execute(sql)

	pointer.execute("DELETE FROM `Playlist Metadata` WHERE `Table Name` = %s", (playlistName, ))

	db.commit()

	return "OK"


@app.route("/getPlaylists", methods=["POST"])
def getPlaylistNamesFromDB():
	pointer.execute("SELECT `Actual Playlist Name` FROM `Playlist Metadata`")
	results = pointer.fetchall()

	playlistNames = []
	for result in results:
		if (result[0] != "Last Added"):
			playlistNames.append(result[0])

	return {"PlaylistNames": playlistNames}



@app.route('/findImage', methods=["POST"])
def findImageOnServer():
	songCoverName = request.data.decode("utf-8")
	songCoverNames = os.listdir("./static/media/songCovers/")
	if(songCoverName in songCoverNames):
		return "OK"
	abort(400)



@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'media/icons/favicon.ico', mimetype='image/vnd.microsoft.icon')


@app.errorhandler(404)
def renderNotFoundPage(e):
	return render_template('notFound.html')


def createInitialTables():
	# Varchar 9 allows for **:**:** (H:M:S)
	pointer.execute("""CREATE TABLE `Last Added` (`File Name` VARCHAR(200) PRIMARY KEY NOT NULL, 
					Title VARCHAR(100), `Formatted Song Time` VARCHAR(9), `Song Time Seconds` smallint UNSIGNED,  Artist VARCHAR(100), 
					Album VARCHAR(50), `Date Created` datetime, plays smallint UNSIGNED)""")

	# this table exists due to table names not saving caps, actualPlaylistName will retain the caps
		# As well as storing other information about the playlists
	# MEDIUMINT - Max unsigned num can represent ~ 194 days in length
		# SMALLINT - Max unsigned num can represent ~ 18 hours. <-- too small
	pointer.execute("""CREATE TABLE `Playlist MetaData` (`Table Name` VARCHAR(100) PRIMARY KEY NOT NULL, 
			`Actual Playlist Name` VARCHAR(100), `Date Created` datetime, `Total Seconds` mediumint UNSIGNED,
			`Formatted Total Time` VARCHAR(12))""")
	

	pointer.execute("""INSERT INTO `Playlist MetaData` 
					(`Table Name`, `Actual Playlist Name`, `Date Created`, `Total Seconds`, `Formatted Total Time`) 
					VALUES (%s, %s, %s, %s, %s)""",
					('last added', 'Last Added', datetime.now(), 0, '00:00:00'))

	db.commit()

	return "SUCCESS"


if __name__ == "__main__":
	db = mysql.connector.connect(
		host="localhost",
		user="root",
		passwd="database",
		database="testDB"
	)

	pointer = db.cursor(buffered = True)

	pointer.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'testdb'") #Select all tables in testdb
	if (len(pointer.fetchall()) == 0):
		createInitialTables()

	app.run(debug=True)