// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron');

ipcRenderer.on('channelTextEditing', (e, data)=>{
    console.log(data);
});

let vueObj = new Vue({
	el: '#app',
	data: {
		name: 'Ayrton',
		signalStrength: 0,
		pps: 0,
		isCommunicationOn: false,
        controllerSendingTime: 33,
        controllerBrightness: 30,
        canvasMode: 'painting',
        brushColor: '#ff0000',
        brushMode: 'pixel',
	},

	methods:{
		toggleCommunication: function(){
			this.isCommunicationOn = !this.isCommunicationOn;
		},
        openTextEditingWindow: function(){
            ipcRenderer.send('showTextEditingWindow');
        },
        sendPixelData: function(arr){
		    try{
		        udpRunner.sendPixelData(arr);
            }
            catch(err){
		        console.error(err);
            }
        },
        clearMainCanvas: function(){
		    try{
		        canvas.changeEntireCanvasColor('#000000');
            }
            catch(err){
		        console.error(err);
            }
        },

        canvasModePainting: function(){
            this.canvasMode = 'painting';
        },

        canvasModeClock: function(){
            this.canvasMode = 'clock';
        },

        startCanvasModeClock: function(){
		    try {
                clock.start();
            }
            catch(err){
		        console.error(err);
            }
        },

        stopCanvasModeClock: function(){
            try {
                clock.stop();
            }
            catch(err){
                console.error(err);
            }
        },

        canvasModeText: function(){
            this.canvasMode = 'text';
        },

        canvasModeDemo: function(){
            this.canvasMode = 'demo';
        },
	},
	computed:{
		communicationButtonLabel: function(){
			startOrPauseCommunication(this.isCommunicationOn);
			return (this.isCommunicationOn ? "STOP" : "START");
		},
		fpsIdeal: function(){
			const num = 1000/this.controllerSendingTime;
			return num.toFixed(1);
		},
        isBrushModeSinglePixel: function(){
		    return this.canvasMode === 'painting' && this.brushMode === 'pixel';
        }
	},
	watch:{
		controllerSendingTime: function(newValue, oldValue){
			//Check if undefined, null or less than 1
			if(!(newValue > 1)){
				newValue = this.controllerSendingTime = 1;
			}
			console.log(newValue);
			udpRunner.changeSendingTime(newValue);
		},
        brushColor: function(newColor, oldColor){
		    if(this.brushMode === 'canvas'){
		        try{
                    canvas.changeEntireCanvasColor(newColor);
                }
                catch(err){
                    console.error(err);
                }
            }
        },
        brushMode: function(newMode, oldMode){
		    if(newMode === 'canvas' && newMode !== oldMode){
		        try{
		            canvas.changeEntireCanvasColor();
                }
                catch(err){
		            console.error(err);
                }
            }
        },

        canvasMode: function(newMode, oldMode){
		    function capitalizeFirstLetter(str){
		        return str && str[0].toUpperCase() + str.substr(1);
            }

		    const startFunction = this['startCanvasMode'+capitalizeFirstLetter(newMode)];
            const stopFunction = this['stopCanvasMode'+capitalizeFirstLetter(oldMode)];

            if(startFunction) startFunction();
            if(stopFunction) stopFunction();

        },
	},
});


function getData(){
	return 30;
}

const trace_avg = {
    y: [getData()],
    type: 'line',
    xaxis: 'x1',
    yaxis: 'y1',
};

const trace_min = {
    y: [getData()],
    type: 'line',
    xaxis: 'x2',
    yaxis: 'y2',
};

const trace_max = {
    y: [getData()],
    type: 'line',
    xaxis: 'x2',
    yaxis: 'y2',
};

const trace_lost = {
    y: [100],
    type: 'line',
    xaxis: 'x3',
    yaxis: 'y3',
};

const trace_signal = {
    y: [getData()],
    type: 'line',
    xaxis: 'x4',
    yaxis: 'y4',
};

const data = [trace_avg, trace_min, trace_max, trace_lost, trace_signal];

const layout = {
    title: 'Analysis of Δt between consecutive packets of data',
    grid: {
        rows: 4,
        columns: 1,
        pattern: 'independent'
    },
    yaxis1: {range: [0, 100], title: 'average Δt (ms)'},
    yaxis2: {range: [0, 100], title: 'min & max Δt (ms)'},
    yaxis3: {range: [0, 100], title: 'loss rate (%)'},
    yaxis4: {range: [0, -100], title: 'signal (dBm)'}
};

try{Plotly.plot('chart-main', data, layout);} catch(err){};

const CommHandler = require('./start_udp');
const udpRunner = new CommHandler();

udpRunner.bindObjectsToUpdate(Plotly, vueObj);
udpRunner.run();

function startOrPauseCommunication(isStart){
	try{
        if(udpRunner){
            if(isStart)
                udpRunner.run();
            else
                udpRunner.pause();
        }
	}
	catch(err){
		console.error("udpRunner is not defined yet");
	}
}

// setInterval(function(){
// 	Plotly.extendTraces('chart', {y:[[getData()]]}, [0]);
// }, 500)

const Canvas = require('./main-canvas.js');

const canvas = new Canvas('main-canvas', 12, vueObj);
canvas.createRect();

/////////////////////////////////////////////////////////////////////////
const Clock = require('./clock.js');
const clock = new Clock(canvas);

//clock.start();