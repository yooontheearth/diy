import GL from '../lib/lightgl'
import Utils from "../util";
import TWEEN from "@tweenjs/tween.js"

export default class Plane extends GL.Mesh{
    constructor(pointOnPlane, normal, options){
        options = options || {};
        options.lines = true;
        super(options);
        const planeSize = 10;
        const halfSize = planeSize / 2;
        this.vertices = [
            [-halfSize, -halfSize, 0],
            [halfSize, -halfSize, 0],
            [halfSize, halfSize, 0],
            [-halfSize, halfSize, 0]
        ];
        this.triangles = [[0, 1, 2], [0, 2, 3]];
        this.lines = [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0]
        ];
        this.compile();
        this.defaultColor = options.color || [0.3, 0.8, 0];
        this.color = this.defaultColor;
        this.defaultAlpha = options.alpha || 0.2;
        this.alpha = this.defaultAlpha;
        this.updateProps(pointOnPlane, normal);
        this.isBlinking = false;
    }
    updateProps(pointOnPlane, normal){
        this.normal = normal;
        this.distance = pointOnPlane.dot(normal);
        this.centerPoint = this.normal.multiply(this.distance);

        const planeDefaultFace = new GL.Vector(0, 0, 1);
        this.theta = Utils.getAngleFromCosine(planeDefaultFace.dot(this.normal));
        this.rotationAxis = planeDefaultFace.cross(this.normal);
    }
    draw(gl, shaders, context){
        if(!this.isBlinking)
            return;

        gl.pushMatrix();

        gl.translate(this.centerPoint.x, this.centerPoint.y, this.centerPoint.z);
        gl.rotate(this.theta, this.rotationAxis.x, this.rotationAxis.y, this.rotationAxis.z);

        gl.disable(gl.CULL_FACE);
        shaders.blackShader.uniforms({ color:this.color, alpha:this.alpha});
        shaders.blackShader.draw(this, gl.TRIANGLES);
        shaders.blackShader.uniforms(shaders.blackShader.defaultUniforms);
        // shaders.blackShader.draw(this, gl.LINES);    // TODO : probably the outline doesn't need
        gl.enable(gl.CULL_FACE);
        gl.popMatrix();
    }
    calcTime(origin, ray){
        /* Calculate a time on a ray from an origin which hits on a plane */
        const nd = ray.dot(this.normal);
        if( nd === 0.0)
            return null;    // MEMO : it's parallel

        const pn = origin.dot(this.normal);
        const t = (this.distance - pn) / nd;
        return t;   // t >= 0.0 front, else back
    }
    startBlink(currentTime){
        if(this.isBlinking)
            return;

        this.isBlinking = true;
        if(this.tween){
            TWEEN.removeAll();
        }
        const d = this.defaultColor;
        const color1 = {r:d[0], g:d[1], b:d[2],a:this.defaultAlpha};
        const color2 = {r:1, g:1, b:1, a:0.5 };
        new TWEEN.Tween(color1)
            .to(color2, 150)
            .easing(TWEEN.Easing.Exponential.In)
            .onUpdate(() => {
                this.color = [color1.r, color1.g, color1.b];
                this.alpha = color1.a;
            })
            .chain(new TWEEN.Tween(color2)
                    .to({r:d[0], g:d[1], b:d[2], a:0}, 1000)
                    .onUpdate(() => {
                        this.color = [color2.r, color2.g, color2.b];
                        this.alpha = color2.a;
                    })
                    .onComplete(() =>{
                        this.isBlinking = false;
                    }))
            .start();
    }
    blink(){
        if(!this.isBlinking)
            return;
        TWEEN.update();
    }
}
