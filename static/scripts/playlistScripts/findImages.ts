/* This file is used for general image stuff. Checking to see if an image exists or 
setting images. This file is should be refactored in the future. */

import { IMG_PATHS, removeFileExtension, getImgElemByID, checkElemIsImgElem, } from './../globals';
import { table, getSongObjectByRowNum, } from './playlistGlobals'


export async function getSongImage(index: number): Promise<string> {
	const songObj = getSongObjectByRowNum(index);
	const currentSongName = removeFileExtension(songObj.fileName);
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
			return IMG_PATHS.noCoverImgSrc;
		}
		// last modification time prevents the browser from accessing cached data which is out of date
			// i.e. updated images that are updated are not accessed through the cache for the first time
		const lastModTime = data["lastModTime"];
		return `/static/media/songCovers/${songCoverFileName}?${lastModTime}`;
	})
	.catch(error => {
		console.error(
			`getSongImage received an error while searching for ${songCoverFileName}. 
			\n${error}
			\nProceeding as if no cover image exists.`
		);
		return IMG_PATHS.noCoverImgSrc;
	});
}


export async function setSongImageByRowNum(index: number): Promise<void> {
	const songImgSrc = await getSongImage(index);
	const elem = table.rows[index].firstElementChild.firstElementChild;
	const currentSongImg = checkElemIsImgElem(elem);
	currentSongImg.src = songImgSrc;
}


export async function fillPlaylistPreviewImages(): Promise<void> {
	const numOfPlaylistSongs = table.rows.length;
	let numOfFoundPreviewImages = 0;
	const maxNumOfPreviews = 4;

	for(let index = 0; index < numOfPlaylistSongs; index++){
		const currentCoverSrc = await getSongImage(index);
		if(currentCoverSrc !== IMG_PATHS.noCoverImgSrc){
			getImgElemByID(`cover-preview-${numOfFoundPreviewImages}`).src = currentCoverSrc;
			numOfFoundPreviewImages++;
		}
		if(numOfFoundPreviewImages === maxNumOfPreviews){
			return; 
		}
	}
	
	while(numOfFoundPreviewImages < maxNumOfPreviews){
		getImgElemByID(`cover-preview-${numOfFoundPreviewImages}`).src = IMG_PATHS.noCoverImgSrc;
		numOfFoundPreviewImages++;
	}
}


export function determineFooterPlayImgSrc(songIsPlaying: boolean): string {
	const footerImgElement = getImgElemByID("footer-play-img");
	const currSrc = footerImgElement.src;

	if(songIsPlaying){
		// the second condition here occurs when hovering over the main play button while a song is finishing
		if(currSrc === IMG_PATHS.lowerBarPlayHoverImgSrc || currSrc === IMG_PATHS.lowerBarPauseHoverImgSrc){
			return IMG_PATHS.lowerBarPauseHoverImgSrc;
		}
		return IMG_PATHS.lowerBarPauseImgSrc;
	}
	if(currSrc === IMG_PATHS.lowerBarPauseHoverImgSrc){
		return IMG_PATHS.lowerBarPlayHoverImgSrc;
	}
	return IMG_PATHS.globalPlayImgSrc;
}