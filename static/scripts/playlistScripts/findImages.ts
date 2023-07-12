/* This file is used for general image stuff. Checking to see if an image exists or 
setting images. This file is should be refactored in the future. */

// This file will be removed in the next push, when the database is restructured.

import { IMG_PATHS, removeFileExtension, } from './../globals';


export async function getSongImage(songFileName: string): Promise<string> {
	const currentSongName = removeFileExtension(songFileName);
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