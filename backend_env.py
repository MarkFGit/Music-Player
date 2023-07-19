# This file serves to make updating dev to prod smoother such that:
	# No modifications are necessary when moving updated python files to another environment.

import os
import sys

# Folder in which backend.py lives
_current_folder = os.path.basename(sys.path[0])

if(_current_folder == "dev-website"):
	DEBUG_OPTION = True
	PORT = 5000
	DB_NAME = "testdb"
	ENV_NAME = "dev"


if(_current_folder == "prod-website"):
	DEBUG_OPTION = False
	PORT = 5002
	DB_NAME = "personal_db"
	ENV_NAME = "prod"