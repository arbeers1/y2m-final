import { Audio } from 'expo-av';
import axios from 'axios';
import Decoder from './Decoder'
import SongQueue from './SongQueue'
import UIManager from './UIManager';
import FileOps from './FileOps';

class AudioManager {
    constructor(){
        this.sound = new Audio.Sound();
        this.sound_buffer = new Audio.Sound();
        this.song = null;
        this.set_status(this.sound, this);
        this.set_status(this.sound_buffer, this, true);
        this.paused = false;
        this.sound_fired = false;
        this.current_time_str = '';
        this.seek_time_str='';
        this.duration_str = '';
        this.progress = 0;
        this.shuffle = false;
        this.shuffle_queue = null;
        this.shuffle_index = -1;
        this.repeat = false;
        
        Audio.setAudioModeAsync(
            {
                'playsInSilentModeIOS': true,
                'downloadFirst': false
            }
        );

    }

    async pause(){
        if(this.paused){
            await this.sound.playAsync();
        }else{
            await this.sound.pauseAsync();
        }
        this.paused = !this.paused;
        UIManager.refresh_ui();
    }

    play_from_row(index, playlist){
        this.sound_fired = false;
        SongQueue.clear();
        for(var i = index; i < playlist.length; i++){
            SongQueue.push(null, null, playlist[i].id, playlist[i].name, playlist[i].channel, playlist[i].thumbnail);
        }
        this.song = SongQueue.pop();
        UIManager.refresh_ui();

        this.load_from_id(this.song.id, this.sound);
    }

    async load_from_id(id, sound){
        await sound.unloadAsync();
        console.log('Sound unloaded');
        
        if(FileOps.file_exists(id)){
            const audio_local_info = await FileOps.get_local_song(id);
            if(sound == this.sound){
                this.song.duration = audio_local_info[1];
                this.song.thumb = audio_local_info[2];
            }else{
                this.song.next.duration = audio_local_info[1];
                this.song.next.thumb = audio_local_info[2];
            }
            await this.sound.unloadAsync();
            await sound.loadAsync( {'uri': audio_local_info[0] } );
            console.log('Loading sound from file');
            return;
        }

        const url = 'https://youtube.com/watch?v=' + id;
        const audio = await this.audio_details(url);
        console.log('Audio details aquired');
        const ytInitialPlayerResponse = audio.ytInitialPlayerResponse;
        const audio_info = this.get_mp4a_data(ytInitialPlayerResponse);
        console.log('MP4A data recieved')

        let thumb = ytInitialPlayerResponse.videoDetails.thumbnail.thumbnails;
        if(sound == this.sound){
            this.song.duration = audio_info.approxDurationMs;
            this.song.thumb = thumb[thumb.length - 1 ].url;
        }else{
            this.song.next.duration = audio_info.approxDurationMs;
            this.song.next.thumb = thumb[thumb.length - 1 ].url;
        }

        if(audio_info.hasOwnProperty('url')){
            var urls = [audio_info.url];
        }else{
            var urls = await Decoder.get_decoded_url(audio_info.signatureCipher, audio.response.data);
            console.log('Sipher decoded')
        }

        let uri_fails = 0;
        console.log('Attempting sound load');
        for(var i in urls){
            try{
                console.log(i);
                await sound.loadAsync( {'uri': urls[i]} );
            }catch (err){
                console.log(err.message);
                if(err.message.includes('error code -11828')){
                    uri_fails++;
                    if(uri_fails == 6){ console.error('Failed to decipher encrypted audio passcode.')}
                }else if(err.message === 'The Sound is already loaded.' || err.message.includes('The Sound is already loading')){
                    console.log(sound == this.sound ? 'breaking main...' : 'breaking_buffer');
                    break;
                }else{
                    console.log(err);
                }
            }
        }
    }

    download_all(songs){
        for(var i = 0; i < songs.length; i++){
            if(FileOps.library.local.hasOwnProperty(songs[i].id) == false){
                console.log(songs[i].name);
                this.download_from_id(songs[i].id);
            }
        }
    }

    async download_from_id(id){
        const url = 'https://youtube.com/watch?v=' + id;
        const audio = await this.audio_details(url);
        const ytInitialPlayerResponse = audio.ytInitialPlayerResponse;
        const audio_info = this.get_mp4a_data(ytInitialPlayerResponse);

        let thumb = ytInitialPlayerResponse.videoDetails.thumbnail.thumbnails;
        let big_thumb = thumb[thumb.length - 1 ].url;
        let small_thumb = thumb[0].url;
        let duration = audio_info.approxDurationMs;

        if(audio_info.hasOwnProperty('url')){
            var urls = [audio_info.url];
        }else{
            var urls = await Decoder.get_decoded_url(audio_info.signatureCipher, audio.response.data);
            console.log('Sipher decoded')
        }

        return FileOps.download_song(urls, id, duration, small_thumb, big_thumb);
    }

    async audio_details(url){
        let response = await axios.get(url, {
            headers: {
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
            }})
        .catch(error => {
            console.log(error);
        });
    
        let ytInitialPlayerResponse = response.data.match(/var ytInitialPlayerResponse = ({.*}}}})/);
        ytInitialPlayerResponse = JSON.parse(ytInitialPlayerResponse[0].substring(30));
        return { ytInitialPlayerResponse, response };
    }

    get_mp4a_data(ytInitialPlayerResponse){
        let formats = ytInitialPlayerResponse.streamingData.adaptiveFormats;
        let index = formats.length;
        while(index > 0){
            index--;
            if(formats[index].mimeType === 'audio/mp4; codecs="mp4a.40.2"'){
                return formats[index];
            }
        }
    }

    async next(no_buff=true) {
        let queued_song = this.get_prio_next();
        if(this.repeat && this.song != null){
            await this.sound.setStatusAsync({ positionMillis: 0});
            return;
        }else if(this.song != null && queued_song != null){
            let next_song = this.song.next;
            let prev_song = this.song;
            this.song.next = queued_song;
            this.song = queued_song;
            this.song.next = next_song;
            this.song.prev = prev_song;
        }else if(this.song != null && this.song.next != null){
            let temp = this.song;
            this.song = this.get_next(this.song);
            this.song.prev = temp;
        }
        UIManager.refresh_ui();
        await this.sound.unloadAsync();
        this.sound_fired = false;
        if(no_buff){
            this.load_from_id(this.song.id, this.sound);
        }
    }

    get_next(s){
        while(s != null){
            s = s.next;
            if(s.skip == false){
                return s;
            }
        }
        return null;
    }

    get_prio_next(){
        let s = SongQueue.pop_priority();
        while(s != null){
            if(s.skip == false){
                return s;
            }
            s = SongQueue.pop_priority();
        }
        return null;
    }

    async prev(){
        if(this.song != null && this.song.prev != null && this.song.prev.id != -1){
            this.song = this.song.prev;
            UIManager.refresh_ui();
            await this.sound.unloadAsync();
            this.sound_fired = false;
            this.load_from_id(this.song.id, this.sound);
        }
    }

    async seek(time){
        await this.sound.setStatusAsync({ positionMillis: time});
        this.progress = time/this.song.duration * 100;
        audioManager.current_time_str = this.time_to_string(time);
        UIManager.refresh_ui();
    }

    set_status(sound, self, buff=false){
        let force = false;
        sound.setOnPlaybackStatusUpdate(function(status){
            if(status.isLoaded){ 
                if(!buff && !status.isPlaying){
                    console.log('INITIAL SOUND LOADED');
                    if(!self.sound_fired) { sound.playAsync();this.paused = false; }
                    self.sound_fired = true;
                }

                //This is not ideal but the expo av api thinks that every song is much longer than it actually is causing
                //the on finished event to not properly execute
                if (status.positionMillis >= self.song.duration && self.sound_fired) {
                    console.log('PLAYER FINISHED');
                    self.sound_fired = false;
                    self.next();
                }
            }else{
                console.log('Not Loaded');
            }

            if(status.isPlaying && self.sound_fired){
                self.progress = status.positionMillis / self.song.duration * 100;
                self.current_time_str = self.time_to_string(status.positionMillis);
                self.duration_str = self.time_to_string(self.song.duration);
                force=!force;
                if(force) { UIManager.refresh_ui(); }
            }
        });
    }

    time_to_string(time){
        time = time/1000;
        let minutes = Math.floor(time/60);
        minutes = minutes < 10 ? '0'+minutes : minutes;
        let seconds = parseInt(time % 60);
        seconds = seconds < 10 ? '0'+seconds : seconds;
        minutes = !isNaN(minutes) ? minutes : '00';
        seconds = !isNaN(seconds) ? seconds : '00';
        return `${minutes}:${seconds}`;
    }

    //Set shuffle on current queue 
    set_shuffle(){
        this.shuffle = !shuffle;
        if(shuffle){
            this.shuffle_index = -1;
            this.shuffle_queue = SongQueue.shuffle();
            this.next();
        }
    }

    //Set shuffle on an array (The shuffle button at top of playlist)
    set_shuffle_full(arr){
        console.log('hello?')
        this.shuffle = true;
        this.shuffle_index = -1;
        this.shuffle_queue = SongQueue.shuffle(arr);
        this.song = {'id': -1, 'name':'name', 'next': this.shuffle_queue[0]};
        this.next(true);
    }

    add_to_priority(song){
        SongQueue.push_priority(null, null, song.id, song.name, song.channel, song.thumbnail);
    }

    remove_priority(index, prio){
        if(prio){
            SongQueue.priority_queue[SongQueue.priority_index + 1 + index].skip = true;
        }else{
            let temp = this.song;
            let i = 0;
            while(i <= index && temp.next != null){
                temp = temp.next;
                if(i == index){
                    temp.skip = true;
                }  
                i++;
            }
        }
        UIManager.refresh_ui();
    }

    get_priority(){
        let res = [];
        for(var i = SongQueue.priority_index + 1; i < SongQueue.priority_queue.length; i++){
            if(SongQueue.priority_queue[i].skip == false) { res.push(SongQueue.priority_queue[i]); }
        }
        return res;
    }

    get_all(){
        let temp = this.song;
        let res = [];
        while(temp != null && temp.next != null){
            temp = temp.next;
            if(temp.skip == false) { res.push(temp); }
        }
        return res;
    }
}

const audioManager = new AudioManager();
export default audioManager;