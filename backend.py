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

@app.route("/", methods=["POST","GET"])
def home():
	if(request.method == "POST"):
		songName = request.form.to_dict().get('name');
		songFile = request.files['file']
		songFile.save(f'static/media/songs/{songName}')

		prepareNewDatabaseSong(songName) # contact sql database: insert new entry inside the main table

		
	print(url_for('home'))
	print("HI")

	songFileNames = []
	songTitles = []
	songArtists = []
	songAlbums = []
	songDurations = []

	pointer.execute("SELECT * FROM songtest3")
	allSongInfos = pointer.fetchall()

	allSongInfos.sort(key=lambda songInfo: songInfo[5], reverse = True) # sort by using the date index. most recent song goes to top

	for songInfo in allSongInfos:
		songFileNames.append(f'{songInfo[0]}.mp3')
		songTitles.append(songInfo[1])
		songArtists.append(songInfo[3])
		songDurations.append(songInfo[2])

		# songTitles.append(songInfo[0][4]) albums?
		# songTitles.append(songInfo[0][5]) durations?
		# songTitles.append(songInfo[0][6]) plays?

	print(songFileNames)


	numOfSongs = len(songFileNames)

	print("ENDHI")

	return render_template('index.html', songNames = songFileNames, numOfSongs = numOfSongs, 
										 songTitles = songTitles, songArtists = songArtists, 
										 songDurations = songDurations)


def prepareNewDatabaseSong(songName):
	mediaPath = 'C:/Users/markr/Desktop/Website/static/media'
	songPath = f'{mediaPath}/songs/'
	coverPath = f'{mediaPath}/songCovers/'

	coverPathNames = os.listdir(coverPath)

	songData = TinyTag.get(songPath+songName, image=True)
	songCoverName = f'{songName[:-4]}.jpeg'; #remove .mp3 extension, add .jpeg extension

	if(songCoverName not in coverPathNames):
		coverImage_data = songData.get_image()

		if (coverImage_data != None): #if cover image has not been saved yet AND it has a cover image, save it in the cover image directory
			coverBytes = Image.open(BytesIO(coverImage_data))
			coverBytes.save(f'{mediaPath}/songCovers/{songName[:-4]}.jpeg')

	if(isinstance(songData.title, str)):
		songTitle = str(songData.title)
	else:
		songTitle = songName[:-4]


	if(isinstance(songData.artist, str)):
		songArtist = str(songData.artist)
	else:
		songArtist = ''



	if(isinstance(songData.album, str)):
		songAlbum = str(songData.album)
	else:
		songAlbum = ''



	if(isinstance(songData.duration, float)):
		minutes = int(songData.duration / 60)
		seconds = int(songData.duration % 60)
		if(seconds < 10):
			seconds = f'0{str(int(songData.duration % 60))}'
		songDuration = f'{minutes}:{seconds}'
	else:
		songDuration = ''

	pointer.execute("INSERT INTO songTest3 (fileName, title, durationSecs, artist, album, created, plays) VALUES (%s,%s,%s,%s,%s,%s,%s)", 
								(songName[:-4], songTitle, songDuration, songArtist, songAlbum, datetime.now(), 0))
	db.commit()


@app.route("/Playlists")
def playlists():
	return render_template('playlist.html')


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'media/icons/favicon.ico', mimetype='image/vnd.microsoft.icon')


if __name__ == "__main__":
	app.run(debug=True)