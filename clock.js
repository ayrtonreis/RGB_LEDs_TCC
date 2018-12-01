const fonts = require('./font.js');
const Weather = require('./weather.js')

function hex2rgb(hex) {
    return ['0x' + hex[1] + hex[2] | 0, '0x' + hex[3] + hex[4] | 0, '0x' + hex[5] + hex[6] | 0];
}

function rgb2hex(rgb) {
    return '#' +
        ('00' + rgb[0].toString(16)).slice(-2) +
        ('00' + rgb[1].toString(16)).slice(-2) +
        ('00' + rgb[2].toString(16)).slice(-2);
}

function getRandomNumber(min,max) {
    const val = Math.random() * (max - min) + min;
    console.log("value: ", val);
    return val;
}

const clockTextInitialPos = {
    h0: [1,0],
    h1: [6,0],
    min0: [1,6],
    min1: [6,6],
    separator: [11,0],
};

const weatherTextInitialPos = {
    negativeSign: [0,0],
    temp0: [1,0],
    temp1: [5,0],
    unit0: [7,6],
    unit1: [9,6],
};

class ClockSymbol{
    constructor(color, x, y, charObj){
        this.color = color;
        this.tempColor = color;

        if(color != null && color.length === 7)
            this.rgbColor = hex2rgb(color);
        else
            this.rgbColor = null;

        this.posX = x || 0;
        this.posY = y || 0;
        this.char = charObj || null;
    }

    setColor(color){
        this.color = color;
    }

    getColor(){
        return this.tempColor;
    }

    colorRamp(seed){

        if(this.rgbColor){
            const rgbNew = this.rgbColor.map(component => {
                const value = Math.ceil(component*(0.8 - 0.4*Math.sin(seed/2)));
                if(value < 0) return 0;
                else if(value > 255) return 255;
                else return value;

            });
            this.tempColor = rgb2hex(rgbNew);
        }
    }

    translateX(val){
        this.posX += val;
    }

    translateY(val){
        this.posY += val;
    }

    setPosition(x, y){
        this.posX = x;
        this.posY = y;
    }
}

class ClockText{
    constructor(font, color){
        this.fontMap = font.chars;
        this.fontWidth = font.metadata.safeWidth;
        this.fontHeight = font.metadata.safeHeight;

        this.h0 = new ClockSymbol(color, ...clockTextInitialPos.h0);
        this.h1 = new ClockSymbol(color, ...clockTextInitialPos.h1);
        this.min0 = new ClockSymbol(color, ...clockTextInitialPos.min0);
        this.min1 = new ClockSymbol(color, ...clockTextInitialPos.min1);
        this.separator = new ClockSymbol(color, ...clockTextInitialPos.separator, font.chars[':']);
    }

    updateText(hour,min){
        if(hour < 24 && min < 60){
            this.h0.char = this.fontMap[Math.floor(hour/10)];
            this.h1.char = this.fontMap[hour % 10];
            this.min0.char = this.fontMap[Math.floor(min/10)];
            this.min1.char = this.fontMap[min % 10];
        }

        return [Math.floor(hour/10), hour % 10, Math.floor(min/10), min % 10];
    }

    getOrderedSymbols(){
        return [this.h0, this.h1, this.separator, this.min0, this.min1];
    }

    resetPosition(){
        this.h0.setPosition(...clockTextInitialPos.h0);
        this.h1.setPosition(...clockTextInitialPos.h1);
        this.min0.setPosition(...clockTextInitialPos.min0);
        this.min1.setPosition(...clockTextInitialPos.min1);
        this.separator.setPosition(...clockTextInitialPos.separator);
    }
}

class WeatherText{
    constructor(font, color){
        this.fontMap = font.chars;
        this.fontWidth = font.metadata.safeWidth;
        this.fontHeight = font.metadata.safeHeight;


        this.negativeSign = new ClockSymbol(color, ...weatherTextInitialPos.negativeSign, font.chars['-']);
        this.temp0 = new ClockSymbol(color, ...weatherTextInitialPos.temp0);
        this.temp1 = new ClockSymbol(color, ...weatherTextInitialPos.temp1);
        //this.temp2 = new ClockSymbol(color, 6, 0);
        this.unitSymbol0 = new ClockSymbol(color, ...weatherTextInitialPos.unit0, font.chars['deg']);
        this.unitSymbol1 = new ClockSymbol(color, ...weatherTextInitialPos.unit1, font.chars['C']);
        this.isTempPositive = true;
    }

    updateText(temp, unit){
        temp = (temp >= -99 && temp <= 99) ? temp : null;

        if(temp >= 0 && !this.isTempPositive){
            this.isTempPositive = true;
            this.temp0.translateX(-3);
            this.temp1.translateX(-3);

        }
        else if(temp < 0){
            if(this.isTempPositive){
                this.isTempPositive = false;
                this.temp0.translateX(3);
                this.temp1.translateX(3);
            }

            temp = -temp;
        }

        this.temp0.char = this.fontMap[Math.floor(temp/10)];
        this.temp1.char = this.fontMap[Math.round(temp%10)];
    }

    getOrderedSymbols(){
        if(this.isTempPositive)
            return [this.temp0, this.temp1, this.unitSymbol0, this.unitSymbol1];
        else
            return [this.negativeSign, this.temp0, this.temp1, this.unitSymbol0, this.unitSymbol1];
    }

    resetPosition(){
        this.negativeSign.setPosition(...weatherTextInitialPos.negativeSign);
        this.temp0.setPosition(...weatherTextInitialPos.temp0);
        this.temp1.setPosition(...weatherTextInitialPos.temp1);
        this.unitSymbol0.setPosition(...weatherTextInitialPos.unit0);
        this.unitSymbol1.setPosition(...weatherTextInitialPos.unit1);
    }
}

class ClockCanvas{
    constructor(arr){
        const sqrtLen = Math.sqrt(arr.length);

        if(Number.isInteger(sqrtLen)){
            this.sideLength = sqrtLen;
            this.internalArray = arr;
        }
    }

    index(x, y){
        if(x < 0 || y < 0 || x >= this.sideLength || y >= this.sideLength)
            return null;
        else
            return y*this.sideLength + x;
    }

    eraseCanvas(newBackgroundColor){
        newBackgroundColor = newBackgroundColor || '#000000';
        this.internalArray.fill(newBackgroundColor);
    }

    plotText(clockText){
        this.eraseCanvas();

        const symbolsArr = clockText.getOrderedSymbols();

        //console.log("fontWidth: ", clockText.fontWidth, "fontHeight: ", clockText.fontHeight);

        for(let symbol of symbolsArr){
            const encoded = symbol.char.array;
            const leftIndex = symbol.char.leftMost;
            const rightIndex = symbol.char.rightMost;

            const startCol = symbol.posX;
            const startRow = symbol.posY;

            //console.log("leftIdx: ", leftIndex, "RightIdx: ", rightIndex);

            for(let row = 0; row < clockText.fontHeight; row++){

                let binNum = encoded[row];

                for(let col = clockText.fontWidth-1; col >= leftIndex; col--){
                    if(col <= rightIndex && binNum % 2 === 1) {
                        const index = this.index(startCol + col - leftIndex, startRow + row);

                        if(index != null)
                            this.internalArray[index] = symbol.getColor();
                        //this.internalArray[0] = '#03ff00';
                    }
                    binNum = binNum >> 1;

                }
            }
        }
    }
}

class Clock{
    constructor(canvas){
        this.mainCanvas = canvas;
        this.clockCanvas = new ClockCanvas(canvas.exportedPixels);
        this.clockText = new ClockText(fonts['4x5'], '#394f9e');
        this.currentHour = null;
        this.currentMin = null;
        this.counter = 0;

        this.weather = new Weather;
        this.weatherText = new WeatherText(fonts['3x5'], '#00c800');

        this.isClockExecuting = false;

        this.isTimeShowing = false;
        this.isTemperatureShowing = false;

    }

    start(){
        this.isClockExecuting = true;
        this.fullCycle();
    }

    stop(){
        this.isClockExecuting = false;

        // setTimeout(()=>{
        //     if(!this.isClockExecuting){
        //         this.clockCanvas.eraseCanvas();
        //         this.mainCanvas.updateEntireCanvas();
        //     }
        //
        // }, 500);

        this.stopShowingTime();
        this.stopShowingTemperature();

        this.clockCanvas.eraseCanvas();
        this.mainCanvas.updateEntireCanvas();
    }

    stopShowingTime(){
        if(this.isTimeShowing){
            this.isTimeShowing = false;
            this.clockText.resetPosition();
        }
    }

    stopShowingTemperature(){
        if(this.isTemperatureShowing){
            this.isTemperatureShowing = false;
            this.weatherText.resetPosition();
        }
    }

    async timeStill(deltaTime){
        const startTime = new Date();
        const self = this;

        function periodical(resolve){
            setTimeout(()=>{
                if(new Date() - startTime < deltaTime && self.isTimeShowing && self.isClockExecuting){
                    self.counter++;
                    self.clockCanvas.plotText(self.clockText);
                    self.mainCanvas.updateEntireCanvas();
                    self.clockText.separator.colorRamp(self.counter);

                    periodical(resolve);
                }
                else{
                    resolve(true); // END OF EXECUTION! Promise resolved
                }
            }, 100);
        }

        return new Promise((resolve, reject) => {
            periodical(resolve);
        });
    }

    startUpdatingTime(){
        const self = this;

        function updateTime(){
            const date = new Date();
            const h = date.getHours();
            const min = date.getMinutes();
            if(h !== self.currentHour || min !== self.currentMin){
                self.clockText.updateText(h, min);
                self.currentHour = h;
                self.currentMin = min;
            }
        }

        function periodical(){
            setTimeout(()=>{
                if(self.isTimeShowing && self.isClockExecuting) {
                    updateTime();
                }
            }, 1000);
        }

        updateTime();
        periodical();
    }

    stopUpdatingTime(){
        this.isTimeShowing = false;
    }

    async timeCycle(){
        this.isTimeShowing = true;
        this.startUpdatingTime();
        await this.timeStill(10000);
        this.stopUpdatingTime();

        return true;
    }

    async temperatureStill(deltaTime){
        if(!this.isClockExecuting || !this.isTemperatureShowing)
            return true;

        //console.log(this.weatherText.getOrderedSymbols());
        const startTime = new Date();
        const self = this;

        function periodical(resolve){
            setTimeout(()=>{
                if(self.isClockExecuting && self.isTemperatureShowing && (new Date() - startTime < deltaTime)){
                    self.clockCanvas.plotText(self.weatherText);
                    self.mainCanvas.updateEntireCanvas();
                    periodical(resolve);
                }
                else{
                    //console.log("FINISHED TEMPERATURE STILL");
                    resolve(true);
                }
            }, 1000);
        }

        return new Promise((resolve, reject)=>{
            periodical(resolve);
        });
    }

    async temperatureTransitionIn(currentTemp){
        if(!this.isClockExecuting || !this.isTemperatureShowing)
            return true;

        //console.log("transition In called");

        /**** HIDE FIRST ROW ****/
        let firstRowDeltaY;

        if(this.weatherText.temp0.posY >= 0){
            firstRowDeltaY = -(this.weatherText.temp0.posY + this.weatherText.fontHeight);
            this.weatherText.temp0.translateY(firstRowDeltaY);
            this.weatherText.temp1.translateY(firstRowDeltaY);
            this.weatherText.negativeSign.translateY(firstRowDeltaY);
        }
        else{
            firstRowDeltaY = this.weatherText.temp0.posY;
        }
        /**** HIDE FIRST ROW ****/

        /**** HIDE SECOND ROW ****/
        let secondRowDeltaY;

        if(this.weatherText.unitSymbol1.posY < this.clockCanvas.sideLength){
            secondRowDeltaY = this.clockCanvas.sideLength-this.weatherText.unitSymbol1.posY;
            this.weatherText.unitSymbol0.translateY(secondRowDeltaY);
            this.weatherText.unitSymbol1.translateY(secondRowDeltaY);
        }
        else{
            secondRowDeltaY = this.weatherText.unitSymbol1.posY - this.clockCanvas.sideLength + this.weatherText.fontHeight + 1;
        }
        /**** HIDE SECOND ROW ****/

        this.weatherText.updateText(currentTemp);
        this.clockCanvas.plotText(this.weatherText);
        this.mainCanvas.updateEntireCanvas();

        return new Promise((resolve, reject)=>{

                const intervalId = setInterval(()=>{
                    if((firstRowDeltaY === 0 && secondRowDeltaY === 0) || !this.isClockExecuting || !this.isTemperatureShowing){
                        clearInterval(intervalId);
                        resolve(true);
                    }
                    else{
                        if(firstRowDeltaY < 0){
                            firstRowDeltaY++;
                            this.weatherText.temp0.translateY(1);
                            this.weatherText.temp1.translateY(1);
                            this.weatherText.negativeSign.translateY(1);
                            this.clockCanvas.plotText(this.weatherText);
                            this.mainCanvas.updateEntireCanvas();
                        }

                        if(secondRowDeltaY > 0){
                            secondRowDeltaY--;
                            this.weatherText.unitSymbol0.translateY(-1);
                            this.weatherText.unitSymbol1.translateY(-1);
                            this.clockCanvas.plotText(this.weatherText);
                            this.mainCanvas.updateEntireCanvas();
                        }
                    }

                }, 500);


        });

    }

    async temperatureTransitionOut(){
        if(!this.isClockExecuting || !this.isTemperatureShowing)
            return true;

        let firstRowDeltaY = -(this.weatherText.temp0.posY + this.weatherText.fontHeight);
        let secondRowDeltaY = this.clockCanvas.sideLength-(this.weatherText.unitSymbol1.posY);

        this.clockCanvas.plotText(this.weatherText);
        this.mainCanvas.updateEntireCanvas();

        return await new Promise((resolve, reject)=>{

                const intervalId = setInterval(()=>{
                    if((firstRowDeltaY === 0 && secondRowDeltaY === 0) || !this.isClockExecuting || !this.isTemperatureShowing){
                        clearInterval(intervalId);
                        resolve(true);
                    }
                    else{
                        if(firstRowDeltaY < 0){
                            firstRowDeltaY++;
                            this.weatherText.temp0.translateY(-1);
                            this.weatherText.temp1.translateY(-1);
                            this.weatherText.negativeSign.translateY(-1);
                            this.clockCanvas.plotText(this.weatherText);
                            this.mainCanvas.updateEntireCanvas();
                        }

                        if(secondRowDeltaY > 0){
                            secondRowDeltaY--;
                            this.weatherText.unitSymbol0.translateY(1);
                            this.weatherText.unitSymbol1.translateY(1);
                            this.clockCanvas.plotText(this.weatherText);
                            this.mainCanvas.updateEntireCanvas();
                        }
                    }

                }, 500);


        });

    }

    async weatherCycle(currentTemp){
        this.isTemperatureShowing = true;
        await this.temperatureTransitionIn(currentTemp);
        await this.temperatureStill(8000);
        await this.temperatureTransitionOut();

        return true;
    }

    async fullCycle(){
        while(this.isClockExecuting){
            const currentTemp = this.weather.getCurrentTemp();
            console.log("CURRENT TEMPERATURE: ", currentTemp);

            await this.timeCycle();

            if(currentTemp != null)
                await this.weatherCycle(currentTemp);
        }
        /*if(currentTemp !== null){
            // TRANSITION TIME
            // START TEMPERATURE
        }*/
    }

    showSomething(){
        let decColor = 0;


        const intervalId = setInterval(()=>{
            const hexColor = '#' + decColor.toString(16).substr(-6);
            console.log(hexColor);
            this.canvas.updateEntireCanvas(new Array(144).fill(hexColor));
            console.log("SHOW SOMETHING!");

            decColor += 0x000011;

        }, 100);

        setTimeout(()=>{
            clearInterval(intervalId);
        },5000)
    }
}

module.exports = Clock;