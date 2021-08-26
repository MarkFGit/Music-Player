export default function dragOverHandler(e){
	e.preventDefault();
}

export async function fileDropHandler(e){
	e.preventDefault();
	if(e.dataTransfer.items){
		for(let index = 0; index < e.dataTransfer.items.length; index++){
			const currentFile = e.dataTransfer.items[index];
			if(currentFile.kind !== 'file'){
				continue;
			}

			const form = new FormData();
			const file = currentFile.getAsFile();

			if(isNotAcceptedFileUploadType(file.type)) continue;

			form.append("file", file);
			form.append("name", file.name);

			const xhr = new XMLHttpRequest();
			xhr.open("POST", '/lastAdded', true);
			xhr.send(form);
			
			xhr.onreadystatechange = () => { reloadOnXhrReady(xhr); };
		}
	}
}


function isNotAcceptedFileUploadType(fileType){
	const allowedFileTypes = ["audio/mpeg", "audio/x-m4a"];

	if(allowedFileTypes.includes(fileType)){
		return false;
	}
	return true;
}


function reloadOnXhrReady(xhr){
	const xhrIsDone = (xhr.readyState === 4);
	if(xhrIsDone){
		if(xhr.status === 200) return window.location.reload();
		console.error(`Failed to add song. Failed with XHR status: ${xhr.status}`);
	}
}



export function incrementPlayCount(currentSongObject){
	const form = new FormData();
	form.append("songName", currentSongObject.songFileName);

	const xhr = new XMLHttpRequest();
	xhr.onreadystatechange = () => {
		if(xhr.readyState === 4 && xhr.status === 200){
			const currentPlayNum = parseInt(currentSongObject.songPlays.innerText);
			currentSongObject.songPlays.innerText =  currentPlayNum + 1;
		}	
	};
	xhr.open("POST", '/updatePlays', true);
	xhr.send(form);


}


export async function createNewPlaylistToServer(playlistName){
	const form = new FormData();
	form.append("playlistName", playlistName);

	const xhr = new XMLHttpRequest();

	const isHomePage = (document.getElementById('playlistGrid') !== null);
	if(isHomePage){
		var homePageScript = await require('./homePageScript.js');
		xhr.onreadystatechange = () => {
			if(xhr.readyState === 4 && xhr.status === 200){
				homePageScript.createPlaylistGrid();
			}
		};
	}

	xhr.open("POST", '/createPlaylist', true);
	xhr.send(form);
}


export function getPlaylistNamesFromDB(resolve){
	const xhr = new XMLHttpRequest();
	xhr.onreadystatechange = () => {
		if(xhr.readyState === 4 && xhr.status === 200){
			resolve(JSON.parse(xhr.response));
		}
	};
	xhr.open("POST", '/getPlaylists', true);
	xhr.send();
}

export async function resolvePlaylistNames(){
	const playlistPromise = new Promise(resolve => {
		getPlaylistNamesFromDB(resolve);
	});

	const data = await playlistPromise;
	return data["PlaylistNames"];
}