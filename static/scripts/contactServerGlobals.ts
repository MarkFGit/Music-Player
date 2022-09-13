// As the file name implies, this script talks to the server and can be used by any page in the app.
import { renderCustomTextBox, } from "./renderCustomTextBox";


/** Sends a clean error message to the user, sends all the details to the console.*/
export function handleServerError(technicalErrorMsg: string, userErrorMsg: string): void {
	renderCustomTextBox(userErrorMsg);
	console.error(`${technicalErrorMsg} ${userErrorMsg}`);
}


/** Retrieves all playlist names from the DB. */
export async function resolve_playlist_names(): Promise<string[]> {
	return await fetch(
		"/getPlaylists",
		{
			method: "POST",
		}
	)
	.then(response => {
		if(response.ok){
			return response.json()	
		}
		throw new Error(`Failed with status: ${response.status}.`);
	})
	.then(data => {
		return data["PlaylistNames"]
	})
	.catch(error => {
		handleServerError(error, "Failed to retrieve playlist names from server.")
	})
}


export async function addNewPlaylist(playlistName: string): Promise<void> {
	return fetch(
		"/addPlaylist",
		{
			method: "POST",
			body: playlistName
		}
	)
	.then(response => {
		if(response.ok){
			renderCustomTextBox("Playlist added successfully.");
			return;
		}
		throw new Error(`Failed with status: ${response.status}.`);
	})
	.catch(error => {
		handleServerError(error, `Failed to add playlist: "${playlistName}"`)
	})
}

export async function deletePlaylist(playlistName: string): Promise<void> {
	return fetch(
		"/deletePlaylist",
		{
			method: "POST",
			body: playlistName
		}
	)
	.then(response => {
		if(response.ok){
			renderCustomTextBox("Playlist dropped successfully.");
			return;
		}
		throw new Error(`Failed with status: ${response.status}.`);
	})
	.catch(error => {
		handleServerError(error, `Failed to drop playlist: "${playlistName}".`);
	})
}