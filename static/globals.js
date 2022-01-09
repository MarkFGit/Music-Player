export function getPlaylistName(){
	return document.getElementById('scriptTag').getAttribute('playlistName');
}

export function removeFileExtension(fileName){
	return fileName.slice(0, fileName.lastIndexOf("."));
}

export function getSongObjectsList(){
	const songObjectsJSONList = JSON.parse(document.getElementById('scriptTag').getAttribute('songObjectList'));
	const songObjectsList = songObjectsJSONList.map(songObject => JSON.parse(songObject));
	return songObjectsList;
}