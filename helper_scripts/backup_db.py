from datetime import datetime
import os
import subprocess
import shutil
import sys
import platform

# -------- Local Script Imports --------
import backend_env
# --------------------------------------



def back_up_db(db_name: str) -> None:
	"""
	Backups the database (and any possible errors) 
	to a local location within the website folder
	and to a cloud location (within Mega).
	"""
	website_folder = sys.path[0]
	backups_folder = f"{website_folder}/local backups"

	# If the backups folder doesn't exist, make it
	if(not os.path.isdir(backups_folder)):
		os.mkdir(backups_folder)

	date_file_name = str(datetime.now()).replace("-", "_").replace(":", "_")
	
	new_dir_path = os.path.join(backups_folder, date_file_name)
	os.mkdir(new_dir_path)

	normal_file_path = f"{new_dir_path}/{date_file_name}.sql"
	error_file_path = f"{new_dir_path}/ERROR_{date_file_name}.sql"

	backup_db_to_local_dir(db_name, normal_file_path, error_file_path)
	# copy_backup_to_MEGA(normal_file_path, error_file_path, date_file_name)

	print(f"Backed up at {date_file_name}")


def backup_db_to_local_dir(db_name: str, normal_file_path: str, error_file_path: str) -> None:
	""" Runs MySQLDump and saves the results in the location of '/{the_current_website_dir}/local backups/{datetime}/' """
	if platform.system() == "Windows":
		subprocess.run(
			# login via this method. Found this method from https://stackoverflow.com/a/28021494/16432352
			["mysqldump", "--login-path=local", db_name],
			shell=True,
			cwd="C:/Program Files/MySQL/MySQL Server 8.0/bin/",
			stdout=open(normal_file_path,"w"),
			stderr=open(error_file_path, "w")
		)
	elif platform.system() == "Linux":		
		# This variable depends on where the server is started from! Please make sure you are running the server from the base folder to ensure this is working correctly.
		parent_process_full_cwd = sys.path[0]

		subprocess.run(
			["mysqldump", f"--defaults-extra-file={parent_process_full_cwd}/dbconfig.cnf"],
			cwd="/bin/",
			stdout=open(normal_file_path, "w"),
			stderr=open(error_file_path, "w")
		)
		# Also suppress error password error? (Delete file if password text present)
	else:
		print("Failed to make a local backup!")
		return

	no_error = (os.stat(error_file_path).st_size == 0)
	if no_error:
		os.remove(error_file_path)


def copy_backup_to_MEGA(loc_norm_file_path: str, loc_err_file_path: str, date_file_name: str) -> None:
	""" Copies the local backup files just made to the MEGA folder, which is synced up to the cloud. """
	mega_backups_path = f"{os.path.expanduser('~')}/Documents/MEGA/DB Backups/{backend_env.ENV_NAME}"
	new_dir_path = f"{mega_backups_path}/{date_file_name}"
	
	os.mkdir(new_dir_path)
	mega_norm_path = f"{new_dir_path}/{date_file_name}.sql"
	mega_err_path = f"{new_dir_path}/ERROR_{date_file_name}.sql"

	shutil.copy2(loc_norm_file_path, mega_norm_path)

	if os.path.isfile(loc_err_file_path):
		shutil.copy2(loc_err_file_path, mega_err_path)