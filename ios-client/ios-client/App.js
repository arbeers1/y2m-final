import { Text, View, TouchableHighlight, Image, ScrollView, TextInput } from 'react-native';
import React, { useState, useRef} from 'react';
import { NavigationContainer, DarkTheme, useIsFocused } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { useFonts } from 'expo-font';
import UIManager from './src/UIManager.js';
import audioManager from './src/AudioManager.js';
import YoutubeAPI from './src/YoutubeApi.js';
import FileOps from './src/FileOps.js'
import styles from './style/stylesheet.js';

var library;
var ops_visible = false;
var playlist_ops_visible = false;
var create_playlist_vis = false;
var selected_song = null;
var seeker_dragging = false;
var edit_playlist_vis = false;
var playlist_context = null;
var prio_list = false;
var prio_index = 0;

FileOps.get_library().then((lib) => {
  library = lib;
});

export default function App() {
  const Stack = createNativeStackNavigator();

  const [loaded] = useFonts({
    'holo': require('./assets/fonts/holomdl2.ttf')
  });


  if (!loaded) {
    return null;
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Your Library" component={YourLibrary} />
        <Stack.Screen name="Playlist" component={Playlist} options={({ route }) => ({ title: route.params.name })}/>
        <Stack.Screen name="Controller" component={Controller} />
        <Stack.Screen name="Search" component={SearchMenu} />
        <Stack.Screen name="Queue" component={Queue} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

//Your Library Menu
const YourLibrary = ({ navigation, route }) => { 
  var text = '';
  const UIC = UIController(navigation);  
  const create_playlist = useRef();
  UIManager.navigation = navigation;

  const isFocused = useIsFocused();
  if(isFocused){
    UIManager.context = 'library';
  }
  var playlists = [];
  for(var playlist in library.playlists){
    let play = playlist;
    playlists.push(
      <TouchableHighlight 
        key={play}
        underlayColor='#121212' 
        onPress={() => {
            UIManager.navigation = navigation;
            UIManager.context = play;
            navigation.navigate('Playlist', { name: play});
          }}>
        <Text style={styles.text}>{ playlist }</Text>
      </TouchableHighlight>);
  }
  
  return(
    <View style={styles.container}>
      <TouchableHighlight underlayColor='#121212' onPress={()=> {create_playlist_vis=true;UIManager.refresh_ui();create_playlist.current.focus();}}>
        <Text style={[styles.text, {color: 'grey'}]}><Text style={[styles.text, styles.icon, {fontSize: 25, color: 'grey'}]}> </Text>Create Playlist</Text>
      </TouchableHighlight>
      <TouchableHighlight 
        underlayColor='#121212'
        onPress={() => {
          UIManager.context = 'Liked Songs';
          navigation.navigate('Playlist', {name: 'Liked Songs'});
        }}>
        <Text style={[styles.text]}>Liked Songs</Text>
      </TouchableHighlight>
      <ScrollView style={{width: '100%', height: '80%'}}>
        { playlists }
      </ScrollView>
      <UIC/>
      <TextInput
        ref={create_playlist}
        style={[styles.create_playlist, {opacity: create_playlist_vis ? 100 : 0, zIndex: create_playlist_vis ? 99 : -1}]}
        onChangeText={newText => text = newText}
        onSubmitEditing={() => {library = FileOps.create_playlist(text)}}
        onFocus={()=>UIManager.keyboard_focused = true}
        onBlur={()=> {UIManager.keyboard_focused = false; create_playlist_vis=false;UIManager.refresh_ui();}}
        placeholder="Playlist Name"
        keyboardType="default"
        keyboardAppearance='dark'
        numberOfLines={1}
        autoFocus = { create_playlist_vis ? true : false }
      />
   </View>
  );
};

const Playlist = ({ navigation, route }) => {
  var text = '';
  const isFocused = useIsFocused();
  if(isFocused){
    UIManager.context = route.params.name;
  }
  const edit_playlist = useRef();
  UIC = UIController(navigation);
  const Ops = Options(navigation);
  const PlaylistOps = PlaylistOptions(navigation);
  let table = [];
  var playlist_container = [];
  const playlist = route.params.name == 'Liked Songs' ? FileOps.library.saved.songs : FileOps.library.playlists[route.params.name].songs;
  for(var song in playlist){
    let s = song;
    playlist_container.push(playlist[s]);

    let text_color = 'white'
    if(audioManager.song != null){
      text_color = audioManager.song.id == playlist[song].id ? '#bb86fc' : 'white';
    }

    table.push(
      <TouchableHighlight underlayColor='#121212' key={s + "0"} onPress={() => {audioManager.play_from_row(s, playlist_container);playlist_context=route.params.name}}>
        <View key={s} style={styles.row} >
          <Image
            style={[styles.small_img_size, {marginLeft: 10}]} 
            source={{'uri': library.local.hasOwnProperty(playlist[song].id) ? library.local[playlist[song].id].thumbnail : playlist[song].thumbnail }}
          />
          <View key={'s'+2} style={{width: '70%'}}>
            <Text key={0} style={[styles.text, styles.song_width, {fontSize:20,marginTop:20, color: text_color}]} numberOfLines={1}>{ playlist[song].name }</Text>
            <View key={1} style={[styles.row, {width: '100%'}]}>
              <Text key={2} style={[styles.icon,styles.text, {color: '#bb86fc', display: FileOps.library.local.hasOwnProperty(playlist[song].id) ? 'flex':'none'}]}></Text>
              <Text key={1} style={[styles.text, {fontSize:20, color: 'grey'}]}>{ playlist[song].channel }</Text>
            </View>
          </View>
          <Text key={s+'4'} style={[styles.text, styles.icon , {fontSize:30,marginTop:20, marginRight: 10, marginLeft: 'auto'}]} onPress={() => {selected_song=playlist[s],ops_visible = true;UIManager.refresh_ui();}}></Text>
          <View key={'download-bar'} style={{width: FileOps.currently_downloading.hasOwnProperty(playlist[s].id) ? `${FileOps.currently_downloading[playlist[s].id]*100}%` : '0%',height:'1%',backgroundColor:'#bb86fc',position:'absolute',bottom:0}}></View>
        </View>
      </TouchableHighlight>
    );
  }
  return (
    <View style={{flexGrow: 1}}>
      <View style={[{marginTop:10,marginBottom:20,marginLeft:'auto',marginRight:10}, styles.row]}>
        <TouchableHighlight underlayColor='#121212' onPress={()=>{audioManager.set_shuffle_full(playlist_container);playlist_context=route.params.name;}}><Text style={[styles.text, styles.icon]}></Text></TouchableHighlight>
        <TouchableHighlight underlayColor='#121212' onPress={()=>{audioManager.download_all(playlist_container)}}><Text style={[styles.text, styles.icon]}></Text></TouchableHighlight>
        <TouchableHighlight underlayColor='#121212' onPress={()=>{edit_playlist_vis=true;UIManager.refresh_ui();edit_playlist.current.focus();}}><Text style={[styles.text, styles.icon,{display:UIManager.context=='Liked Songs'?'none':'flex'}]}></Text></TouchableHighlight>
        <TouchableHighlight underlayColor='#121212' onPress={()=>FileOps.delete_playlist(route.params.name)}><Text style={[styles.text, styles.icon,{display:UIManager.context=='Liked Songs'?'none':'flex'}]}></Text></TouchableHighlight>
      </View>
        <View style={{height:'80%'}}>
          <ScrollView>
            { table }
            <View><Text style={{fontSize:110}}>END OF PLAYLIST</Text></View>
          </ScrollView>
        </View>
      <UIC/>
      <Ops/>
      <TextInput
        ref={edit_playlist}
        style={[styles.create_playlist, {opacity: edit_playlist_vis ? 100 : 0, zIndex: edit_playlist_vis ? 99 : -1}]}
        onChangeText={(newText) => text = newText}
        onSubmitEditing={() => {FileOps.edit_playlist(UIManager.context, text)}}
        onFocus={()=>UIManager.keyboard_focused = true}
        onBlur={()=> {UIManager.keyboard_focused = false; edit_playlist_vis=false;UIManager.refresh_ui();}}
        placeholder="Playlist Name"
        keyboardType="default"
        keyboardAppearance='dark'
        numberOfLines={1}
        autoFocus = { edit_playlist_vis ? true : false }
      />
      <PlaylistOps/>
    </View>
  );
};

const UIController = (navigation) => {
  return class extends React.Component {
   render(){
    return (
      <View style={styles.nav_container}>
        <View key="player-controller" style={[styles.row, styles.play_container, {opacity: audioManager.song != null ? 100 : 0}]}>
          <TouchableHighlight underlayColor='#1d1d1d' style={{width: '80%', zIndex: 98}} onPress={() => {navigation.navigate('Controller', {'name': 'name'});UIManager.context = 'controller';}}>
            <View style={{width:'100%'}}>
              <Text key="song" style={[styles.text, styles.font_song, {overflow:'hidden', width: '100%'}]} numberOfLines={1}> 
                { audioManager.song != null ? audioManager.song.name : '' }
              </Text>
              <Text style={[styles.text, styles.artist]}>
                { audioManager.song != null ? audioManager.song.artist : ''}
              </Text>
            </View>
          </TouchableHighlight>
          <Text key="play" style={[styles.text, styles.icon, {position: 'absolute', right: 0, width:'10%'}, styles.icon_font]} onPress={() => audioManager.pause()}>
            { audioManager.paused ? '' : '' }
          </Text>
        </View>
        <View key="nav-container" style={[styles.row, styles.nav_main, {maxHeight: 50}]}>
          <TouchableHighlight onPress={() => navigation.navigate('Your Library') } underlayColor='#121212' style={styles.nav_label}>
            <Text key="user-library-navigator" style={[styles.text, styles.nav_label, styles.font, {width:'100%'}]}>
            <Text style={[styles.text, styles.icon, {fontSize: 30}]}>  </Text>
              Your Library
            </Text>
          </TouchableHighlight>
          <TouchableHighlight onPress={() => navigation.navigate('Search') } underlayColor='#121212' style={styles.nav_label}>
            <Text key="search-navigator" style={[styles.text, styles.nav_label, styles.font , {width:'100%'}]}>
              <Text style={[styles.text, styles.icon, {fontSize: 30}]}>  </Text>
              Search
            </Text>
          </TouchableHighlight>
        </View>
      </View>
    )
   } 
  }
}

const Controller = ({ navigation }) => {
  const isFocused = useIsFocused();
  if(isFocused){
    UIManager.context = 'controller';
  }
  let local_song = {'id': audioManager.song.id, 'name': audioManager.song.name, 'channel': audioManager.song.artist, 'thumbnail': audioManager.song.thumb}
  return (
    <View style={{width:'100%', marginTop:'auto'}}>
      <Image
        style={[{width: '80%',marginLeft: '10%'}, styles.image_def]} 
        source={{'uri': audioManager.song.thumb}}
        />
        <View style={[{marginLeft:'10%', width: '80%', marginTop: 'auto',}, styles.row]}>
          <Text style={[styles.text, {'marginLeft': 0, width:'80%', overflow:'hidden'}, styles.font_song_main]} numberOfLines={1}>{ audioManager.song != null ? audioManager.song.name : '' }</Text>
          <Text style={[styles.text, styles.icon, styles.icon_font, {marginTop:0,marginLeft: 'auto', color:FileOps.library.saved.liked_id.hasOwnProperty(audioManager.song.id)?'#bb86fc':'white'}]} onPress={()=>FileOps.like(local_song)}>{ FileOps.library.saved.liked_id.hasOwnProperty(audioManager.song.id) ? '' : '' }</Text>
        </View>
        <Text style={[styles.artist, {marginLeft:'10%'}]}> { audioManager.song != null ? audioManager.song.artist : ''} </Text>
        <Slider
          style={{width: '80%', height: '5%', marginLeft:'10%'}}
          minimumValue={0}
          maximumValue={100}
          value={seeker_dragging?'':audioManager.progress}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="grey"
          onValueChange={(newVal)=>{seeker_dragging=true;audioManager.seek_time_str = audioManager.time_to_string(newVal/100*audioManager.song.duration);UIManager.refresh_ui();}}
          onSlidingComplete={(newVal)=>{seeker_dragging=false;audioManager.seek(newVal/100*audioManager.song.duration);}}
        />
        <View style={[{marginLeft:'10%', width: '80%'}, styles.row]}>
          <Text style={styles.artist}>{seeker_dragging?audioManager.seek_time_str:audioManager.current_time_str}</Text>
          <Text style={[styles.artist,  {marginLeft:'auto'}]}>{audioManager.duration_str}</Text>
        </View>
        <View style={[{justifyContent:'center', marginBottom: 10}, styles.row]}>
          <Text style={[styles.text, styles.icon, {marginLeft: 20}]} onPress={() => {UIManager.context='q';navigation.navigate('Queue');}}></Text>
          <Text style={[styles.text, styles.icon, {marginLeft: 20}]} onPress={()=>audioManager.prev()}></Text>
          <Text style={[styles.text, styles.icon, {marginLeft:20,backgroundColor:'#bb86fc',borderRadius:10,overflow:'hidden', fontSize:60}]} onPress={() => audioManager.pause()}>
             { audioManager.paused ? '' : '' } 
          </Text>
          <Text style={[styles.text, styles.icon, {marginLeft: 20}]} onPress={()=>audioManager.next()}></Text>
          <Text style={[styles.text, styles.icon, {marginLeft: 20,color:audioManager.repeat?'#bb86fc':'white'}]} onPress={()=>{audioManager.repeat=!audioManager.repeat;UIManager.refresh_ui();}}></Text>
        </View>
    </View>
  );
}

const SearchMenu = ({ navigation }) => {
  const isFocused = useIsFocused();
  if(isFocused){
    UIManager.context = 'search';
  }
  UIC = UIController(navigation);
  const Search = SearchBar(navigation);
  const Ops = Options(navigation);
  const PlaylistOps = PlaylistOptions(navigation);

  let songs = [];
  for(i in YoutubeAPI.search_results){
    let text_color = 'white'
    if(audioManager.song != null){
      text_color = audioManager.song.id == YoutubeAPI.search_results[i].id ? '#bb86fc' : 'white';
    }
    let s = i;
    songs.push(
      <TouchableHighlight underlayColor='#121212' key={s + "0"} onPress={() => {audioManager.play_from_row(s, YoutubeAPI.search_results);playlist_context='search'}}>
        <View key={s} style={styles.row} >
          <Image
            style={[styles.small_img_size, {marginLeft: 10}]} 
            source={{'uri': YoutubeAPI.search_results[i].thumbnail}}
          />
          <View key={'s'+2} style={{width: '70%'}}>
            <Text key={0} style={[styles.text, styles.song_width, {fontSize:20,marginTop:20, color: text_color}]} numberOfLines={1}>{ YoutubeAPI.search_results[i].name }</Text>
            <View key={1} style={[styles.row, {width: '100%'}]}>
              <Text key={2} style={[styles.icon,styles.text, {color: '#bb86fc', display: FileOps.library.local.hasOwnProperty(YoutubeAPI.search_results[i].id) ? 'flex':'none'}]}></Text>
              <Text key={1} style={[styles.text, {fontSize:20, color: 'grey'}]}>{ YoutubeAPI.search_results[i].channel }</Text>
            </View>
          </View>
          <Text key={s+'4'} style={[styles.text, styles.icon , {fontSize:30,marginTop:20, marginRight: 10,marginLeft: 'auto'}]} onPress={() => {selected_song=YoutubeAPI.search_results[s],ops_visible = true;UIManager.refresh_ui();}}></Text>
          <View key={'download-bar'} style={{width: FileOps.currently_downloading.hasOwnProperty(YoutubeAPI.search_results[i].id) ? `${FileOps.currently_downloading[YoutubeAPI.search_results[i].id]*100}%` : '0%',height:'1%',backgroundColor:'#bb86fc',position:'absolute',bottom:0}}></View>
        </View>
      </TouchableHighlight>
    );
  }

  return(
    <View style={{height:'100%'}}>
      
      <Search/>
      <ScrollView>
        { songs }
        <Text style={{fontSize:29}}>End of Playlist</Text>
      </ScrollView>
      <UIC/>
      <Ops/>
      <PlaylistOps/>
    </View>
  );
}

const SearchBar = (navigation) => {
  var text = ''
  return class extends React.Component {
    render(){
     return (
      <TextInput
        style={{marginLeft:'10%',width:'80%',backgroundColor: 'white', padding:20, borderRadius: 10, marginTop: 10}}
        onChangeText={newText => text = newText}
        onSubmitEditing={() => YoutubeAPI.search_yt(text).then(res => {
            YoutubeAPI.search_yt(text).then(() => {
              navigation.navigate('Search', { 'name': this.context });
            });
          }).catch(err => {
            YoutubeAPI.rotate_key();
            YoutubeAPI.search_yt(text).then(() => {
            navigation.navigate('Search', { 'name': this.context });
          });
        })}
        onFocus={()=>UIManager.keyboard_focused = true}
        onBlur={()=>UIManager.keyboard_focused = false}
        placeholder="Search YouTube Songs"
        keyboardType="default"
        keyboardAppearance='dark'
        numberOfLines={1}
      />
     );
    }
  }
}

const Options = (navigation) => {
  return class extends React.Component {
    render(){
     var s = selected_song;
     if(s == null){ s = {id:'null'} }
     return (
      <View style={[styles.options, {opacity: ops_visible ? 100 : 0, zIndex: ops_visible ? 99 : -1}]}>
        <View style={{width:'100%',height:'80%'}}>
          <ScrollView >
            <TouchableHighlight underlayColor='#121212' style={styles.text_ops_container} onPress={() => {playlist_ops_visible=true;ops_visible=false;UIManager.refresh_ui();}}><Text style={[styles.text, styles.text_ops]}>Add to Playlist</Text></TouchableHighlight>
            <TouchableHighlight underlayColor='#121212' style={[styles.text_ops_container, {display: (UIManager.context == 'search'||UIManager.context=='q'||UIManager.context=='Liked Songs') ? 'none' : 'flex'}]} onPress={() => {ops_visible=false;UIManager.refresh_ui();FileOps.remove_from_playlist(UIManager.context, selected_song.id);}}><Text style={[styles.text, styles.text_ops]}>Remove from Playlist</Text></TouchableHighlight>
            <TouchableHighlight underlayColor='#121212' style={styles.text_ops_container} onPress={() => {ops_visible=false;UIManager.refresh_ui();audioManager.add_to_priority(s);}}><Text style={[styles.text, styles.text_ops]}>Add to Queue</Text></TouchableHighlight>
            <TouchableHighlight underlayColor='#121212' style={[styles.text_ops_container, {display:UIManager.context=='q'?'flex':'none'}]} onPress={()=>{ops_visible=false;UIManager.refresh_ui();audioManager.remove_priority(prio_index,prio_list)}}><Text style={[styles.text, styles.text_ops]}>Remove from Queue</Text></TouchableHighlight>
            <TouchableHighlight underlayColor='#121212' style={styles.text_ops_container} onPress={() => {ops_visible=false;UIManager.refresh_ui();FileOps.like(s);}}><Text style={[styles.text, styles.text_ops]}>{FileOps.library.saved.liked_id.hasOwnProperty(s.id)?'Unlike':'Like'}</Text></TouchableHighlight>
            <TouchableHighlight underlayColor='#121212' style={[styles.text_ops_container, {display:library.local.hasOwnProperty(s.id)?'none':'flex'}]} onPress={() => {audioManager.download_from_id(selected_song.id).then(()=>library = FileOps.library);ops_visible=false;UIManager.refresh_ui();}}><Text style={[styles.text, styles.text_ops]}>Download</Text></TouchableHighlight>
            <TouchableHighlight underlayColor='#121212' style={[styles.text_ops_container, {display:library.local.hasOwnProperty(s.id)?'flex':'none'}]} onPress={() => {FileOps.remove_download(selected_song.id).then(()=>library = FileOps.library);ops_visible=false;UIManager.refresh_ui();}}><Text style={[styles.text, styles.text_ops]}>Remove Download</Text></TouchableHighlight>
          </ScrollView>
        </View>
        <TouchableHighlight underlayColor='#121212' style={[styles.text_ops_container, {position: 'absolute', bottom: 0}]} onPress={() => {ops_visible=false;UIManager.refresh_ui();}}><Text style={[styles.text, styles.text_ops]}>Cancel</Text></TouchableHighlight>
      </View>
    );
    } 
  }
}

const PlaylistOptions = (navigation) => {
  let playlist_ops = [];
  for(var playlist in library.playlists){
    let play = playlist;
    playlist_ops.push(<TouchableHighlight underlayColor='#121212' key={playlist} style={[styles.text_ops_container,{height: 60}]} onPress={() => {playlist_ops_visible=false;library = FileOps.add_to_playlist(play, selected_song)}}><Text style={[styles.text, styles.text_ops]}>{ playlist }</Text></TouchableHighlight>)
  }
  return class extends React.Component {
    render(){
     return (
      <View style={[styles.options, {opacity: playlist_ops_visible ? 100 : 0, zIndex: playlist_ops_visible ? 99 : -2}]}>
        <View style={{height: '80%'}}>
          <ScrollView style={{width: '100%'}}>
            {playlist_ops}
          </ScrollView>
        </View>
        <TouchableHighlight underlayColor='#121212' style={[styles.text_ops_container, {position: 'absolute', bottom: 0}]} onPress={() => {playlist_ops_visible=false;UIManager.refresh_ui();}}><Text style={[styles.text, styles.text_ops]}>Cancel</Text></TouchableHighlight>
      </View>
     );
    }
  }
}

const Queue = ({navigation}) => {
  UIC = UIController(navigation);
  const Ops = Options(navigation);
  const PlaylistOps = PlaylistOptions(navigation);
  const isFocused = useIsFocused();
  if(isFocused){
    UIManager.context = 'q';
  }

  let priority_queue = audioManager.get_priority();
  let playlist_queue = audioManager.get_all();
  let priority_queue_display = build_queue(priority_queue, true);
  let playlist_queue_display = build_queue(playlist_queue, false);

  return (
    <View style={{height:'100%',width:'100%'}}>
      <View style={{height:'80%',width:'100%'}}>
        <ScrollView style={{width:'100%'}}>
          <Text style={styles.text}>Next in Queue</Text>
          {priority_queue_display}
          <Text style={styles.text}>{'Next from: ' + playlist_context}</Text>
          {playlist_queue_display}
        </ScrollView>
      </View>
      <UIC/>
      <Ops/>
      <PlaylistOps/>
    </View>
  );
}

function build_queue(priority_queue, prio){
  let res = [];
  for(var i = 0; i < priority_queue.length; i++){
    let s = {'id': priority_queue[i].id, 'name': priority_queue[i].name, 'channel': priority_queue[i].artist, 'thumbnail': priority_queue[i].thumb};
    let j = i;
    res.push(
      <TouchableHighlight underlayColor='#121212' key={i} onPress={() => {}}>
      <View key={1} style={styles.row} >
        <Image
          style={[styles.small_img_size, {marginLeft: 10}]} 
          source={{'uri': library.local.hasOwnProperty(priority_queue[i].id) ? library.local[priority_queue[i].id].thumbnail : priority_queue[i].thumb }}
        />
        <View key={'s'+2} style={{width: '70%'}}>
          <Text key={5} style={[styles.text, {fontSize:20,width:'100%',marginTop:20, color: audioManager.song.id==priority_queue[i].id?'#bb86fc':'white'}, styles.song_width]} numberOfLines={1}>{ priority_queue[i].name }</Text>
          <View key={1} style={[styles.row, {width: '100%'}]}>
            <Text key={2} style={[styles.icon,styles.text, {color: '#bb86fc', display: FileOps.library.local.hasOwnProperty(priority_queue[i].id) ? 'flex':'none'}]}></Text>
            <Text key={1} style={[styles.text, {fontSize:20, color: 'grey'}]}>{ priority_queue[i].artist }</Text>
          </View>
        </View>
        <Text key={4} style={[styles.text, styles.icon , {fontSize:30,marginTop:20, marginRight: 10, marginLeft: 'auto'}]} onPress={() => {selected_song=s;prio_list=prio;prio_index=j;ops_visible = true;UIManager.refresh_ui();}}></Text>
        <View key={'download-bar'} style={{width: FileOps.currently_downloading.hasOwnProperty(priority_queue[i].id) ? `${FileOps.currently_downloading[priority_queue[i].id]*100}%` : '0%',height:'1%',backgroundColor:'#bb86fc',position:'absolute',bottom:0}}></View>
      </View>
    </TouchableHighlight>
    );
  }
  return res;
}

