const {ipcRenderer} = require('electron');


let vueObj = new Vue({
    el: '#app',
    data: {
        textArea: "Enter your text",
        backgroundColor: "#000000",
        textColor: "#ff953a",
    },
    methods:{
        sendIpcMsg: function(){
            ipcRenderer.send('msgFromTextEditingWindow', {'key': [1, 2, 3]});
        },
    },
    watch:{
        textArea: function(newStr, oldStr){
            try{
                canvas.updateText(newStr);
            }
            catch(e){
                console.error("Error on updating text on canvas!");
                console.error(e);
            }

        },
        backgroundColor: function(newColor, oldColor){
            try{
                canvas.setBackgroundColor(newColor);
                console.log("SET BKG COLOR");
            }
            catch(e){
                console.error("canvas obj e is not defined!");
            }
        },
        textColor: function(newColor, oldColor){
            try{
                canvas.setTextColor(newColor);
                console.log("SET TEXT COLOR");
            }
            catch(e){
                console.error("canvas obj e is not defined!");
            }
        }
    }

});

const fonts = require('./font.js');
const Canvas = require('./text-canvas.js');

const canvas = new Canvas('preview-text-canvas',
                          {text: vueObj.textColor, background: vueObj.backgroundColor},
                           fonts['testing-font'], vueObj.textArea);


