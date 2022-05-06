class SongNode{
    constructor(url, retrieval_code, id, name, artist, thumb){
        this.url = url;
        this.next = null;
        this.prev = null;
        this.retrieval_code = retrieval_code;
        this.id = id;
        this.name = name;
        this.thumb = thumb;
        this.artist = artist;
        this.skip = false;
        this.duration = 0;
    }
}

class SongQueue{
    static length = 0;
    static head = null;
    static tail = null;
    static priority_queue = []; //Special queue for user selected songs which take priority over auto-genned songs.
    static priority_index = -1;

    static push(url, retrieval_code, id, name, artist, thumb){
        let node = new SongNode(url, retrieval_code, id, name, artist, thumb);

        if(this.length == 0){
            this.tail = node;
            this.head = node;
        }else{
            this.tail.next = node;
            node.prev = this.tail;
            this.tail = node;
        }

        this.length++;
    }

    static push_priority(url, retrieval_code, id, name, artist, thumb){
        let node = new SongNode(url, retrieval_code, id, name, artist, thumb);
        this.priority_queue.push(node);
        return this.priority_queue.length - 1;
    }

    static pop_priority(){
        if(this.priority_index < this.priority_queue.length - 1){
            this.priority_index++;
            return this.priority_queue[this.priority_index];
        }else{
            this.priority_queue = [];
            this.priority_index = -1;
            return null;
        }
    }

    //NOTE: Navigation of the queue should be done through the SongNodes next/prev members.
    // Navigation is done this way to preserve queue ordering, even after a node has already been traversed.
    // This method only serves to get the head at the initialization of a queue.
    static pop(){
        if(this.length == 0){
            return null;
        }

        //this.length--;
        return this.head;
    }

    static clear(){
        this.length = 0;
        this.head = null;
        this.tail = null;
    }

    //Fisher Yates Random Shuffle Algoritm
    static shuffle(){
        let queue = this.toArray();
        for(var i = this.length - 1; i > 0; i--){
            let j = Math.floor(Math.random() * (i+1));
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }
        return queue;
    }

    static shuffle(queue){
        for(var i = queue.length - 1; i > 0; i--){
            let j = Math.floor(Math.random() * (i+1));
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }
        for(var i = 0; i < queue.length; i++){ let s = queue[i];queue[i] = new SongNode(null, null, s.id, s.name, s.channel, s.thumbnail); }
        for(var i = 0; i < queue.length; i++){
            if(i > 0) { queue[i].prev = queue[i-1]; }
            if(i < queue.length - 1 ) { console.log('QQ ', queue[i].name, queue[i+1].name);queue[i].next = queue[i + 1]; }
        }
        return queue;
    }

    static toArray(){
        let list = new Array();
        let current = this.head;
        for(var i = 0; i < this.length; i++){
            list.push(current);
            if(i != length - 1){
                current = current.next;
            }
        }
        return list;
    }
}

export default SongQueue;