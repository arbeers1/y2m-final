var mediaNavigator;
var menuNavigator;
var mediaControllerContainer;
var options_menu;
var options_vis = false;
var search_song_table;
var search_art_table;
var context = null;
var cell_playing = null;
var context_playing = null;
var build_queue_switch = false;
var queue_menu;
var title;

window.onresize = function(){
    try{
        mediaNavigator.style.height = (window.innerHeight - mediaControllerContainer.offsetHeight).toString() + 'px';
        mediaNavigator.style.width = (window.innerWidth - menuNavigator.offsetWidth).toString() + 'px';
    }catch(error){}
}

document.addEventListener("DOMContentLoaded", function(){
    mediaNavigator = document.getElementById('media-navigator');
    menuNavigator = document.getElementById('menu-navigator');
    mediaControllerContainer = document.getElementById('media-controller-container');
    options_menu = document.getElementById('options-menu');
    search_song_table = document.getElementById('search-songs');
    search_art_table = document.getElementById('search-artists');
    queue_menu = document.getElementById('queue-main');
    title = document.getElementById('playlist-title');

    mediaNavigator.style.height = (window.innerHeight - mediaControllerContainer.offsetHeight).toString() + 'px';
    mediaNavigator.style.width = (window.innerWidth - menuNavigator.offsetWidth).toString() + 'px';

    set_context(document.getElementById('search-menu'));
    set_playlists();

    document.getElementById('create-playlist-name').onkeydown = function(e){
        if(e.keyCode == 13){
            show_playlist_builder();
            create_playlist();
        }
    }

    title.onkeydown = function(e) {
        if(e.keyCode == 13){
            title.readOnly = true;
            update_playlist();
            title.blur();
        }
    }
});

window.addEventListener('click', function(event) {

    if(options_vis == true && event.target.getAttribute('class') != 'ot icon'){
        options_vis = false;
        options_menu.setAttribute('style', 'visibility:hidden');
    }

    let id = event.target.id;
    if(document.getElementById('create-playlist').style.visibility == 'visible' && id != 'create' && id !='create-playlist' && id != 'create-playlist-name'){
        document.getElementById('create-playlist').style.visibility = 'hidden';
    }

    if(this.document.getElementById('confirm-delete').style.visibility == 'visible' && id != 'delete-playlist' && id != 'confirm-delete' && id != 'delete-label'){
        document.getElementById('confirm-delete').style.visibility = 'hidden';
    }
});

function display_search_results(vids){
    clear_search_results();

    const rows = search_song_table.rows;
    const a_row = search_art_table.rows[0];
    let offset = 0;
    let a_index = 0;

    const titles = document.querySelectorAll('.search-title');
    for(var i = 0; i < titles.length; i++){ titles[i].style.visibility = "visible"; }

    for(var i = 0; i < vids.length; i++){
        if(vids[i].type == 'youtube#video'){
            rows[i + offset].setAttribute('name', vids[i].id);
            rows[i + offset].style.visibility = "visible";
            document.getElementById(`ot${i + offset}`).setAttribute('name', `s${i + offset}?t=null`);

            let img = document.getElementById(`i-s${i+offset}`);
            if(vids[i].thumbnail != null){ img.src = vids[i].thumbnail; }

            let label = document.getElementById(`l-s${i+offset}`);
            label.innerHTML = vids[i].title + '</br><span class="font" style="color:grey;font-size:small;margin-left:50px">' + vids[i].channel + "</span>";

        }else if(vids[i].type == 'youtube#channel'){
            offset -= 1;
            const col = a_row.cells[a_index];
            col.style.visibility = "visible";
            col.name = vids[i].channel_id;

            let img = document.getElementById(`i-a${a_index}`);
            if(vids[i].thumbnail != null){ img.src = vids[i].thumbnail; }

            let label = document.getElementById(`l-a${a_index}`);
            label.innerHTML = vids[i].channel;

            a_index++;
        }
    }

    set_likes();
    update_play_ui(true, null);
    highlight_row();
}

function clear_search_results(){
    document.getElementById('search').value = ''

    const titles = document.querySelectorAll('.search-title');
    for(var i = 0; i < titles.length; i++){ titles[i].style.visibility = "hidden"; }

    for(var i = 0; i < search_song_table.rows.length; i++){
        search_song_table.rows[i].style.visibility = 'hidden';
    }
    for(var i = 0; i < search_art_table.rows[0].cells.length; i++){
        search_art_table.rows[0].cells[i].style.visibility = 'hidden';
    }
}

function set_context(menu){
    if(menu === 'queue'){
        document.getElementById('playlist-main').style.visibility = 'hidden';
        document.getElementById('search-main').style.visibility = 'hidden';
        document.getElementById('delete-playlist').style.visibility = 'hidden';
        document.getElementById('edit-playlist').style.visibility = 'hidden';
        clear_search_results();
        return;
    }else{
        build_queue_switch = false;
        queue_menu.style.visibility = 'hidden';
    }

    if(context != null){
        context.style.color = '#e2e2e2';
        if(context.getAttribute('name') == 'playlist'){
            document.getElementById('playlist-main').style.visibility = 'hidden';
        }else if(context.getAttribute('name') == 'search'){
            clear_search_results();
            document.getElementById('search-main').style.visibility = 'hidden';
        }
    }
    context = menu;
    context.style.color = '#bb86fc';

    if(context.getAttribute('name') == 'playlist'){
        if(context.id == 'liked-songs'){
            build_playlist(Number.MAX_SAFE_INTEGER);
        }else{
            build_playlist(context.innerHTML);
        }
        
        document.getElementById('playlist-main').style.visibility = 'visible';
    }else if(context.getAttribute('name') == 'search'){
        clear_search_results();
        document.getElementById('delete-playlist').style.visibility = 'hidden';
        document.getElementById('edit-playlist').style.visibility = 'hidden';
        document.getElementById('search-main').style.visibility = 'visible';
    }
}

function set_playlists(){
    let playlist_container = document.getElementById('playlist-container');
    playlist_container.innerHTML = '';
    
    for(playlist in library.playlists){
        label = document.createElement('label');
        label.setAttribute('class', 'menu-options font');
        label.innerHTML = playlist;
        label.setAttribute('onclick', 'set_context(this)');
        label.setAttribute('name', 'playlist');
        playlist_container.appendChild(label);
    }
}

function build_playlist(name){
    let table = document.getElementById("playlist-table");
    table.innerHTML = "";

    //console.log(name)
    let playlist_songs;
    if(name == Number.MAX_SAFE_INTEGER){ //MAX INT = BUILT-IN Liked Songs Playlist
        playlist_songs = library.saved.songs;
        name = 'Liked Songs';
        document.getElementById('delete-playlist').style.visibility = 'hidden';
        document.getElementById('edit-playlist').style.visibility = 'hidden';
    }else if(context.getAttribute('name') != 'search'){
        playlist_songs = library.playlists[name].songs;
        document.getElementById('delete-playlist').style.visibility = 'visible';
        document.getElementById('edit-playlist').style.visibility = 'visible';
    }else{
        return;
    }
    document.getElementById('playlist-title').value = name;
    document.getElementById('delete-playlist').setAttribute('name', name);

    for(var i = 0; i < playlist_songs.length; i++){
        let row = document.createElement('tr');
        row.setAttribute('class', 'play-row');
        row.setAttribute('name', playlist_songs[i].id);

        let col0 = document.createElement('td');
        col0.innerHTML = '<button class="icon"></button>';
        col0.setAttribute('onclick', `play_from_row(document.getElementById('playlist-table').rows[${i}]);`);
        
        let col1 = document.createElement('td');
        col1.innerHTML = '#' + (i + 1);
        col1.setAttribute('class', 'font');

        let col2 = document.createElement('td');
        col2.innerHTML = `<img class="thumb" src="${playlist_songs[i].thumbnail}" />`;
        col2.setAttribute('style', 'width:5%;');

        let col3 = document.createElement('td');
        col3.setAttribute('class', 'font');
        col3.setAttribute('style', 'overflow:hidden;width:75%')
        col3.innerHTML = `<label class="font" style="padding-left:50px;white-space:nowrap;overflow-x:hidden">${playlist_songs[i].name}</br><span class="font" style="color:grey;font-size:small;margin-left:50px">${playlist_songs[i].channel}</span></label>`

        let col4 = document.createElement('td');
        col4.innerHTML = `<button class="icon" onclick="like('p${i}?t=liked-songs')"></button>`;

        let col5 = document.createElement('td');
        col5.innerHTML = `<button class="ot icon" name="p${i}?t=null" onclick="options(this)"></button>`;
        col5.setAttribute('style', 'width:10%');

        row.appendChild(col1);
        row.appendChild(col0);
        row.appendChild(col2);
        row.appendChild(col3);
        row.appendChild(col4);
        row.appendChild(col5);
        table.appendChild(row);
    }

    if(song != null){
        highlight_row();
    }
    set_likes();
    update_play_ui(true, null);
}

function options(button){
    let bounds = button.getBoundingClientRect();
    let opt_bounds = options_menu.getBoundingClientRect()

    if(options_vis && opt_bounds.x == bounds.x - opt_bounds.width + bounds.width && opt_bounds.y == bounds.y + button.offsetHeight){ 
        options_menu.style.visibility = 'hidden'; 
        options_vis = false;
        return;
    }

    let options = document.querySelectorAll('.option');
    for(var i = 0; i < options.length; i++){
        options[i].setAttribute('name', button.getAttribute('name'));
        if(i == 3 && (context.getAttribute('name') == 'search' || queue_menu.style.visibility == 'visible')){
            options[i].style.height = '0px';
            options[i].style.paddingTop = '0px';
            options[i].style.paddingBottom = '0px';
        }else if(i == 2 && queue_menu.style.visibility == 'visible'){
            options[i].style.height = '0px';
            options[i].style.paddingTop = '0px';
            options[i].style.paddingBottom = '0px';
        }else if(i == 1){
            if(queue_menu.style.visibility == 'visible'){
                options[i].style.height = '30%';
                options[i].style.paddingTop = '5px';
                options[i].style.paddingBottom = '5px';
            }else{
                options[i].style.height = '0px';
                options[i].style.paddingTop = '0px';
                options[i].style.paddingBottom = '0px';
            }
        }else{
            options[i].style.height = '30%';
            options[i].style.paddingTop = '5px';
            options[i].style.paddingBottom = '5px';
        }
    }

    let css = `
        top:${bounds.y+ button.offsetHeight}px;
        left:${bounds.x - opt_bounds.width + bounds.width}px;
        visibility:visible;
        `
    options_vis = true;
    options_menu.setAttribute('style', css);
}

var playlist_added = {};
function show_playlist_options(name){
    document.getElementById('playlist-submit').setAttribute('name', name);

    let playlist_selector = document.getElementById('playlist-selector');
    for(var playlist in library.playlists){
        if(!playlist_added.hasOwnProperty(playlist)){
            let options = document.createElement('option');
            options.value = playlist;
            options.innerHTML = playlist;
            playlist_selector.appendChild(options);
            playlist_added[playlist] = null;
        }
    }
    document.getElementById('playlist-selector-container').style.visibility = 'visible';
}

function show_playlist_builder(){
    let div = document.getElementById('create-playlist');
    if(div.style.visibility == 'hidden' || div.style.visibility == ''){
        document.getElementById('create-playlist-name').value = '';
        div.style.visibility = 'visible';
    }else{
        div.style.visibility = 'hidden';
    }
}

function highlight_row(){
    let table;
    let cell_index;

    if(context.getAttribute('name') == 'playlist'){
        table = document.getElementById('playlist-table');
        cell_offset = 1;
    }else if(context.getAttribute('name') == 'search'){
        table = document.getElementById('search-songs');
        cell_offset = 0;
    }

    let row_index = null; //save the row index so that change is only made after all are set to white
    for(var i = 0; i < table.rows.length; i++){
        if(song != null && table.rows[i].getAttribute('name') === song.id){
            row_index = i;
        }else{
            table.rows[i].cells[2 + cell_offset].firstChild.style.color = 'white';
            table.rows[i].cells[0 + cell_offset].firstChild.style.color = 'white';
            if(cell_offset == 1){
                table.rows[i].cells[0].style.color = 'white';
            }
        }
    }
    if(row_index != null){
        table.rows[row_index].cells[2 +  cell_offset].firstChild.style.color = '#bb86fc';
        table.rows[row_index].cells[0 + cell_offset].firstChild.style.color = '#bb86fc';
        if(cell_offset == 1){
            table.rows[row_index].cells[0].style.color = '#bb86fc';
        }
    }
}

function confirm_delete(button=null){
    let menu = document.getElementById('confirm-delete');
    if(menu.style.visibility == 'hidden' || menu.style.visibility == ''){
        document.getElementById('delete-label').innerHTML = `Delete Playlist ${button.getAttribute('name')}?`;
        menu.style.visibility = 'visible';
    }else{
        menu.style.visibility = 'hidden';
    }
}

function set_likes(){
    let table;
    let cell_index;
    if(context.getAttribute('name') == 'search'){
        table = document.getElementById('search-songs');
        cell_index = 3;
    }else if(context.getAttribute('name') == 'playlist'){
        table = document.getElementById('playlist-table');
        cell_index = 4;
    }

    for(var i = 0; i < table.rows.length; i++){
        let id = table.rows[i].getAttribute('name');
        if(library.saved.liked_id.hasOwnProperty(id) && library.saved.liked_id[id] == true){
            table.rows[i].cells[cell_index].firstChild.innerHTML = '';
            table.rows[i].cells[cell_index].firstChild.style.color = '#bb86fc';
        }else{
            table.rows[i].cells[cell_index].firstChild.innerHTML = '';
            table.rows[i].cells[cell_index].firstChild.style.color = 'white';
        }
    }
}

function update_play_ui(force_playing, main){
    if(song == null) { return; }

    let table = context.getAttribute('name') == 'search' ? document.getElementById('search-songs') : document.getElementById('playlist-table');
    let index =  context.getAttribute('name') == 'search' ? 0 : 1;

    for(var i = 0; i < table.rows.length; i++){

        if(song.id == table.rows[i].getAttribute('name')){
            if(force_playing){
                table.rows[i].cells[index].firstChild.innerHTML = audio.paused ? '' : '';
                document.getElementById('play').innerHTML = audio.paused ? '' : '';
            }else{
                table.rows[i].cells[index].firstChild.innerHTML = audio.paused ? '' : ''; //same as above but in reverse
                document.getElementById('play').innerHTML = audio.paused ? '' : '';
            }
        }else{
            table.rows[i].cells[index].firstChild.innerHTML = '';
        }
    }

    if(main == null){
        document.getElementById('play').innerHTML = audio.paused ? '' : '';
    }else{
        document.getElementById('play').innerHTML = main ? '' : '';
    }
}

function build_queue(vis){
    if(vis){
        document.getElementById('context-queue').innerHTML = 'Next from: ' + context_playing;

        let j = 1;
        let priority_table = document.getElementById('priority-table');
        priority_table.innerHTML = '';
        for(var i = SongQueue.priority_index + 1, k = 0; i < SongQueue.priority_queue.length; i++, j++, k++){
            if(SongQueue.priority_queue[i].skip == false){
                const row = document.createElement('tr');
                row.setAttribute('name', SongQueue.priority_queue[i].id);
        
                let col0 = document.createElement('td');
                col0.innerHTML = '#' + j;
                col0.setAttribute('class', 'font');
                col0.setAttribute('style', 'width:3%;');
        
                let col1 = document.createElement('td');
                col1.innerHTML = `<img class="thumb" src="${SongQueue.priority_queue[i].thumb}" />`;
                col1.setAttribute('style', 'width:5%;');
        
                let col2 = document.createElement('td');
                col2.setAttribute('class', 'font');
                col2.setAttribute('style', 'overflow:hidden;width:80%');
                col2.innerHTML = `<label class="font" style="padding-left:50px;white-space:nowrap;overflow-x:hidden">${SongQueue.priority_queue[i].name}</br><span class="font" style="color:grey;font-size:small;margin-left:50px">${SongQueue.priority_queue[i].artist}</span></label>`

                let col5 = document.createElement('td');
                col5.innerHTML = `<button class="ot icon" name="q${k}?t=null" onclick="options(this)"></button>`;
                col5.setAttribute('style', 'width:10%');

                row.appendChild(col0);
                row.appendChild(col1);
                row.appendChild(col2);
                row.appendChild(col5);
                priority_table.appendChild(row);
            }
        }
        
        let temp = song;
        let queue_table = document.getElementById('context-queue-table');
        queue_table.innerHTML = '';
        k = 0;
        while(temp != null && temp.next != null){
            temp = temp.next;
            if(temp.skip == false){
                const row = document.createElement('tr');
                row.setAttribute('name', temp.id);
        
                let col0 = document.createElement('td');
                col0.innerHTML = '#' + j;
                col0.setAttribute('class', 'font');
                col0.setAttribute('style', 'width:3%;');
        
                let col1 = document.createElement('td');
                col1.innerHTML = `<img class="thumb" src="${temp.thumb}" />`;
                col1.setAttribute('style', 'width:5%;');
        
                let col2 = document.createElement('td');
                col2.setAttribute('class', 'font');
                col2.setAttribute('style', 'overflow:hidden;width:80%');
                col2.innerHTML = `<label class="font" style="padding-left:50px;white-space:nowrap;overflow-x:hidden">${temp.name}</br><span class="font" style="color:grey;font-size:small;margin-left:50px">${temp.artist}</span></label>`
        
                let col5 = document.createElement('td');
                col5.innerHTML = `<button class="ot icon" name="z${k}?t=null" onclick="options(this)"></button>`;
                col5.setAttribute('style', 'width:10%');

                row.appendChild(col0);
                row.appendChild(col1);
                row.appendChild(col2);
                row.appendChild(col5);
                queue_table.appendChild(row);
                j++;
                k++;
            }
        }

        queue_menu.style.visibility = 'visible';
        set_context('queue');
    }else{
        set_context(context);
    }
}

function focus_title(){
    title.name = title.value;
    title.readOnly = false;
    title.focus();
}