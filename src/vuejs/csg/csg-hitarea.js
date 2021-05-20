import GL from '../lib/lightgl'

export default class HitArea extends GL.Mesh{
    constructor(boundingBox){
        const options = { lines:true };
        super(options);
        if(boundingBox){
            if(boundingBox.radius){
                const r = boundingBox.radius;
                boundingBox = { min: new GL.Vector(-r,-r,-r), max: new GL.Vector(r,r,r) };
            }
            const [min, max] = [boundingBox.min, boundingBox.max];
            this.size = max.subtract(min).divide(2);
            this.setupVertices(min, max);
            this.setupLines();
            this.compile();
        }
        else {
            this.setupLines();
        }
    }
    draw(gl, shaders, context){
        shaders.blackShader.draw(this, gl.LINES);
    }
    updateSize(min, max){
        this.size = max.subtract(min).divide(2);
        this.setupVertices(min, max);
        this.compile();
    }
    setupVertices(min, max){
        this.vertices = [
            [min.x, min.y, min.z],
            [max.x, min.y, min.z],
            [max.x, max.y, min.z],
            [min.x, max.y, min.z],
            [min.x, min.y, max.z],
            [max.x, min.y, max.z],
            [max.x, max.y, max.z],
            [min.x, max.y, max.z],
        ];
    }
    setupLines(){
        this.lines = [
            [0, 1], // front face
            [1, 2],
            [2, 3],
            [3, 0],
            [0, 4], // from front to back
            [1, 5],
            [2, 6],
            [3, 7],
            [4, 5], // back face
            [5, 6],
            [6, 7],
            [7, 4]
        ];
    }
}
