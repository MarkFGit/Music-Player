// As the file name implies, this script talks to the server and can be used by any page in the app.
import { renderCustomTextBox, } from "./renderCustomTextBox";


/** Sends a clean error message to the user, sends userError + technicalErrorMsg to the console. 
 * Later this function will also send error details to the server to record in a log file. */
export function handleError(userErrorMsg: string, technicalErrorMsg: string): void {
	renderCustomTextBox(userErrorMsg);
	console.error(`${userErrorMsg} ${technicalErrorMsg}`);
}

/** Retrieves all playlist names from the DB. */
export async function resolvePlaylistNames(): Promise<string[]> {
	const response = await fetch("/getPlaylists", { method: "POST" });

	if(!response.ok){
		handleError("Failed to retrieve playlist names from server.", `Failed with status: ${response.status}.`);
		return;
	}

	const data = await response.json();

	return data["PlaylistNames"];
}


export async function addNewPlaylist(playlistName: string): Promise<void> {
	const response = await fetch("/addPlaylist", { method: "POST", body: playlistName });
	
	if(!response.ok){
		handleError(`Failed to create playlist with name: "${playlistName}".`, `Failed with status: ${response.status}.`);
		return;
	}

	renderCustomTextBox("Playlist added successfully.");
}

export async function deletePlaylist(playlistName: string): Promise<void> {
	const response = await fetch("/deletePlaylist", { method: "POST", body: playlistName });

	if(!response.ok){
		handleError(`Failed to drop playlist with name: "${playlistName}".`, `Failed with status: ${response.status}.`);
		return;
	}

	renderCustomTextBox("Playlist dropped succesfully.");
}