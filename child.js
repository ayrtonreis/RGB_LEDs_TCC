const hsv = require('hsv2rgb');

function get4BytesFromNumber(num){

    return Buffer.from(  [num >> 24 & 0xff,
        num >> 16 & 0xff,
        num >> 8  & 0xff,
        num       & 0xff]);
}

function buildCurrentData(stamp, colorBuffer){
    let prefixData;

    if(stamp > -1)
        prefixData = get4BytesFromNumber(stamp);
    else
        prefixData = Buffer.from([0]);

    return Buffer.concat([prefixData, colorBuffer])

}

function populateColors(buffer, seed){
    let rgb = [0, 0, 0];
    const length = Buffer.byteLength(buffer);

    for(let i=0, j=seed; i+2<length; i+=3){
        hsv(j%360, 1, 1, rgb);
        buffer.writeUInt8(rgb[0],i);
        buffer.writeUInt8(rgb[1],i+1);
        buffer.writeUInt8(rgb[2],i+2);
    }
}

function buildDataWithColors(stamp, dataSize){
    dataSize = dataSize || 1460;
    let prefixData;
    let buffer = Buffer.allocUnsafe(dataSize-4);

    if(stamp > -1)
        prefixData = get4BytesFromNumber(stamp);
    else
        prefixData = Buffer.from([0]);

    populateColors(buffer, stamp);

    return Buffer.concat([prefixData, buffer]);
}

let PORT = 2390;
let HOST = "192.168.43.176";

const dgram = require('dgram');
const client = dgram.createSocket('udp4');

let delta_t = 33;
const packetsNumber = 2147483647; //MAX SIGNED INT
let packetsCounter = 0;
let globalBuffer;

process.on('message', (msg) => {
    //globalBuffer = Buffer.from(msg.data);
    if(msg.sendingDeltaTime !== undefined)
        delta_t = msg.sendingDeltaTime;
    else if(msg.colorFormat) {
        globalBuffer = getBufferFromHexArray(msg.data);
        //console.log(getBufferFromHexArray(msg.data));
        //console.log(globalBuffer);
    }
});

function hex2rgb(hex) {
    return ['0x' + hex[1] + hex[2] | 0,
            '0x' + hex[3] + hex[4] | 0,
            '0x' + hex[5] + hex[6] | 0];
}

function getBufferFromHexArray(arr){
    const len = arr.length*3;

    const buffer = Buffer.allocUnsafe(len);

    for(let i=0; i<len; i+=3){
        const rgb = hex2rgb(arr[i/3]);

        buffer.writeUInt8(rgb[0], i);
        buffer.writeUInt8(rgb[1], i+1);
        buffer.writeUInt8(rgb[2], i+2);
    }

    return buffer;
}

function periodical(){
    const internalDelay = delta_t;
    setInterval(function(){
        //globalBuffer = buildDataWithColors(packetsCounter+1);

        if(globalBuffer !== undefined){
            const tempBuffer = buildCurrentData(packetsCounter+1, globalBuffer);
            client.send(tempBuffer, 0, tempBuffer.length, PORT, HOST, function(err, bytes) {
                //console.log('UDP client message sent to ' + HOST +':'+ PORT);
            });

            //console.log("Sent: " + (packetsCounter+1) + " id: " + globalBuffer[3]);

            packetsCounter += 1;

            //console.log(delta_t);

            // Check stop condition for the loop
            if (packetsCounter >= packetsNumber || internalDelay !== delta_t){
                clearInterval(this);

                 if(internalDelay !== delta_t)
                      periodical();
            }
        }
    }, internalDelay);
}

periodical();


client.on('message', function (buffer, remote) {
    try {
        const json = JSON.parse(buffer.toString());
        //console.log(json)
        process.send(json);
    }
    catch(err){
        //console.log("ERROR!");
        console.log(remote.address + ':' + remote.port +' - ' + buffer);
    }

});
