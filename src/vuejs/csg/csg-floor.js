import GL from '../lib/lightgl'

export default class Floor extends GL.Mesh {
    constructor(){
        super({ lines: true });
        const number = 8 + 2;
        const halfNumber = number / 2;
        const vertices = [];
        const lines = [];

        for(let x = -halfNumber; x <= halfNumber; x ++){
            const s = vertices.push([x, 0, -halfNumber]);     // front
            const e = vertices.push([x, 0, halfNumber]);      // end
            lines.push([s-1, e-1]);
        }
        const [lastStart, lastEnd] = lines.slice(-1)[0];
        for(let z = -halfNumber; z <= halfNumber; z ++){
            const s = vertices.push([-halfNumber, 0, z]);     // left
            const e = vertices.push([halfNumber, 0, z]);      // right
            lines.push([s-1, e-1]);
        }

        this.vertices = vertices;
        this.triangles = [[0, lastStart, lastEnd], [0, lastEnd, 1]];
        this.lines = lines;
        this.compile();

        this.isBlending = function(){ return true; };
    }
    draw(gl, shaders){
        gl.pushMatrix();
        gl.disable(gl.CULL_FACE);
        shaders.floor2Shader.draw(this, gl.TRIANGLES);
        shaders.blackShader.draw(this, gl.LINES);
        gl.enable(gl.CULL_FACE);
        gl.popMatrix();
    }
}