import os
from flask import Flask, redirect, url_for, render_template, send_from_directory, send_file
#import re
from ctypes import wintypes, windll
from functools import cmp_to_key

# template_dir = os.path.abspath
app = Flask(__name__, template_folder='html', static_folder='static')

@app.route("/")
def home():
	path = 'C:/Users/markr/Desktop/Website/static/media/songs'
	songNames = sorted(os.listdir(path), key=len)
	#data = os.listdir(path)
	numSongs = len(os.listdir(path))
	return render_template('index.html', songNames = songNames, numSongs = numSongs)

@app.route("/Playlists")
def playlists():
	return render_template('playlist.html')


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')


if __name__ == "__main__":
	app.run(debug=True)
	
