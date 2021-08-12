import os
from flask import Flask, redirect, url_for, render_template, send_from_directory, send_file, request
from tinytag import TinyTag
from PIL import Image
from io import BytesIO
import mysql.connector
from datetime import datetime


db = mysql.connector.connect(
	host="localhost",
	user="root",
	passwd="database",
	database="testDB"
	)

pointer = db.cursor(buffered=True)

app = Flask(__name__, template_folder='html', static_folder='static')

@app.route("/lastAdded", methods=["POST","GET"])
def lastAdded():
	if(request.method == "POST"):
		songName = request.form.to_dict().get('name');
		songFile = request.files['file']
		songFile.save(f'static/media/songs/{songName}')

		songPath = f'C:/Users/markr/Desktop/Website/static/media/songs/'
		songData = TinyTag.get(songPath+songName, image=True)

		addNewCoverImgToFS(songName, songData)
		insertNewSongEntryInDatabase(songName, songData)

	songFileNames = []
	songTitles = []
	songArtists = []
	songAlbums = []
	songDurations = []
	songAlbums = []
	songPlays = []

	pointer.execute("SELECT * FROM lastaddedplaylist")
	allSongInfos = pointer.fetchall()

	allSongInfos.sort(key=lambda songInfo: songInfo[5], reverse = True) # sort by using the date index. most recent song goes to top

	for songInfo in allSongInfos:
		songFileNames.append(songInfo[0])
		songTitles.append(songInfo[1])
		songArtists.append(songInfo[3])
		songDurations.append(songInfo[2])
		songAlbums.append(songInfo[4])
		songPlays.append(songInfo[6])
		# songTitles.append(songInfo[5]) date added?

	numOfSongs = len(songFileNames)

	return render_template('index.html', songNames = songFileNames, numOfSongs = numOfSongs, 
										 songTitles = songTitles, songArtists = songArtists, 
										 songDurations = songDurations, songAlbums = songAlbums,
										 songPlays = songPlays)


def addNewCoverImgToFS(songName, songData):
	coverPathFolder = 'C:/Users/markr/Desktop/Website/static/media/songCovers/'
	coverPathNames = os.listdir(coverPathFolder)

	songCoverName = f'{songName[:-4]}.jpeg'; #remove .mp3/.m4a extension, add .jpeg extension

	if(songCoverName not in coverPathNames):
		coverImage_data = songData.get_image()
		hasCoverImgData = (coverImage_data != None)
		if(hasCoverImgData):
			coverBytes = Image.open(BytesIO(coverImage_data))
			coverBytes.save(f'{coverPathFolder}{songName[:-4]}.jpeg')


def insertNewSongEntryInDatabase(songName, songData):
	songTitle = determineTitle(songData)
	songDuration = determineSongDurationText(songData)
	songArtist = determineArtist(songData)
	songAlbum = determineAlbum(songData)

	pointer.execute("INSERT INTO lastaddedplaylist (fileName, title, durationSecs, artist, album, created, plays) VALUES (%s,%s,%s,%s,%s,%s,%s)", 
								(songName, songTitle, songDuration, songArtist, songAlbum, datetime.now(), 0))
	db.commit()



def determineTitle(songData):
	if(isinstance(songData.title, str)):
		return songData.title
	return songName


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
			seconds = f'0{str(int(songData.duration % 60))}'
		return f'{minutes}:{seconds}'
	return ''


@app.route("/home/")
def home():
	# query SQL database, retreive how many playlists there are
	# fetch that data, send it with render template
	# For each playlist generate a new square within a grid, put playlist title on grid
	return render_template('home.html')




@app.route("/updatePlays", methods=["POST"])
def updatePlays():
	songName =  request.form.to_dict().get("songName")
	pointer.execute("SELECT plays FROM lastaddedplaylist WHERE fileName = %s", (songName, ))
	result = pointer.fetchall()
	newPlayValue = result[0][0] + 1
	pointer.execute("UPDATE lastaddedplaylist SET plays = %s WHERE fileName = %s", (newPlayValue, songName))
	db.commit()

	return "OK"


@app.route("/createPlaylist", methods=["POST"])
def createPlaylist():
	playlistName = request.form.to_dict().get("playlistName")
	sql = """CREATE TABLE %s (fileName VARCHAR(100) PRIMARY KEY NOT NULL, songIndex smallint UNSIGNED)""" %playlistName
	pointer.execute(sql)
	
	return "OK"


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'media/icons/favicon.ico', mimetype='image/vnd.microsoft.icon')


if __name__ == "__main__":
	app.run(debug=True)