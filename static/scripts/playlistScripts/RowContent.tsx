import * as React from 'react';

import { setSongImageByRowNum, } from './findImages';
import { isLastAddedPlaylist, getSongObjectByRowNum, } from './playlistGlobals';
import { renderSongOptionsDropDown, SongOptionsDropDown, } from "./songOptions";
import { songImgEventListener, } from "./basicSongOperations";

/** Used when initalizing the playlist table or when adding a new song. */
export function RowContent({ rowNum }: { rowNum: number; }): JSX.Element {
    const song = getSongObjectByRowNum(rowNum);
    const dateField = <span className="date-field-container"> {song.date} </span>;

    setSongImageByRowNum(rowNum);

    return (
        <td className="song-container">
            <img
                className="row-img"
                onClick={songImgEventListener}
            >
            </img>
            <span className="large-field-container"> {song.title} </span>
            <button
                className="row-add-playlist-button"
                onClick={e => renderSongOptionsDropDown(<SongOptionsDropDown e={e} />)}
            >
                +
            </button>
            <span className="generic-attrs"> {song.duration} </span>
            <span className="medium-field-container"> {song.artist} </span>
            <span className="medium-field-container"> {song.album} </span>
            {/* The "plays" class allows the updating of the plays text. This class is not used in the css! */}
            <span className="small-field-container plays"> {song.plays} </span>
            {isLastAddedPlaylist ? dateField : null}
        </td>
    );
}