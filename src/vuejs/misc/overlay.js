export default class Overlay{
    constructor(context, w, h){
        this.context = context;
        this.canvas = document.getElementById('overlay');
        this.canvas.width = w;
        this.canvas.height = h;
        this.canvasContext = this.canvas.getContext('2d');
        this.isEnabled = false;
    }
    draw(){
        if(!this.isEnabled){
            return;
        }

        const w = this.cX - this.sX;
        const h = this.cY - this.sY;
        const c = this.canvasContext;
        c.clearRect(0, 0, this.context.width, this.context.height);
        c.fillStyle = 'rgba(193,255,183, .5)';
        c.fillRect(this.sX, this.sY, w, h);

        c.strokeStyle = '#24FF96';
        c.lineWidth = 1;
        c.strokeRect(this.sX, this.sY, w, h);
    }
    startDragging(startX, startY){
        this.isEnabled = true;
        this.startX = this.currentX = startX;
        this.startY = this.currentY = startY;
        this.calcPosition();
    }
    drag(currentX, currentY){
        this.currentX = currentX;
        this.currentY = currentY;
        this.calcPosition();
    }
    endDragging(){
        this.isEnabled = false;
        this.canvasContext.clearRect(0, 0, this.context.width, this.context.height);
    }
    calcPosition(){
        this.sX = Math.min(this.startX, this.currentX);
        this.sY = Math.min(this.startY, this.currentY);
        this.cX = Math.max(this.startX, this.currentX);
        this.cY = Math.max(this.startY, this.currentY);
        this.cYinWebgl = this.context.height - this.sY;     // MEMO : canvas is from top to bottom, but webgl is from bottom to top
        this.sYinWebgl = this.context.height - this.cY;
    }
    containPoint(pX, pY){
        return this.sX <= pX && this.sYinWebgl <= pY && pX <= this.cX && pY <= this.cYinWebgl;
    }
    updateCanvasSize(w, h){
        this.canvas.width = w;
        this.canvas.height = h;
    }
}