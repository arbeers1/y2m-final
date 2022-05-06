# y2m-final
Music streaming platform for Desktop/IOS akin to Spotify.  
This is a free alternative to spotify which allows for additional music found on Youtube such as unreleased songs, covers, acoustic versions, user modified content, parodies, and other content that may not typically be allowed or uploaded on Spotify.  
# Screenshots  
### DESKTOP:  
![Alt text](/images/desk_1.PNG?raw=true)
![Alt text](/images/desk_2.PNG?raw=true)
![Alt text](/images/desk_3.PNG?raw=true)
### IOS:  
![Alt text](/images/ios_1.png?raw=true)
![Alt text](/images/ios_2.png?raw=true)
![Alt text](/images/ios_3.png?raw=true)
![Alt text](/images/ios_4.png?raw=true)

# Installation  
#### Note: some features may not work because they're not implemented. (Downloads for desktop, artist profiles).  
#### Note: Playback utilizes Youtube's non-public api and is therefore vulnerable to break in the future and may not work if Youtube modifies their algorithm for deciphering playback auth codes.  
#### Note: API keys for searching songs are global and heavily rate limited. Therefore, search may be unavailable. API keys are not required for playback. You can modify the Api keys in lib.json with your own personal API Keys created by following instructions on the YouTube API documentation. Modifying keys for IOS requires a rebuild with EXPO. Modifying keys for desktop can be done by navigating to resources/app/library/lib.json and modifying the existing API Keys. You can add as many as you want.  
  
#### Desktop: https://www.dropbox.com/sh/cqcx6zeglh7g1sh/AADxo3hS1H5cTasFDhxlSoD7a?dl=0  
Download the files to a folder and double click on the Y2M executable file. Target is Windows x64.  
  
#### IOS (Requires ExpoGO app installed): exp://exp.host/@treehugger9k/ios-client?release-channel=default  
##### Note: Due to limitations in the expo audio player, it is highly recommended to download the song before playing to avoid excessive load times.  
Visit the link on your phone and the app will open in ExpoGO. A standalone ipa is not possible due to price. Some features such as playing with screen off do not work due to this limitation of operating with ExpoGo.  
