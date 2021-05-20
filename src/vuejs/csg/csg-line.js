import GL from '../lib/lightgl'

export default class Line extends GL.Mesh{
    constructor(options){
        options = options || {};
        options.lines = true;
        options.points = true;
        super(options);
        const s = options.start;
        const e = options.end;
        this.vertices = [
            [s.x, s.y, s.z],
            [e.x, e.y, e.z]
        ];
        this.lines = [
            [0, 1]
        ];
        this.addVertexBuffer('selectedPoints', 'selectedPoint');
        this.selectedPoints = [false, false];
        this.compile();
        this.lineColor = options.lineColor || [0, 0, 0];
    }
    draw(gl, shaders, context){
        gl.pushMatrix();
        shaders.blackShader.uniforms({ color:this.lineColor});
        shaders.blackShader.draw(this, gl.LINES);
        shaders.blackShader.uniforms(shaders.blackShader.defaultUniforms);  // MEMO : set a default color back
        shaders.pointShader.draw(this, gl.POINTS);
        gl.popMatrix();
    }
}
