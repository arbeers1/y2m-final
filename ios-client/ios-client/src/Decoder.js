import axios from 'axios';

class Decoder{

    static decrypt_funcs = [
        ['reverse', 'slice', 'swap'],
        ['reverse', 'swap', 'slice'],
        ['swap', 'reverse', 'slice'],
        ['swap', 'slice', 'reverse'],
        ['slice', 'reverse', 'swap'],
        ['slice', 'swap', 'reverse']
    ];
    //TODO: Investigate if these function combinations yield duplicate results

    static async get_decoded_url(signatureCipher, html){
        const uri = decodeURIComponent(decodeURIComponent(signatureCipher.match('https.*')[0]));
        //s = encrypted code
        let s = signatureCipher.match('s=.*&')[0]
        s = decodeURIComponent(s.substring(2,s.length-8));
        const decrypt_ops = await this.get_decrypt_ops(html);
        s_arr = this.decrypt_s(s, decrypt_ops);

        for(var i=0; i < s_arr.length; i++){
            s_arr[i] = uri + '&sig=' + s_arr[i]; 
        }

        return s_arr;
    }

    static decrypt_s(s, decrypt_ops){
        const s_copy = s.split('');
        s_arr = [];

        for(var i=0; i<6; i++){
            var func_map = {};
            var funcs = this.decrypt_funcs[i].slice();

            for(var j=0; j < decrypt_ops.length; j++){
                let func = decrypt_ops[j].substring(0, decrypt_ops[j].indexOf('('));
                if(!func_map.hasOwnProperty(func)){
                    func_map[func] = funcs.pop();
                }
            }

            var s_new = s_copy.slice();
            for(var j=0; j < decrypt_ops.length; j++){
                let op = decrypt_ops[j];
                const index = parseInt(op.substring(op.indexOf(',')+1, op.indexOf(')')));
                op = func_map[op.substring(0,op.indexOf('('))];
                if(op == 'reverse'){
                    s_new = s_new.reverse();
                }else if(op == 'swap'){
                    temp = s_new[0];
                    s_new[0] = s_new[index];
                    s_new[index] = temp;
                }else if(op == 'slice'){
                    s_new = s_new.slice(index);
                }
            }

            s_arr.push(s_new.join(''));
        }

        return s_arr;
    }

    static async get_decrypt_ops(html){
        let decrypt_uri = html.match(/src=\"(\/s\/.*\/player_ias.vflset\/en_US\/base.js)/)[0]; 
        decrypt_uri = 'https://youtube.com/' + decrypt_uri.substring(5);
        
        let response = await axios.get(decrypt_uri, {
            headers: {
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
            }})
        .catch(error => {
            console.log(error);
        });

        let decrypt_ops = response.data.substring(0,response.data.length / 2);
        decrypt_ops = decrypt_ops.match(/a=a.split\(\"\"\).*return/)[0];
        decrypt_ops = decrypt_ops.substring(14, decrypt_ops.length - 7);
        return decrypt_ops.split(';');
    }
}

export default Decoder;