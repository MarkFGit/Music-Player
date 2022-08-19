// As the file name implies, this script talks to the server and can be used by any page in the app.
import { renderCustomTextBox, } from "./renderCustomTextBox";


/** Retrieves all playlist names from the DB. */
export async function resolve_playlist_names(){
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
		throw new Error("Failed to retrieve playlist names from server.")
	})
	.then(data => {
		return data["PlaylistNames"]
	})
}


export async function addNewPlaylist(playlistName: string){
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
		}
		else{
			renderCustomTextBox(`Failed to add playlist: "${playlistName}"`);
			throw new Error(`Failed to add playlist: "${playlistName}". Failed with status: ${response.status}`);
		}
	})
}

export async function deletePlaylist(playlistName: string){
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
		}
		else{
			renderCustomTextBox(`Failed to drop playlist: "${playlistName}"`);
			throw new Error(`Failed to drop playlist: "${playlistName}". Failed with status: ${response.status}`);
		}
	})
}