document.getElementById('newPlaylistButton').addEventListener('click', () => {
	document.getElementById('addPlaylistBoxContainer').style.height = '100vh';
	ReactDOM.render(
		<div className="playlistBox" id="playlistBox"> 
			<div style={{ width: "100%", fontSize: "large" }}> Create New Playlist </div>
			<input id="createPlaylistTextbox" type="text" />
			<button 
				className="positiveButtonClass" 
				onClick={ () => {createNewPlaylistInDatabase()} }> 
				Add Playlist 
			</button>
			<button 
				className="negativeButtonClass" 
				onClick={ () => {removeAddPlaylistMenu()} }> 
				Cancel 
			</button>
		</div>,
		document.getElementById('addPlaylistBoxContainer')
	);

	document.addEventListener('keydown', function escPlaylistmenu(e){
		if(e.key === 'Escape'){
			removeAddPlaylistMenu(); 
			document.removeEventListener('keydown', escPlaylistmenu)
		}
	});
});


function createNewPlaylistInDatabase(){
	const textBox = document.getElementById("createPlaylistTextbox");
	console.log(`im going create a new playlist in the DB named '${textBox.value}'`);
	textBox.value = '';
	removeAddPlaylistMenu();
}


function removeAddPlaylistMenu(){
	ReactDOM.unmountComponentAtNode(addPlaylistBoxContainer);
	document.getElementById('addPlaylistBoxContainer').style.height = '0';
}
