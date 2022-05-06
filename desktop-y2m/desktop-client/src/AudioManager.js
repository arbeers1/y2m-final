var pause_and_seek = false;

function play_song(url){
    audio.pause();
    get_audio_from_url(url).then((src) => {
        audio.src = src;
        document.getElementById('currently-playing').innerHTML = song.name;
        document.getElementById('currently-playing-thumb').style.visibility = 'visible';
        document.getElementById('currently-playing-thumb').src = song.thumb;
        audio.oncanplay = function(){
            if(!pause_and_seek){ audio.play(); }
            else { pause_and_seek = false; }
        }
    });
}

function download_song(url){
    download_song_from_url(url).then((progress) => {
        progress.onprogress = function(){
            let prog = progress.progress;
            console.log(`File Downloading: ${prog}%`);
        }
    });
}

function pause(){
    if(audio.paused && audio.src != ''){
        update_play_ui(null, false);
        audio.play();
    }else{
        update_play_ui(null, true);
        audio.pause();
    }
}

function next(){
    let queued_song = get_prio_next();
    if(queued_song != null){
        let next_song = song.next;
        let prev_song = song;
        song.next = queued_song;
        song = queued_song;
        song.next = next_song;
        song.prev = prev_song;
    }else if(shuffle){
        if(shuffle_index + 1 < shuffle_queue.length){
            song = shuffle_queue[shuffle_index + 1];
            shuffle_index++;
        }
    }else if(song != null && song.next != null){
        let temp = song;
        song = get_next(song);
        if(song.prev != temp){
            song.prev = temp;
        }
    }
    
    highlight_row();
    play_song(song.url);
    update_play_ui(null, false);
    
    if(queue_menu.style.visibility == 'visible'){
        build_queue(true);
    }
}

function get_next(s){
    while(s != null){
        s = s.next;
        if(s.skip == false){
            return s;
        }
    }
    return null;
}

function get_prio_next(){
    let s = SongQueue.pop_priority();
    while(s != null){
        if(s.skip == false){
            return s;
        }
        s = SongQueue.pop_priority();
    }
    return null;
}

function prev(){
    if(shuffle){
        if(shuffle_index - 1 > -1){
            song = shuffle_queue[shuffle_index - 1];
            shuffle_index--;
            highlight_row();
            play_song(song.url);
        }
    }else if(song != null && song.prev != null){
        song = song.prev;
        highlight_row();
        play_song(song.url);
    }
}

function set_shuffle(){
    shuffle = !shuffle;
    if(shuffle){
        shuffle_index = -1;
        shuffle_queue = SongQueue.shuffle();
        next();
    }
}

async function audio_details(url){
    let response = await axios.get(url)
    .catch(error => {
        console.log(error);
    });

    let ytInitialPlayerResponse = response.data.match(/var ytInitialPlayerResponse = ({.*}}}})/);
    ytInitialPlayerResponse = JSON.parse(ytInitialPlayerResponse[0].substring(30));
    return { ytInitialPlayerResponse, response };
}

function add_to_priority(retrieval_code){
    let table;
    let name_code;
    let char_code;
    if(retrieval_code.substring(0, 1) == 'p'){
        table = document.getElementById('playlist-table');
        name_code = document.getElementById('playlist-title').innerHTML;
        char_code = 'p';
    }else if(retrieval_code.substring(0, 1) == 's'){
        table = document.getElementById('search-songs');
        name_code = 'search';
        char_code = 's';
    }else if(retrieval_code.substring(0, 1) == 'q'){
        table = document.getElementById('priority-table');
        name_code = 'queue';
        char_code = 'q';
    }else if(retrieval_code.substring(0, 1) == 'z'){
        table = document.getElementById('context-queue-table');
        name_code = 'queue';
        char_code = 'z';
    }

    const query_index = retrieval_code.indexOf('?t=');
    const index = retrieval_code.substring(1, query_index);
    const row = table.rows[index];
    const id = row.getAttribute('name');
    const url = 'https://youtube.com/watch?v=' + id;
    const cells = row.cells;
    const offset = cells.length <= 5 ? 0 : 1;
    const name = cells[2+offset].firstChild.firstChild.textContent;
    const artist = cells[2+offset].firstChild.textContent.replace(name, '');
    const thumb = cells[1+offset].firstChild.src;
    SongQueue.push_priority(url, `${char_code}${index}?n=${name_code}`, id, name, artist, thumb);
    
    if(build_queue_switch){ build_queue(true);}
}

function remove_queue(retrieval_code){
    console.log(retrieval_code);
    const index = parseInt(retrieval_code.substring(1, retrieval_code.indexOf('?t=')));
    if(retrieval_code.substring(0, 1) == 'q'){
        const table = document.getElementById('priority-table');
        SongQueue.priority_queue[SongQueue.priority_index + 1 + index].skip = true;
    }else if(retrieval_code.substring(0, 1) == 'z'){
        const table = document.getElementById('context-queue-table');
        let temp = song;
        let i = 0;
        while(i <= index && temp.next != null){
            temp = temp.next;
            if(i == index){
                temp.skip = true;
            }  
            i++;
        }
    }
    build_queue(true);
}

function play_from_row(row){
    if(song != null && row.getAttribute('name') == song.id){
        pause();
        return;
    }

    bookmark_row = row;
    let table = row.parentNode;
    let rows = table.rows;
    
    let char_code;
    let name_code;
    if(table.id == 'playlist-table'){
        char_code = 'p';
        name_code = document.getElementById('playlist-title').value;
    }else if(table.id == '' || table.id == 'search-songs'){
        char_code = 's';
        name_code = 'search';
    }
    context_playing = name_code;

    SongQueue.clear();
    for(var i = row.rowIndex; i < rows.length; i++){
        let id = rows[i].getAttribute('name');
        let url = 'https://youtube.com/watch?v=' + id;

        const cells = rows[i].cells;
        const offset = cells.length <= 5 ? 0 : 1;
        const name = cells[2+offset].firstChild.firstChild.textContent;
        const artist = cells[2+offset].firstChild.textContent.replace(name, '');
        const thumb = cells[1+offset].firstChild.src;

        SongQueue.push(url, `${char_code}${i}?n=${name_code}`, id, name, artist, thumb);
    }

    song = SongQueue.pop();
    highlight_row();
    play_song(song.url);
    update_play_ui(null, false);
}

async function get_audio_from_url(url){
    const audio = await audio_details(url)
    const ytInitialPlayerResponse = audio.ytInitialPlayerResponse;
    const audio_info = ytInitialPlayerResponse.streamingData.adaptiveFormats[ytInitialPlayerResponse.streamingData.adaptiveFormats.length - 1];

    if(song != null){
        console.log(ytInitialPlayerResponse);
        song.name = ytInitialPlayerResponse.videoDetails.title;
        song.artist = ytInitialPlayerResponse.videoDetails.author;
        let thumb = ytInitialPlayerResponse.videoDetails.thumbnail.thumbnails
        song.thumb = thumb[thumb.length - 1 ].url;
    }

    if(audio_info.hasOwnProperty('url')){
        var urls = [audio_info.url];
    }else{
        var urls = await get_decoded_url(audio_info.signatureCipher, audio.response.data);
    }

    var error_counter = 0;
    return new Promise(function(resolve, reject){
        for(var i = 0; i < urls.length; i++){
            let audio = new Audio();
            audio.src = urls[i];

            let timer = setTimeout(async () => {
                error_counter++;
                if(error_counter == 6){ console.log('Failed to load audio. Trying Again.'); let src = await get_audio_from_url(url); resolve(src);}
            }, 5000)

            audio.onloadedmetadata = function(){
                audio = null;
                resolve(this.src);
                clearTimeout(timer);
            }
        }
    });
}

async function download_song_from_id(id){
    const audio = await audio_details('https://youtube.com/watch?v=' + id);
    const ytInitialPlayerResponse = audio.ytInitialPlayerResponse;
    const file_name = ytInitialPlayerResponse.videoDetails.title + '.mp3';
    const byte_rate = ytInitialPlayerResponse.streamingData.adaptiveFormats[ytInitialPlayerResponse.streamingData.adaptiveFormats.length - 1].averageBitrate / 8;
    const approx_file_size = byte_rate * ytInitialPlayerResponse.videoDetails.lengthSeconds;
    const file = fs.createWriteStream('./library/' + file_name);


    const stream = await get_audio_from_url(url);
    const req = await axios({
        method: 'GET',
        url: stream,
        responseType: 'stream'
    });

    req.data.pipe(file);

    return new Progress(file, approx_file_size);
}

class Progress{
    constructor(file, file_size){
        this.onprogress = null;
        this.progress = 0;
        this.file = file;
        this.file_size = file_size;
        this.bytes_written = 0;
        
        this.start();
    }

    start(){
        self = this;
        let progInt = setInterval(function(){
            if(self.file.bytesWritten > self.bytes_written){
                self.progress = Math.round(self.file.bytesWritten / self.file_size * 100);
                self.bytes_written = self.file.bytesWritten;

                if(self.onprogress != null){
                    self.onprogress();
                }
            }

            if(self.progress >= 100){
                clearInterval(progInt);
            }
        }, 5);
    }
}

function timeToString(time){
    let minutes = Math.floor(time/60);
    minutes = minutes < 10 ? '0'+minutes : minutes;
    let seconds = parseInt(time % 60);
    seconds = seconds < 10 ? '0'+seconds : seconds;
    minutes = !isNaN(minutes) ? minutes : '00';
    seconds = !isNaN(seconds) ? seconds : '00';
    return `${minutes}:${seconds}`;
}

function add_event_handlers(){
    let seeker_drag = false;
    let volume_drag = false;

    audio.onended = function(){
        if(repeat){
            audio.currentTime = 0;
        }else{
            next();
        }
    }

    audio.ontimeupdate = function(){
        if(!seeker_drag){
            seeker.value = audio.currentTime / audio.duration * 1000;
            document.getElementById('time-current').innerHTML = timeToString(audio.currentTime);
            document.getElementById('time-length').innerHTML = timeToString(audio.duration);
        }
    }

    seeker.onchange = function(){
        if(audio.paused) { pause_and_seek = true; }
        audio.currentTime = seeker.value / 1000 * audio.duration;
    }

    seeker.onmousedown = function(){
        seeker_drag = true;
    }

    seeker.onmouseup = function(){
        seeker_drag = false;
    }

    seeker.onmousemove = function(e){
        if(seeker_drag){
            document.getElementById('time-current').innerHTML = timeToString(audio.duration * seeker.value/1000);
        }
    }

    volume.onchange = function(){
        audio.volume = volume.value / 100;
    }

    volume.onmousedown = function(){
        volume_drag = true;
    }

    volume.onmouseup = function(){
        volume_drag = false;
    }

    volume.onmousemove = function(e){
        if(volume_drag){
            vol_bounds = volume.getBoundingClientRect();
            let vol = (e.pageX - vol_bounds.x) / volume.offsetWidth;
            if(vol > 1) { vol = 1; }
            else if(vol < 0.05) {vol = 0; }
            audio.volume = vol;

            if(vol > .75){
                document.getElementById('vol-indicator').innerHTML = '';
            }else if(vol > .35 && vol <= .75){
                document.getElementById('vol-indicator').innerHTML = '';
            }else if(vol > 0.05){
                document.getElementById('vol-indicator').innerHTML = ''
            }else{
                document.getElementById('vol-indicator').innerHTML = '';
            }
        }
    }

    search.onkeydown = function(e){
        if(e.keyCode == 13){
           search_yt(this.value).then(res => {
                display_search_results(res);
           }).catch(err => {
                console.log(err);
                if(err.response.data.error.code == 403){
                    rotate_key();
                    search_yt(this.value).then(res => {
                        display_search_results(res);
                   });
                }
           });
        }
    }
}
