// The purpose of this file is to provide global constants and functions to be used in multiple other files.


class TypeError extends Error{
	constructor(msg: string){
		super(msg);
	}
}


// this function has to exist because React decided to just up and change rendering to root.render
// this is a solution to hide the warning that comes with using ReactDOM.render
// this will no longer be needed once I leave React forever and go to something else.
/** This const is only to be used with in the console.error suppress warning function. */
const backup = console.error;
console.error = function filterWarnings(msg: string) {
  const supressedWarnings = ["ReactDOM.render is no longer supported in React 18.",];

  if (!supressedWarnings.some(entry => msg.includes(entry))) {
    backup.apply(console, arguments);
  }
};


export const isHomePage = _isHomePage();
export const isPlaylistPage = _isPlaylistPage();

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
	throw new TypeError(`Failed to retrieve input elem with ID: "${ID}". `
		+ `Retrieved elem has typeof: ${typeof elem}`);
}

// This function is never used, replace it with a func like getSpanElemByID
export function getTextElemByID(ID: string): HTMLTextAreaElement {
	const elem = document.getElementById(ID);
	if(elem instanceof HTMLTextAreaElement){
		return elem;
	}
	throw new TypeError(
		`Failed to retrieve Text Element with ID: "${ID}". Element is of type "${elem}"`
		);
}

export function getImgElemFromEventTarget(target: EventTarget): HTMLImageElement {
	if(target instanceof HTMLImageElement){
		return target;
	}
	throw new TypeError(
		`The given event target is not an image! Given event target: ${target}`
	);
}

export function checkElemIsCellElem(elem: any): HTMLTableCellElement {
	if(elem instanceof HTMLTableCellElement){
		return elem;
	}
	throw new TypeError(
		`The given item is not an instance of a HTMLTableCellElement. Given item: ${elem}`
	);
}

export function checkElemIsSpanElem(elem: any): HTMLSpanElement {
	if(elem instanceof HTMLSpanElement){
		return elem;
	}
	throw new TypeError(
		`The given item is not an instance of a HTMLSpanElement. Given item: ${elem}`
	);
}

export function checkElemIsDivElem(elem: any): HTMLDivElement {
	if(elem instanceof HTMLDivElement){
		return elem;
	}
	throw new TypeError(
		`The given item is not an instance of a HTMLDivElement. Given item: ${elem}`
	);
}

export function checkElemIsImgElem(elem: any): HTMLImageElement {
	if(elem instanceof HTMLImageElement){
		return elem;
	}
	throw new TypeError(
		`The given item is not an instance of a HTMLImageElement. Given item: ${elem}`
	);
}


export function checkElemIsButtonElem(elem: any): HTMLButtonElement {
	if(elem instanceof HTMLButtonElement){
		return elem;
	}
	throw new TypeError(
		`The given item is not an instance of a HTMLImageElement. Given item: ${elem}`
	);
}


/* # ------------------------------------------- End of Type Getters ------------------------------------------- */

export function _isPlaylistPage(): boolean {
	/** On a playlist page the pathArr should be
	 * ["", "playlists", "<playlist_name>] */
	const pathArr = window.location.pathname.split("/");

	if(pathArr[1] === "playlists"){
		return true;
	}
	return false;
}


export function _isHomePage(): boolean {
	/** The home page path Arr should be ["", "home", ""] */
	const pathArr = window.location.pathname.split("/");

	if(pathArr[1] === "home"){
		return true;
	}
	return false;
}