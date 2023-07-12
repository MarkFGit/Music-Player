import * as React from 'react';

import { renderSongOptionsDropDown, SongOptionsDropDown, } from "./songOptions";
import { getRowIndexByEventTarget, toggleSongPlay, revertRow, playNewSong, setToCoverImg, setToPlayingGif, } from "./playlist";
import { isLastAddedPlaylist, audio, currentRow, currentNonPriorityRow, } from './playlistGlobals';
import { playlistSongs, } from "./songs";

/** Used when initalizing the playlist table or when adding a new song. */
export function RowContent({ rowIndex }: { rowIndex: number; }): JSX.Element {
    const song = playlistSongs.getSong(rowIndex);
    // The "date" class allows the updating of the duration text. This class is not used in the css!
    const dateField = <span className="date-field-container date"> {song.date} </span>;

    setToCoverImg(rowIndex);

    return (
        <td className="song-container">
            <img className="row-img" onClick={songImgEventListener}/>
            {/* The "title" class allows the updating of the title text. This class is not used in the css! */}
            <span className="large-field-container title"> {song.title} </span>
            <button
                className="row-add-playlist-button"
                onClick={e => renderSongOptionsDropDown(<SongOptionsDropDown e={e} />)}
            >
                +
            </button>
            {/* The "duration" class allows the updating of the duration text. This class is not used in the css! */}
            <span className="generic-attrs duration"> {song.duration} </span>
            {/* The "artist" class allows the updating of the artist text. This class is not used in the css! */}
            <span className="medium-field-container artist"> {song.artist} </span>
            {/* The "album" class allows the updating of the album text. This class is not used in the css! */}
            <span className="medium-field-container album"> {song.album} </span>
            {/* The "plays" class allows the updating of the plays text. This class is not used in the css! */}
            <span className="small-field-container plays"> {song.plays} </span>
            {isLastAddedPlaylist ? dateField : null}
        </td>
    );
}

function songImgEventListener(e: React.SyntheticEvent){
    const rowIndex = getRowIndexByEventTarget(e.target);
    const song = playlistSongs.getSong(rowIndex);

    if(song.isThisSongCurrent){
        toggleSongPlay();
        // This is a case where we need to determine if the audio is playing or not
        if(audio.paused){
            setToCoverImg(currentRow.getIndex());
        }
        else{
            setToPlayingGif(currentRow.getIndex());
        }
        return;
    }

    if(currentRow.getIndex() !== null){
        revertRow(currentRow.getIndex());
    }

    currentNonPriorityRow.set(rowIndex);
    playNewSong(rowIndex);
    setToPlayingGif(currentRow.getIndex());
}