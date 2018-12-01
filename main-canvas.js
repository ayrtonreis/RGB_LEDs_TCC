


class Canvas{
    constructor(canvasId, sideNum, optionsObj){
        const sideLen = 400;
        this.sideNum = sideNum || 12;
        this.canvas = new fabric.Canvas(canvasId, { width: sideLen, height: sideLen});
        this.canvas.selection = false; // disable group selection
        this.canvas.backgroundColor ='black';

        this.listOfFabricPixels = new Array(sideNum*sideNum);
        this.exportedPixels = Array(this.sideNum*this.sideNum).fill('#000000');

        this.options = optionsObj;

        this.isMousePressed = false;

        const self = this;

        this.canvas.on('mouse:down', function(e) {
            self.isMousePressed = true;
            const activeObj = e.target;

            if(activeObj && activeObj.isPixel && self.options.isBrushModeSinglePixel){
                self.changePixelColor(activeObj);
            }
        });

        this.canvas.on('mouse:move', function(e){
            const activeObj = e.target;
            if(self.isMousePressed && activeObj && activeObj.isPixel && self.options.isBrushModeSinglePixel)
                self.changePixelColor(activeObj)
        });

        this.canvas.on('mouse:up', function(e){
            self.isMousePressed = false;
        });

    }

    changePixelColor(pixel){
        this.updateExportedPixel(pixel.pixelIndex, this.options.brushColor)
        pixel.set('fill', this.options.brushColor);
        this.canvas.renderAll();
    }

    changeEntireCanvasColor(color){
        color = color || this.options.brushColor;

        this.exportedPixels.fill(color);
        this.options.sendPixelData(this.exportedPixels);

        for(let pixel of this.listOfFabricPixels){
            pixel.set('fill', color);
        }

        this.canvas.renderAll();
    }

    updateEntireCanvas(colorArray){
        if(colorArray != null && colorArray.length === this.exportedPixels.length){
            this.exportedPixels = colorArray;
        }

        this.options.sendPixelData(this.exportedPixels);

        for(let i=0; i<this.exportedPixels.length; i++){
            this.listOfFabricPixels[i].set('fill', this.exportedPixels[i]);
        }

        this.canvas.renderAll();
    }

    updateExportedPixel(index, color){
        this.exportedPixels[index] = color;
        this.options.sendPixelData(this.exportedPixels);
    }

    createRect(){
        const rows = this.sideNum, cols = this.sideNum;
        const margin = 4;
        const outterMargin = margin * 4;
        const sideLen = (this.canvas.width - 2*outterMargin + margin)/rows - margin;


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
                    fill: 'red',
                    width: sideLen,
                    height: sideLen,
                    isPixel: true,
                    pixelIndex: col + row*this.sideNum
                });

                this.canvas.add(rect);
                this.listOfFabricPixels[row*this.sideNum + col] = rect;
            }
        }
    }
}

module.exports = Canvas;