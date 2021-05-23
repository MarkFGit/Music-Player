import os
from flask import Flask, redirect, url_for, render_template
#import re
from ctypes import wintypes, windll
from functools import cmp_to_key

# template_dir = os.path.abspath
app = Flask(__name__, template_folder='html', static_folder='static')

@app.route("/")
def home():
	path = 'C:/Users/markr/Desktop/Website/static/media/songs'
	data = sorted(os.listdir(path), key=len)
	#data = os.listdir(path)
	return render_template('index.html', data = data)

@app.route("/Playlists")
def playlists():
	return render_template('playlist.html')

if __name__ == "__main__":
	app.run(debug=True)
	
