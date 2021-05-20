import os
from flask import Flask, redirect, url_for, render_template

# template_dir = os.path.abspath
app = Flask(__name__, template_folder='html', static_folder='static')

@app.route("/")
def home():
	return render_template('index.html')

if __name__ == "__main__":
	app.run(debug=True)