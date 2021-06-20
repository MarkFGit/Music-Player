import os
from flask import Flask, redirect, url_for, render_template, send_from_directory, send_file, request
from tinytag import TinyTag
from PIL import Image
from io import BytesIO
from base64 import b64encode

app = Flask(__name__, template_folder='html', static_folder='static')

@app.route("/", methods=["POST","GET"])
def home():
	# if(request.method == "POST"):
	# 	print("information\n\n\n\n\n\n\n\n\n\n\n")
	# 	print(request.get_json())
	# 	return


	songPath = 'C:/Users/markr/Desktop/Website/static/media/songs/'
	songFileNames = sorted(os.listdir(songPath), key=len)

	coverPath = 'C:/Users/markr/Desktop/Website/static/media/songCovers/'
	coverPathNames = os.listdir(coverPath)

	numSongs = len(os.listdir(songPath))

	songTitles = []
	songArtists = []
	songDurations = []

	#start loop

	for song in songFileNames:
		songData = TinyTag.get(songPath+song)

		if(song not in coverPathNames):
			coverImage_data = songData.get_image()
			if (coverImage_data != None): #Modify this ***********
				coverBytes = Image.open(BytesIO(coverImage_data))
				coverBytes.save('C:/Users/markr/Desktop/Website/static/media/songCovers/'+song[:-4]+".jpeg")

		if(isinstance(songData.title, str)):
			songTitles.append(str(songData.title))
		else:
			songTitles.append("No Song Artist Metadata")


		if(isinstance(songData.artist, str)):
			songArtists.append(str(songData.artist))
		else:
			songArtists.append("No Song Artist Metadata")


		if(isinstance(songData.duration, float)):
			songDurations.append(f'{int(songData.duration / 60)}:{"0" + str(int(songData.duration % 60)) if int(songData.duration % 60) < 10 else int(songData.duration % 60)}')
		else:
			songDurations.append('')


	return render_template('index.html', songNames = songFileNames, numSongs = numSongs, songTitles = songTitles, songArtists = songArtists, songDurations = songDurations)


@app.route("/Playlists")
def playlists():
	return render_template('playlist.html')


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')


if __name__ == "__main__":
	app.run(debug=True)