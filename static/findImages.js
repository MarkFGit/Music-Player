import {removeFileExtension, getSongObjectsList} from './globals.js';

const iconFolderPath = 'http://127.0.0.1:5000/static/media/icons/';
const staticFolderURL = 'http://127.0.0.1:5000/static';

const lowerBarPauseImgSrc = `${iconFolderPath}pause.png`;
const lowerBarPauseHoverImgSrc = `${iconFolderPath}pauseHover.png`;
const lowerBarPlayImgSrc = `${iconFolderPath}play.png`;
const lowerBarPlayHoverImgSrc = `${iconFolderPath}playHover.png`;
const noCoverImgSrc = `${iconFolderPath}noCoverImg.png`;

const table = document.getElementById("songTable");

export async function getSongImage(index){
	const songObjectsList = getSongObjectsList();
	const currentSongName = removeFileExtension(songObjectsList[index]['fileName']);
	const songCoverFileName = `${currentSongName}.jpeg`;

	return await fetch(
		'/findImage',
		{
	    	method: 'POST',
	    	body: songCoverFileName
		}
	)
	.then(response => {	
		if(response.statusText === "OK"){
			return `/static/media/songCovers/${songCoverFileName}`;
		}
		return noCoverImgSrc;
	})
	.catch(error => {
		console.error(`getSongImage received an error while trying to access ${songCoverFileName}. ${error}`);
	});
}


export default async function setSongImage(index){
	const songImgSrc = await getSongImage(index);
	const currentSongImg = table.rows[index].firstElementChild.firstElementChild;
	currentSongImg.setAttribute('src', songImgSrc);
}


export async function fillPlaylistPreviewImages(){
	const numOfPlaylistSongs = table.rows.length;
	let numOfFoundPreviewImages = 0;
	const maxNumOfPreviews = 4;

	for(let index = 0; index < numOfPlaylistSongs; index++){
		const currentCoverSrc = await getSongImage(index);
		if(currentCoverSrc !== noCoverImgSrc){
			document.getElementById(`coverPreview${numOfFoundPreviewImages}`).src = currentCoverSrc;
			numOfFoundPreviewImages++;
		}
		if(numOfFoundPreviewImages === maxNumOfPreviews){
			return;
		}
	}
	
	while(numOfFoundPreviewImages < maxNumOfPreviews){
		document.getElementById(`coverPreview${numOfFoundPreviewImages}`).src = noCoverImgSrc;
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