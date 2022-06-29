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
	songObjectsList = JSON.parse(document.getElementById('scriptTag').getAttribute('songObjectList'));
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


export function getImgByRow(songRow){
	const table = document.getElementById("songTable");
	return table.rows[songRow].firstElementChild.firstElementChild;
}


export function getSongObjectBySongRow(songRow){
	const table = document.getElementById("songTable");
	const currentRow = table.rows[songRow];
	const imgForRow = currentRow.firstElementChild.firstElementChild;
	const songObject = Object.values(imgForRow)[1]['getsongobject'];
	return songObject;
}


export function replaceObjInSongObjList(newSongObj, index){
	songObjectsList[index] = newSongObj;
}