import { StyleSheet } from 'react-native';
import * as Device from 'expo-device';

var styles;

if(!Device.modelName.includes('iPhone')){
  styles = StyleSheet.create({
    font:{
      fontSize:30
    },
    font_song:{
      fontSize:20
    },
    icon_font:{
      fontSize:45
    },
    song_width:{
      width:'100%'
    },
    small_img_size:{
      width: 100,
      height: 100
    },
    image_def: {
      height: '65%'
    },
    container: {
      flex: 1,
    },
    text: {
      color: "white",
      fontSize: 30,
      marginLeft: 20,
      marginTop: '1%',
      overflow: 'hidden',
    },
    text_press: {
      backgroundColor: 'black'
    },
    row:{
      flexDirection: 'row',
      flexWrap: 'nowrap'
    },
    title: {
      fontWeight: 'bold',
      marginTop: '3%',
      marginLeft: '3%',
      fontSize: 40
    },
    nav_main: {
      backgroundColor: '#1d1d1d',
      height: '50%',
    },
    nav_container: {
      width: '100%',
      position: 'absolute',
      left: 0,
      bottom: 0,
    },
    nav_label: {
        width: '50%',
        textAlign: 'center'
    },
    play_container: {
      width: '90%',
      marginLeft: '5%',
      backgroundColor: '#121212',
      marginBottom: '1%',
      borderRadius: 5,
    },
    icon: {
      fontFamily: 'holo',
      fontSize: 50,
    },
    artist: {
      color:'grey',
      fontSize:20
    },
    options: {
      backgroundColor: '#1d1d1d',
      width:'50%',
      height:'50%',
      position: 'absolute',
      top: '25%',
      left: '25%',
      borderRadius: 10
    },
    text_ops: {
      width: '100%',
      height: '100%',
      marginLeft: 0,
      textAlign: 'center',
    },
    text_ops_container: {
      width: '100%',
      height: 50,
    },
    create_playlist: {
      width:'80%',
      backgroundColor: 'white',
      padding:20,
      borderRadius: 10,
      position: 'absolute',
      top: 10,
      left: '10%'
    }
  });
}else {
  styles = StyleSheet.create({
    font:{
      fontSize:20
    },
    font_song:{
      fontSize:20
    },
    font_song_main:{
      fontSize:20
    },
    icon_font:{
      marginTop: 10,
      fontSize:30
    },
    song_width:{
      width:'70%'
    },
    small_img_size:{
      width: 80,
      height: 80
    },
    image_def: {
      height: '55%',
      marginBottom: '10%'
    },
    container: {
      flex: 1,
    },
    text: {
      color: "white",
      fontSize: 30,
      marginLeft: 20,
      marginTop: '1%',
      overflow: 'hidden',
    },
    text_press: {
      backgroundColor: 'black'
    },
    row:{
      flexDirection: 'row',
      flexWrap: 'nowrap'
    },
    title: {
      fontWeight: 'bold',
      marginTop: '3%',
      marginLeft: '3%',
      fontSize: 40
    },
    nav_main: {
      backgroundColor: '#1d1d1d',
      height: '50%',
    },
    nav_container: {
      width: '100%',
      position: 'absolute',
      left: 0,
      bottom: 0,
    },
    nav_label: {
        width: '50%',
        textAlign: 'center'
    },
    play_container: {
      width: '90%',
      marginLeft: '5%',
      backgroundColor: '#121212',
      marginBottom: '1%',
      borderRadius: 5,
    },
    icon: {
      fontFamily: 'holo',
      fontSize: 50,
    },
    artist: {
      color:'grey',
      fontSize:20
    },
    options: {
      backgroundColor: '#1d1d1d',
      width:'80%',
      height:'60%',
      position: 'absolute',
      top: '20%',
      left: '10%',
      borderRadius: 10
    },
    text_ops: {
      width: '100%',
      height: '100%',
      marginLeft: 0,
      textAlign: 'center',
    },
    text_ops_container: {
      width: '100%',
      height: 50,
    },
    create_playlist: {
      width:'80%',
      backgroundColor: 'white',
      padding:20,
      borderRadius: 10,
      position: 'absolute',
      top: 10,
      left: '10%'
    }
  });
}

export default styles;