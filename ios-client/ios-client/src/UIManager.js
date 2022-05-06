class UIManager{
    static navigation = null;
    static context = null;
    static keyboard_focused = false;

    static refresh_ui(){
        if(this.context == 'library'){
            this.navigation.navigate('Playlist', {'name': 'Liked Songs'});
            this.navigation.navigate('Your Library', {'name': 'Liked Songs'});
        }else if(this.context == 'controller'){
            this.navigation.navigate('Controller', { 'name' : this.context});
        }else if(this.context == 'search'){
            if(!this.keyboard_focused){
                this.navigation.navigate('Search', { 'name': this.context });
            }
        }else if(this.context == 'q'){
            this.navigation.navigate('Queue', {'name': this.context});
        }else{
            this.navigation.navigate('Playlist', { 'name': this.context });
        }
    }
}

export default UIManager;