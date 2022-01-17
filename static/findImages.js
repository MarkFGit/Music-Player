import {removeFileExtension, getSongObjectsList} from './globals.js';

const iconFolderPath = 'http://127.0.0.1:5000/static/media/icons/';
const URLforStaticFolder = 'http://127.0.0.1:5000/static';

const lowerBarPauseImgSrc = `${iconFolderPath}pause.png`;
const lowerBarPauseHoverImgSrc = `${iconFolderPath}pauseHover.png`;
const lowerBarPlayImgSrc = `${iconFolderPath}play.png`;
const lowerBarPlayHoverImgSrc = `${iconFolderPath}playHover.png`;
const noCoverImgSrc = `${iconFolderPath}noCoverImg.png`;

const table = document.getElementById("songTable");
const songObjectsList = getSongObjectsList();

export default async function getSongImage(index){
	const currentSongName = removeFileExtension(songObjectsList[index]['fileName']);
	const songCoverFileName = `${currentSongName}.jpeg`;

	const findImgUrl = 'http://127.0.0.1:5000/findImage';
	return await fetch(findImgUrl,{
	    method: 'POST',
	    body: songCoverFileName
	})
	.then(response => {
		const currentSongImg = table.rows[index].firstElementChild.firstElementChild;
		if(response.statusText === "OK"){
			const coverFilePathInServer = `/static/media/songCovers/${songCoverFileName}`;
			currentSongImg.setAttribute('src', coverFilePathInServer);
			return coverFilePathInServer;
		}
		currentSongImg.setAttribute('src', noCoverImgSrc);
		return;
	})
	.catch(error => {
		console.error(`Find Image Error. Status of Error: ${response.status}`);
	});
}


export async function fillPlaylistPreviewImages(){
	const numOfPlaylistSongs = document.getElementById('scriptTag').getAttribute('numOfSongs');
	let numOfFoundPreviewImages = 0;
	const maxNumOfPreviews = 4;

	for(let index = 0; index < numOfPlaylistSongs; index++){
		const currentCoverSrc = await getSongImage(index);
		if(currentCoverSrc !== undefined){
			document.getElementById(`coverPreview${numOfFoundPreviewImages}`).src = currentCoverSrc;
			numOfFoundPreviewImages++;
		}
		if(numOfFoundPreviewImages === maxNumOfPreviews){
			return;
		}
	}
	
	while(numOfFoundPreviewImages < maxNumOfPreviews){
		document.getElementById(`coverPreview${numOfFoundPreviewImages}`).src = blankPlayImgSrc;
		numOfFoundPreviewImages++;
	}
}


export function determineFooterPlayImgSrc(songIsPlaying){
	const footerImgElement = document.getElementById('footerPlayImg');
	if(songIsPlaying){
		if(footerImgElement.src === lowerBarPlayHoverImgSrc) return lowerBarPauseHoverImgSrc;
		return lowerBarPauseImgSrc;
	}
	if(footerImgElement.src === lowerBarPauseHoverImgSrc) return lowerBarPlayHoverImgSrc;
	return lowerBarPlayImgSrc;
}