import UIManager from './UIManager.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';


class FileOps{
    static library; 
    static currently_downloading = {};

    static async get_library(){
        try {
            const value = await AsyncStorage.getItem('library');
            if(value != null) {
                this.library = JSON.parse(value);
                return this.library;
            }else{
                library = {
                    "local": {},
                    "saved": {
                        "liked_id":{},
                        "songs": []
                    },
                    "playlists": {}
                }; 
                this.save(library);
                this.library = library;
                return library;
            }
          } catch(e) {
            console.error(e);
          }
    }

    static add_to_playlist(playlist, song){
        console.log(playlist);
        this.library.playlists[playlist].songs.push({
            'name': song.name,
            'id': song.id,
            'channel': song.channel,
            'thumbnail': song.thumbnail
        });
        UIManager.refresh_ui();
        this.save(this.library);
        return this.library;
    }

    static remove_from_playlist(playlist, id){
        console.log(playlist, id);
        let play = playlist == 'Liked Songs' ? this.library.saved.songs : this.library.playlists[playlist].songs;
        for(var i = 0; i < play.length; i++){
            if(play[i].id == id){
                play.splice(i, 1);
                break;
            }
        }
        UIManager.refresh_ui();
        this.save(this.library);
    }

    static create_playlist(playlist){
        if(this.library.playlists.hasOwnProperty(playlist) == false){
            this.library.playlists[playlist] = {'songs': []};
            UIManager.refresh_ui();
            this.save(this.library);
        }
        return this.library;
    }

    static edit_playlist(playlist, new_name){
        if(this.library.playlists.hasOwnProperty(new_name) == false){
            this.library.playlists[new_name] = this.library.playlists[playlist];
            delete this.library.playlists[playlist];
            UIManager.context = new_name;
            UIManager.refresh_ui();
            this.save(this.library);
        }
    }

    static delete_playlist(playlist){
        delete this.library.playlists[playlist];
        UIManager.context = 'library';
        UIManager.refresh_ui();
        this.save(this.library);
    }

    static async save(value){
        try {
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem('library', jsonValue);
            console.log('Library Saved');
        } catch (e) {
            console.error(e);
        }
    }

    static file_exists(id){
        return this.library.local.hasOwnProperty(id);
    }

    static async download_song(urls, id, duration, small_thumb=null, big_thumb=null){
        this.currently_downloading[id] = 0;
        const dir = FileSystem.documentDirectory;
        var small_thumb_pointer;
        if(small_thumb != null){
            var small_thumb_pointer = await FileSystem.downloadAsync(small_thumb, dir + `${id}_thumb_small.jpg`);
            small_thumb_pointer = small_thumb_pointer.uri;
        }
        if(big_thumb != null){ FileSystem.downloadAsync(big_thumb, dir + `${id}_thumb_big.jpg`); }

        var uri_f;
        var error_counter = 0;
        var error = false;

        for(var url in urls){
            var progress;
            var bytes_written;
            const callback = downloadProgress => {
                this.currently_downloading[id] = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                bytes_written = downloadProgress.totalBytesWritten; 
                if(parseInt(this.currently_downloading[id] * 100) % 5 == 0){ UIManager.refresh_ui(); }
            };
              
            const downloadResumable = FileSystem.createDownloadResumable(urls[url],  dir + `${id}_audio.m4a`, {}, callback);
              
            var { uri } = await downloadResumable.downloadAsync();

            if(bytes_written > 0){ uri_f = uri; break; }
            else{error_counter++; if(error_counter==6){console.log('Download Failed. Unable to decipher url. Try again');error=true;}}
        }

        if(!error){
            this.library.local[id] =  {'uri': uri_f, 'duration': duration, 'thumbnail': small_thumb_pointer};
            delete this.currently_downloading[id];
            UIManager.refresh_ui();
            this.save(this.library);
        }
    }

    static async remove_download(id){
        delete this.library.local[id];
        this.save(this.library); 
        const dir = FileSystem.documentDirectory;
        await FileSystem.deleteAsync(dir + `${id}_audio.m4a`, {'idempotent': true});
        await FileSystem.deleteAsync(dir + `${id}_thumb_big.jpg`, {'idempotent': true});
        await FileSystem.deleteAsync(dir + `${id}_thumb_small.jpg`, {'idempotent': true});
        UIManager.refresh_ui();
    }

    static async get_local_song(id) {     
        const fileUri = this.library.local[id].uri;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
        if (!fileInfo.exists) {
           return null;
        }
      
        return [fileUri, this.library.local[id].duration, FileSystem.documentDirectory + `${id}_thumb_big.jpg`];
    }

    static like(song){
        if(this.library.saved.liked_id.hasOwnProperty(song.id)){
            delete this.library.saved.liked_id[song.id];
            for(var i in this.library.saved.songs){
                if(this.library.saved.songs[i].id == song.id){
                    this.library.saved.songs.splice(i, 1);
                    break;
                }
            }
        }else{
            this.library.saved.liked_id[song.id] = null;
            this.library.saved.songs.push(song);
        }
        UIManager.refresh_ui();
        this.save(this.library);
    }

}

export default FileOps;
