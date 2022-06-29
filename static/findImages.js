import {removeFileExtension, getSongObjectsList} from './globals.js';

const iconFolderPath = `${window.location.origin}/static/media/icons/`;
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

	return fetch(
		'/findImage',
		{
	    	method: 'POST',
	    	body: songCoverFileName
		}
	)
	.then(response => {
		if(response.ok){
			return response.json();
		}
		throw new Error(`Response from server failed with status ${response.status}.`);
	})
	.then(data => {
		if(data["imageFound"] === false){
			return noCoverImgSrc;
		}
		// last modification time prevents the browser from accessing cached data which is out of date
			// i.e. updated images that are updated are not accessed through the cache for the first time
		const lastModTime = data["lastModTime"];
		return `/static/media/songCovers/${songCoverFileName}?${lastModTime}`;
	})
	.catch(error => {
		console.error(
			`getSongImage received an error while trying to access ${songCoverFileName}. 
			\n${error}
			\nProceeding as if no cover image exists.`
		);
		return noCoverImgSrc;
	});
}


export default async function setSongImage(index){
	const songImgSrc = await getSongImage(index);
	const currentSongImg = table.rows[index].firstElementChild.firstElementChild;
	currentSongImg.setAttribute('src', songImgSrc);
}


export async function setSongImageByElem(elem, index){
	const songImgSrc = await getSongImage(index);
	elem.setAttribute('src', songImgSrc);
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