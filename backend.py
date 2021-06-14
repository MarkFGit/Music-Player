import os
from flask import Flask, redirect, url_for, render_template, send_from_directory, send_file, request
from tinytag import TinyTag
from PIL import Image
from io import BytesIO
from base64 import b64encode

app = Flask(__name__, template_folder='html', static_folder='static')

@app.route("/", methods=["POST","GET"])
def home():
	path = 'C:/Users/markr/Desktop/Website/static/media/songs/'
	songNames = sorted(os.listdir(path), key=len)
	numSongs = len(os.listdir(path))

	if(request.method == "POST"):
		print("information\n\n\n\n\n\n\n\n\n\n\n")
		print(request.get_json())
		thing = "hi"
		return "hi"
	
	#start loop
	for song in songNames:
		coverImg = TinyTag.get(path+song, image = True)
		coverImage_data = coverImg.get_image()

		if (coverImage_data != None): #Modify this ***********
			coverBytes = Image.open(BytesIO(coverImage_data))
			# print(song)
			# print(song[:-4])
			# print("\n\n\n")
			coverBytes.save('C:/Users/markr/Desktop/Website/static/media/songCovers/'+song[:-4]+".jpeg")

	#output = BytesIO()
	#coverBytes.save(output, format='JPEG')
	#image_data = b64encode(output.getvalue())


	# if (type(image_data) != str):
	# 	image_data = image_data.decode() #Turns bytes to string

	# data_url = 'data:image/jpeg;base64,' + image_data
	#end loop

	return render_template('index.html', songNames = songNames, numSongs = numSongs)


@app.route("/Playlists")
def playlists():
	return render_template('playlist.html')


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')


def checkImages():
	return foo


if __name__ == "__main__":
	# path = 'C:/Users/markr/Desktop/Website/static/media/songs'
	# song = TinyTag.get(path+"/6.mp3")

	# print("Title: " + str(song.title))
	# print("Duration: " + str(song.artist))
	# print("Duration: " + str(song.duration))
	# print("Duration: " + str(song.duration))



	app.run(debug=True)
	


#May Want Class for object that can hold:
	#Song Title
	#Song Artist
	#Song Image Data (if present)
	#