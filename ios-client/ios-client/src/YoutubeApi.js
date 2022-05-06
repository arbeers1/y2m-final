import axios from 'axios';
import library from './../lib.json';

class YoutubeAPI{
    static key_index = 0; //<--Youtube Api rate limit is kinda low so we rotate keys
    static API_KEY = library.YoutubeApiKeys[this.key_index];
    static search_results = [];

    static search_yt(query){
        const url = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=8&q=${query}&key=${this.API_KEY}`;

        this.search_results = [];
        let self = this;
        return new Promise(function(resolve, reject){
            axios.get(url)
            .then(res => {
                let data = res.data;

                for(var i = 0; i < data.items.length; i++){
                    let type = data.items[i].id.kind;
                    let audio_details = null;
                    if(type == 'youtube#video'){
                        audio_details = {
                            'type': type,
                            'name': data.items[i].snippet.title,
                            'id': data.items[i].id.videoId,
                            'channel': data.items[i].snippet.channelTitle,
                            'channel_id': data.items[i].snippet.channelId,
                            'thumbnail': data.items[i].snippet.thumbnails.default.url
                        }
                    }else if(type == 'youtube#channel'){
                        audio_details = {
                            'type': type,
                            'channel': data.items[i].snippet.title,
                            'channel_id': data.items[i].snippet.channelId,
                            'thumbnail': data.items[i].snippet.thumbnails.medium.url
                        }
                    }
                    self.search_results.push(audio_details);
                }

                resolve();
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    static rotate_key(){
        if(this.key_index == library.YoutubeApiKeys.length - 1){
            this.key_index = 0;
        }else{
            this.key_index++;
        }
        this.API_KEY = library.YoutubeApiKeys[this.key_index];
    }
}

export default YoutubeAPI;