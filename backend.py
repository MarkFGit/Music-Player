import os
from flask import Flask, redirect, url_for, render_template, send_from_directory, send_file, request
from tinytag import TinyTag
from PIL import Image
from io import BytesIO
from base64 import b64encode

app = Flask(__name__, template_folder='html', static_folder='static')

@app.route("/", methods=["POST","GET"])
def home():
	mediaPath = 'C:/Users/markr/Desktop/Website/static/media'

	songPath = f'{mediaPath}/songs/'
	songFileNames = sorted(os.listdir(songPath), key=len)

	coverPath = f'{mediaPath}/songCovers/'
	coverPathNames = os.listdir(coverPath)

	numOfSongs = len(songFileNames)

	songTitles = []
	songArtists = []
	songDurations = []



	for song in songFileNames:
		songData = TinyTag.get(songPath+song, image=True)
		songCoverName = f'{song[:-4]}.jpeg'; #remove .mp3 extension, add .jpeg extension

		if(songCoverName not in coverPathNames):
			coverImage_data = songData.get_image()

			if (coverImage_data != None): #if cover image has not been saved yet AND it has a cover image, save it in the cover image directory
				coverBytes = Image.open(BytesIO(coverImage_data))
				coverBytes.save(f'{mediaPath}/songCovers/{song[:-4]}.jpeg')

		if(isinstance(songData.title, str)):
			songTitles.append(str(songData.title))
		else:
			songTitles.append("No Song Title Metadata")


		if(isinstance(songData.artist, str)):
			songArtists.append(str(songData.artist))
		else:
			songArtists.append("No Song Artist Metadata")


		if(isinstance(songData.duration, float)):
			minutes = int(songData.duration / 60)
			seconds = int(songData.duration % 60)
			if(seconds < 10):
				seconds = f'0{str(int(songData.duration % 60))}'
			songDurations.append(f'{minutes}:{seconds}')
		else:
			songDurations.append('N/A')


	return render_template('index.html', songNames = songFileNames, numOfSongs = numOfSongs, 
										 songTitles = songTitles, songArtists = songArtists, 
										 songDurations = songDurations)


@app.route("/Playlists")
def playlists():
	return render_template('playlist.html')


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'media/icons/favicon.ico', mimetype='image/vnd.microsoft.icon')


if __name__ == "__main__":
	app.run(debug=True)