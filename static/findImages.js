import {removeFileExtension} from '/static/script.js'


const iconFolderPath = 'http://127.0.0.1:5000/static/media/icons/';
const lowerBarPauseImgSrc = `${iconFolderPath}pausePixil.png`;
const lowerBarPauseHoverImgSrc = `${iconFolderPath}pausePixilHover.png`;
const lowerBarPlayImgSrc = `${iconFolderPath}playPixil.png`;
const lowerBarPlayHoverImgSrc = `${iconFolderPath}playPixilHover.png`;
const blankPlayImgSrc = `${iconFolderPath}play.png`;


const table = document.getElementById("songTable");

export default async function getSongImage(index){
	const songNamesList = JSON.parse(document.getElementById('scriptTag').getAttribute('songNames'));

	const currentSongName = removeFileExtension(songNamesList[index]);
	const songCoverPath = `static/media/songCovers/${currentSongName}.jpeg`;

	return await fetch(songCoverPath)
		.then(response => {
			const currentSongImg = table.rows[index].firstElementChild.firstElementChild;
			if (response.ok) {
				currentSongImg.setAttribute('src', songCoverPath);
				return songCoverPath;
			}
			if(response.status === 404) {
				currentSongImg.setAttribute('src', blankPlayImgSrc);
			    return;
			}
			console.log(`Find Image Error. Status of Error: %c${response.status}`,"color: red");
			return;
		})
	  	.catch(error => console.log('error is', error));
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