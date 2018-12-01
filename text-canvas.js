const fontHorizontalSpan = 12;

// checks if str2 = str1 + str3, where str3 is an arbitrary new string
function isConcatString(str1, str2){

    for(let i=0; i<str1.length; i++){
        if(str1[i] !== str2[i])
            return false;
    }
    return true;
}

class Stage{
    constructor(rows, cols, font, colorObj){
        this.titleSize = 5; //5
        ////this.matrix = new Array(rows);
        this.margin = 0.8*this.titleSize;

        this.fontMap = font.chars;
        this.fontWidth = font.metadata.safeWidth;
        this.fontHeight = font.metadata.safeHeight;

        this.maxCharsPerRow = Math.floor(cols/this.fontWidth);

        this.textColor = colorObj.text || '#ffffff';
        this.backgroundColor = colorObj.background || '#000000';

        // for(let row = 0; row < this.matrix.length; row++){
        //     this.matrix[row] = new Array(cols);
        //
        //
        //     for(let i = 0; i<cols; i++)
        //         this.matrix[row][i] = null;
        // }
        //

        this.totalRows = rows;
        this.totalCols = cols;

        this.boardSize = {
            width: this.titleSize * cols + 2*this.margin,
            height: this.titleSize * rows + 2*this.margin
        };

        this.currentOrigin = {row: 0, col: 0};
    }

    /*plotChar(encoded, startRow, startCol){
        for(let row = 0; row < encoded.length; row++){
            let binNum = encoded[row];

            for(let col=fontHorizontalSpan-1; col>=0; col--){
                if(binNum % 2 === 1)
                    this.matrix[startRow + row][startCol + col] = this.textColor;
                binNum = binNum >> 1;
            }
        }
    }*/

    /*getOriginFromIndex(index){
        const top = this.fontHeight*Math.floor(index / this.maxCharsPerRow);
        const left = (index % this.maxCharsPerRow) * this.fontWidth;

        //console.log(left, top);
        return [left, top];
    }*/

    plotChar(char, ctx){
        ctx.save();

        ctx.translate(this.margin+0.5,this.margin+0.5); //0.5 is just a hack

        ctx.fillStyle = this.textColor;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.25;

        let charObj = this.fontMap[char] || this.fontMap['invalid'];


        const encoded = charObj.array;
        const leftIndex = charObj.leftMost;
        const rightIndex = charObj.rightMost;

        let startRow, startCol;

        [startCol, startRow] = this.getOriginNextChar(rightIndex-leftIndex+1);

        for(let row = 0; row < this.fontHeight; row++){
            let binNum = encoded[row];

            for(let col=this.fontWidth-1; col>=leftIndex; col--){
                if(col <= rightIndex && binNum % 2 === 1) {
                    //this.matrix[startRow + row][startCol + col] = this.textColor;
                    ctx.fillRect((startCol + col - leftIndex) * this.titleSize,
                        (startRow + row) * this.titleSize,
                        this.titleSize, this.titleSize);
                    ctx.strokeRect((startCol + col - leftIndex) * this.titleSize,
                        (startRow + row) * this.titleSize,
                        this.titleSize, this.titleSize);
                }
                binNum = binNum >> 1;
            }
        }

        ctx.restore();
    }

    pushChar(char, ctx){
        this.plotChar(char, ctx)
    }

    clearAll(ctx){
        this.currentOrigin.row = this.currentOrigin.col = 0;
        this.drawBackground(ctx);
    }

    getOriginNextChar(charWidth){
        let left = -1, top = -1;

        if(this.currentOrigin.col + charWidth + 1> this.totalCols){
            //console.warn("first condition");
            top = this.currentOrigin.row + this.fontHeight;
            left = 0;

            // Current Origin is updated because a new char will be added
            this.currentOrigin.row = top;
            this.currentOrigin.col = left + charWidth;
        }
        else{
            //console.warn("second condition");
            top = this.currentOrigin.row;
            left = this.currentOrigin.col > 0 ? this.currentOrigin.col + 1 : 0;
            // Current Origin is updated because a new char will be added
            this.currentOrigin.col = left + charWidth;
        }
        
        return [left, top];
    }

    /*draw(ctx){
        ctx.save();
        //  Draw background rectangle
        ctx.beginPath();
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.boardSize.width, this.boardSize.height);
        ctx.translate(this.margin+0.5,this.margin+0.5); //0.5 is just a hack

        // this.matrix.forEach((row, y) => {
        //     row.forEach((value, x) => {
        //         let xPos = x * this.titleSize;
        //         let yPos = y * this.titleSize;
        //         //ctx.save();
        //         ctx.beginPath();
        //         ctx.strokeRect(xPos, yPos, this.titleSize, this.titleSize);
        //         ctx.fillStyle = (value === null ? this.backgroundColor : this.textColor);
        //         ctx.fillRect(xPos, yPos, this.titleSize, this.titleSize);
        //         ctx.stroke();
        //         //ctx.restore();
        //     });
        // });


        ctx.fillStyle = 'red';
        const thickness = 0.5;

        const h = this.boardSize.height-1.5*this.titleSize;
        const w = this.boardSize.width-1.5*this.titleSize;
        //draw vertical lines
        for(let left = 0; left<=w; left+=this.titleSize){
            ctx.fillRect(left, 0, thickness, h); //left, top, width, height
        }
        //draw horizontal lines
        for(let top = 0; top<=h; top+=this.titleSize){
            ctx.fillRect(0, top, w, thickness); //left, top, width, height
        }



        ctx.restore();
    }*/

    drawBackground(ctx){
        //  Draw background rectangle
        ctx.beginPath();
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.boardSize.width, this.boardSize.height);
    }

    drawGrid(ctx){
        ctx.save();

        ctx.translate(this.margin+0.5,this.margin+0.5); //0.5 is just a hack

        ctx.fillStyle = '#000000';
        const thickness = 0.5;

        const h = this.boardSize.height-1.5*this.titleSize;
        const w = this.boardSize.width-1.5*this.titleSize;
        //draw vertical lines
        for(let left = 0; left<=w; left+=this.titleSize){
            ctx.fillRect(left, 0, thickness, h); //left, top, width, height
        }
        //draw horizontal lines
        for(let top = 0; top<=h; top+=this.titleSize){
            ctx.fillRect(0, top, w, thickness); //left, top, width, height
        }

        ctx.restore();
    }
}


class TextCanvas{
    constructor(canvasId, colorObj, font, initialText){
        this.currentStr = initialText || '';

        let canvas = document.getElementById(canvasId);

        this.stage = new Stage(12*8,64, font, colorObj); //128
        canvas.width = this.stage.boardSize.width;
        canvas.height = this.stage.boardSize.height;


        this.context = canvas.getContext("2d");

        this.plotEntireText(this.currentStr);
    }

    /*plotChars(){
        //this.stage.plotChar(font['A'],0,0);

        this.stage.plotChar('Á', this.context);
        this.stage.plotChar('Y', this.context);
        this.stage.plotChar('y', this.context);
        this.stage.plotChar('D', this.context);
        this.stage.plotChar('ç', this.context);

        this.stage.drawGrid(this.context);




        // setTimeout(()=>{
        //     this.stage.clearAll(this.context);
        //     setTimeout(()=>{
        //         this.stage.plotChar('Á', this.context);
        //     }, 1000);
        // }, 2000);

    }*/

    updateText(newStr){

        if(isConcatString(this.currentStr, newStr)){
            for(let i = this.currentStr.length; i < newStr.length; i++){
                this.stage.plotChar(newStr[i], this.context);
            }
        }
        else{
            this.plotEntireText(newStr);
        }

        console.log('old str: ' + this.currentStr);
        console.log('new str: ' + newStr);

        this.currentStr = newStr;
    }

    plotEntireText(str){
        this.stage.clearAll(this.context);
        this.stage.drawGrid(this.context);

        for(let char of str)
            this.stage.plotChar(char, this.context);
    }

    setBackgroundColor(color){
        this.stage.backgroundColor = color;
        this.plotEntireText(this.currentStr);
    }

    setTextColor(color){
        this.stage.textColor = color;
        this.plotEntireText(this.currentStr);
    }
}


class _TextCanvas{
    constructor(canvasId, optionsObj){
        this.canvas = new fabric.StaticCanvas(canvasId, { width: 800, height: 400 });
        this.canvas.selection = false; // disable group selection
        this.canvas.backgroundColor ='black';
        this.options = optionsObj;

    }

    changePixelColor(pixel){
        pixel.set('fill', this.options.brushColor);
        this.canvas.renderAll();
    }

    createRect(){
        const sideLen = 8;
        const rows = 0, cols = 0;
        const margin = 0.5;
        const outterMargin = 2;

        for(let row=0; row<rows; row++){
            for(let col=0; col<cols; col++){
                // create a rectangle with angle=45
                const rect = new fabric.Rect({
                    left: outterMargin +(margin + sideLen)*col,
                    top: outterMargin +(margin + sideLen)*row,
                    selectable: false,
                    hasControls : false,
                    hasBorders : false,
                    lockMovementX : true,
                    lockMovementY : true,
                    hoverCursor: 'pointer',
                    fill: '#adccff',
                    width: sideLen,
                    height: sideLen,
                    isPixel: true
                });

                this.canvas.add(rect);
            }
        }
    }
}

module.exports = TextCanvas;