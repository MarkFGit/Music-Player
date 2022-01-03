export function getPlaylistName(){
	return document.getElementById('scriptTag').getAttribute('playlistName');
}

export function removeFileExtension(fileName){
	return fileName.slice(0, fileName.lastIndexOf("."));
}