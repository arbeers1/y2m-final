var key_index = 0; //<--Youtube Api rate limit is kinda low so we rotate keys
var API_KEY = process.env['YoutubeApiKey' + key_index.toString()];

function search_yt(query){
    const url = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${query}&key=${API_KEY}`;

    search_results = [];
    
    return new Promise(function(resolve, reject){
        axios.get(url)
        .then(res => {
            let data = res.data;
            console.log(data.items);

            for(var i = 0; i < data.items.length; i++){
                let type = data.items[i].id.kind;
                let audio_details = null;
                if(type == 'youtube#video'){
                    audio_details = {
                        'type': type,
                        'title': data.items[i].snippet.title,
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
                search_results.push(audio_details);
            }

            resolve(search_results);
        })
        .catch(error => {
            reject(error);
        });
    });
}

function rotate_key(){
    if(key_index == 1){
        key_index = 0;
    }else{
        key_index++;
    }
    API_KEY = process.env['YoutubeApiKey' + key_index.toString()];
}