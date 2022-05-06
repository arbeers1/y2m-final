function add_to_playlist(retrieval_code){
    let params_index = retrieval_code.indexOf('?t=');
    let index = parseInt(retrieval_code.substring(1,params_index));
    let row;
    let thumbnail;
    let song;
    let artist;
    let playlist;
    if(retrieval_code.substring(0,1) === 's'){
        row = document.getElementById('search-songs').rows[index];
        const song_cells = row.cells;
        thumbnail = song_cells[1].firstChild.getAttribute('src');
        const label = song_cells[2].firstChild;
        song = label.firstChild.textContent;
        artist = label.textContent.replace(label.firstChild.textContent, '');
        playlist = document.getElementById('playlist-selector').value;
    }else if(retrieval_code.substring(0,1) === 'p'){
        row = document.getElementById('playlist-table').rows[index];
        const song_cells = row.cells;
        thumbnail = song_cells[2].firstChild.getAttribute('src');
        const label = song_cells[3].firstChild;
        song = label.firstChild.textContent;
        artist = label.textContent.replace(label.firstChild.textContent, '');
        playlist = document.getElementById('playlist-selector').value;
    }

    let playlist_songs;
    if(retrieval_code.substring(params_index + 3) == 'liked-songs'){
        playlist_songs = library.saved.songs;
    }else{
        playlist_songs = library.playlists[playlist].songs;
    }

    playlist_songs.push({
        "name": song,
        "id": row.getAttribute('name'),
        "channel": artist,
        "thumbnail": thumbnail,
        "url": "t",
        "file": null
    });

    if(playlist == '' && context.id == 'liked-songs'){
        build_playlist(Number.MAX_SAFE_INTEGER);
    }else if(playlist == document.getElementById('playlist-title').value && playlist != ''){
        build_playlist(playlist);
    }
    //todo if context = search build search results over
    save();
}

function create_playlist(){
    let name = document.getElementById('create-playlist-name').value;
    
    if(!library.playlists.hasOwnProperty(name)){
        library.playlists[name] = {
            'songs': []
        }
    }

    set_playlists();
    save();
}

function remove_from_playlist(removal_code){
    let playlist = document.getElementById('playlist-title').value;
    let params_index = removal_code.indexOf('?t=');
    let index = removal_code.substring(1,params_index);
    library.playlists[playlist].songs.splice(index, 1);
    build_playlist(playlist);
    save();
}

function like(retrieval_code){
    let params_index = retrieval_code.indexOf('?t=');
    let index = parseInt(retrieval_code.substring(1,params_index));
    let row;
    if(retrieval_code.substring(0,1) === 's'){
        row = document.getElementById('search-songs').rows[index];
    }else if(retrieval_code.substring(0,1) === 'p'){
        row = document.getElementById('playlist-table').rows[index];
    }
    let id = row.getAttribute('name');

    if(!library.saved.liked_id.hasOwnProperty(id) || library.saved.liked_id[id] == false){
        library.saved.liked_id[id] = true;
        add_to_playlist(retrieval_code);
    }else{
        delete library.saved.liked_id[id];
        for(var i = 0; i < library.saved.songs.length; i++){
            if(library.saved.songs[i].id == id){
                library.saved.songs.splice(i, 1);
                break;
            }
        }

        if(document.getElementById('playlist-title').value == 'Liked Songs'){
            build_playlist(Number.MAX_SAFE_INTEGER);
        }
    }

    set_likes();
    save();
}

function delete_playlist(){
    let playlist = document.getElementById('playlist-title').value;
    console.log(playlist);
    delete library.playlists[playlist];
    set_context(document.getElementById('search-menu'));
    set_playlists();
    save();
}

function update_playlist(){
    if(!library.playlists.hasOwnProperty(title.value)){
        let name = title.getAttribute('name');
        library.playlists[title.value] = library.playlists[name];
        delete library.playlists[name];
        set_playlists();
        save();
    }
}

function save(){
    fs.writeFile(__dirname + '\\library\\lib.json', JSON.stringify(library, null, 4), (err) => {
        if(err) console.log(err);
    })
}