export function getPlaylistName(){
	return document.getElementById('scriptTag').getAttribute('playlistName');
}

export function removeFileExtension(fileName){
	return fileName.slice(0, fileName.lastIndexOf("."));
}


export function isPlaylistPage(){
	const table = document.getElementById("songTable");
	return (table !== null);
}

let songObjectsList;
if(isPlaylistPage()){
	const songObjectsJSONList = JSON.parse(document.getElementById('scriptTag').getAttribute('songObjectList'));
	songObjectsList = songObjectsJSONList.map(songObject => JSON.parse(songObject));
}

export function getSongObjectsList(){
	return songObjectsList;
}

export function addToSongObjectsList(newSongObj){
	songObjectsList.unshift(newSongObj);
}

export function removeObjFromSongObjectsList(index){
	songObjectsList.splice(index, 1);
}