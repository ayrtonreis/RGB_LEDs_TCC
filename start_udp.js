const { fork } = require('child_process');

function get4BytesFromNumber(num){

    return Buffer.from(  [num >> 24 & 0xff,
        num >> 16 & 0xff,
        num >> 8  & 0xff,
        num       & 0xff]);
}

function buildData(stamp, dataSize){
    dataSize = dataSize || 1460;
    let prefixData;
    let buffer = Buffer.allocUnsafe(dataSize-1);

    if(stamp > -1)
        prefixData = get4BytesFromNumber(stamp);
    else
        prefixData = Buffer.from([0]);


    for(let i=0; i<dataSize-1; i++)
        buffer.writeUInt8(i%256,i);

    return Buffer.concat([prefixData, buffer])

}

// VARIABLES DEFINED OUTSIDE WORK AS STATIC PRIVATE MEMBERS
// GOOD FOR SINGLETON CLASSES
const global = {
    isRunning: false
}; //the obj is constant, but its properties aren't

class CommunicationHandler {
    constructor(){
        // public
        this.propX = 0;

        // "private"
        let _stop = true;

        // Setters and Getters for "private" members
        // Workaround to simulate private members behavior
        this.setStop = function(stop) { _stop = stop; };
        this.getStop = function() { return _stop; };

        // This member is indeed public, but only the methods
        // inside the class should play with it
        this._forked = fork('child.js');
    }

    bindObjectsToUpdate(Plotly, vueObj){
        let counter = 0;
        const maxCounter = 500;

        this._forked.on('message', (msg) => {
            if(global.isRunning){
                //console.log('Message from child', Number(msg));
                vueObj.signalStrength = msg.signal;
                vueObj.pps = msg.pps;
                Plotly.extendTraces('chart-main', {y:[[Number(msg.deltaTime)]]}, [0]);
                Plotly.extendTraces('chart-main', {y:[[Number(msg.minDeltaTime)]]}, [1]);
                Plotly.extendTraces('chart-main', {y:[[Number(msg.maxDeltaTime)]]}, [2]);
                Plotly.extendTraces('chart-main', {y:[[Number(msg.lossRate)]]}, [3]);
                Plotly.extendTraces('chart-main', {y:[[Number(msg.signal)]]}, [4]);
                counter++;


                if(counter > maxCounter){
                    Plotly.relayout('chart-main',{
                        xaxis1: {range: [counter-maxCounter, counter]},
                        xaxis2: {range: [counter-maxCounter, counter]},
                        xaxis3: {range: [counter-maxCounter, counter]},
                        xaxis4: {range: [counter-maxCounter, counter]},

                    });
                }
            }
        });
    }

    run(){
        const self = this;

        const delta_t = 50;
        const packetsNumber = 1000;
        let packetsCounter = 0;

        if(!global.isRunning){
            global.isRunning = true;
            setInterval(function(){
                const message = buildData(packetsCounter+1);
                self._forked.send(message);

                // Check stop condition for the loop
                if (self.getStop()){
                    clearInterval(this);
                    global.isRunning = false;
                    self.setStop(false);
                }
            }, 1000);
        }
        else{
            console.log("NOT ALLOWED!");
        }
    }

    pause(){
        this.setStop(true);
    }

    changeSendingTime(deltaTime){
        console.log(deltaTime);
        this._forked.send({sendingDeltaTime : deltaTime});
    }

    sendPixelData(arr){
        const pixelData = {'colorFormat': 'hex', data: arr};

        this._forked.send(pixelData);
    }
}

module.exports = CommunicationHandler;

