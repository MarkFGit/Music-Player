// The purpose of this file is to provide global constants and functions to be used in multiple other files.


class TypeError extends Error{
	constructor(msg: string){
		super(msg);
	}
}


/** This const is only to be used with in the console.error suppress warning function. */
const backup = console.error;
console.error = function filterWarnings(msg: string) {
  const supressedWarnings = ["ReactDOM.render is no longer supported in React 18.",];  

  if (!supressedWarnings.some(entry => msg.includes(entry))) {
    backup.apply(console, arguments);
  }
};


// The home page path Arr should be ["", "home", ""]
export const isHomePage = window.location.pathname.split("/")[1] === "home" ? true : false;

// On a playlist page the pathArr should be ["", "playlists", "<playlist_name>]
export const isPlaylistPage = window.location.pathname.split("/")[1] === "playlists" ? true : false;

const staticFolderPath = `${window.location.origin}/static`;
const iconFolderPath = `${staticFolderPath}/media/icons/`;


export const PAGE_PROPERTIES = Object.freeze({
	websiteOrigin: window.location.origin,
	staticFolderURL: `${window.location.origin}/static`,
	iconFolderPath: `${staticFolderPath}/media/icons/`,
});


/** This contains all paths for static images used around the website. */
export const IMG_PATHS = Object.freeze({
	/** Used for song images in rows in which the song has no cover image */
	noCoverImgSrc: `${iconFolderPath}noCoverImg.png`,
	globalPlayingGifSrc: `${iconFolderPath}playing.gif`,

	lowerBarPauseImgSrc: `${iconFolderPath}pause.png`,
	lowerBarPauseHoverImgSrc: `${iconFolderPath}pauseHover.png`,
	globalPlayImgSrc: `${iconFolderPath}play.png`,
	lowerBarPlayHoverImgSrc: `${iconFolderPath}playHover.png`,
	
	playlistCardOptionHover: `${iconFolderPath}optionsHover.png`,
	playlistCardOption: `${iconFolderPath}options.png`,
});




export function removeFileExtension(fileName: string): string {
	return fileName.slice(0, fileName.lastIndexOf("."));
}


/** Adds the ability to exit a screen prompt by pressing the escape key. 
 * @param removeCurrentPromptFunc - Invoked when the escape key is pressed which in turn removes the current prompt.
 * Examples include: Exiting a screen prompt which prevents you from doing anything else from the page.
 * Or, in the future, when typing in the search bar removes the drop down. */
export function addEscapeFeature(removeCurrentPromptFunc: Function){
	document.addEventListener('keydown', function escScreenPrompt(e){
		if(e.key === 'Escape'){
			removeCurrentPromptFunc(); 
			document.removeEventListener('keydown', escScreenPrompt);
		}
	});
}


/* # ------------------------------------------- Type Getters ------------------------------------------- */
/* -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * Type Getters: These functions are designed in such a way that 
 * the specified type MUST be returned. Otherwise an exception is raised.  
** -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+ **/

export function getImgElemByID(ID: string): HTMLImageElement {
	const elem = document.getElementById(ID);
	if(elem instanceof HTMLImageElement){
		return elem;
	}
	throw new TypeError(`Failed to retrieve Image Element with ID: '${ID}'`);
}

export function getInputElemByID(ID: string): HTMLInputElement {
	const elem = document.getElementById(ID);
	if(elem instanceof HTMLInputElement){
		return elem;
	}
	throw new TypeError(`Failed to retrieve input elem with ID: "${ID}". Retrieved elem has typeof: ${typeof elem}`);
}

// This function is never used, replace it with a func like getSpanElemByID
export function getTextElemByID(ID: string): HTMLTextAreaElement {
	const elem = document.getElementById(ID);
	if(elem instanceof HTMLTextAreaElement){
		return elem;
	}
	throw new TypeError(`Failed to retrieve Text Element with ID: "${ID}". Element is of type "${elem}"`);
}


export function getSpanElemByID(ID: string): HTMLSpanElement {
	const elem = document.getElementById(ID);
	if(elem instanceof HTMLSpanElement){
		return elem;
	}
	throw new TypeError(`Failed to retrieve Span Element with ID: "${ID}". Instead, element is of type "${elem}"`);
}


export function getDivElemByID(ID: string): HTMLDivElement {
	const elem = document.getElementById(ID);
	if(elem instanceof HTMLDivElement){
		return elem;
	}
	throw new TypeError(`Failed to retrieve Div Element with ID: "${ID}". Instead, element is of type "${elem}"`);
}


/* # ------------------------------------------- End of Type Getters ------------------------------------------- */