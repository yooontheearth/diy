import CSG from '../lib/csg'
import GL from '../lib/lightgl'
import * as HitAreaVisualizer from "../visualizer";
import HitArea from "./csg-hitarea";
import Utils from '../util';

export class BlenderObjectMesh extends GL.Mesh{
    constructor(objMesh){
        const options = {
            normals: !!objMesh.vertexNormals,  // 3 items
            triangles: !!objMesh.indices,      // 1 item
            coords: !!objMesh.textures         // 2 items
        };
        super(options);
        for(let i = 0; i <= objMesh.vertices.length-2; i+=3){
            this.vertices.push([objMesh.vertices[i], objMesh.vertices[i+1], objMesh.vertices[i+2]]);
        }
        if(options.normals){
            for(let i = 0; i <= objMesh.vertexNormals.length-2; i+=3){
                this.normals.push([objMesh.vertexNormals[i], objMesh.vertexNormals[i+1], objMesh.vertexNormals[i+2]]);
            }
        }
        if(options.triangles){
            for(let i = 0; i <= objMesh.indices.length-2; i+=3){
                this.triangles.push([objMesh.indices[i], objMesh.indices[i+1], objMesh.indices[i+2]]);
            }
        }

        this.addVertexBuffer('matIndices', 'matIndex');
        this.matIndices = objMesh.vertMaterials.map(name => {
            return objMesh.getMaterialIndex(name);
        });
        this.compile();

        this.objMesh = objMesh;
    }
    get materialUniforms(){
        const uniforms = {};
        this.objMesh.materials.forEach((item, index) => {
            uniforms[`Material[${index}].Ka`] = item.Ka;
            uniforms[`Material[${index}].Kd`] = item.Kd;
            uniforms[`Material[${index}].Ks`] = item.Ks;
        });
        return uniforms;
    }
}
export class HudAxis extends BlenderObjectMesh{
    draw(gl, shaders){
        gl.pushMatrix();
        shaders.axisShader.draw(this, gl.TRIANGLES);
        gl.popMatrix();
    }
}
export class ObjAxis extends BlenderObjectMesh{
    constructor(objMesh, context){
        super(objMesh);
        this.context = context;
        this.hitArea = new HitArea({ min:new GL.Vector(-0.1, -0.1, -0.2 ), max:new GL.Vector(0.1, 0.1, 0.2)});
        this.isDrawn = false;
        this.scale = 0;
        this.hitResult = null;

        this.axisLine = new AxisLine();
        this.axisAngle = new AxisAngle(context);
        // HitAreaVisualizer.instance.add(this, this.drawHitArea);
        this.hitAreaMat = new GL.Matrix();
        this.identityMat = GL.Matrix.identity();
    }
    draw(gl, shaders) {
        this.isDrawn = false;
        if (this.context.selectedObjectHandler.visible) {
            this.isDrawn = true;
            const h = this.context.selectedObjectHandler;
            gl.clear(gl.DEPTH_BUFFER_BIT);
            gl.pushMatrix();
            gl.translate(h.pos.x, h.pos.y, h.pos.z);
            // gl.rotate(m.angle.x, 1, 0, 0);   // MEMO : no rotation for axis
            // gl.rotate(m.angle.y, 0, 1, 0);
            const scale = this.context.camera.pos.subtract(h.pos).length() * 0.1;
            gl.scale(scale, scale, scale);

            shaders.objAxisShader.draw(this, gl.TRIANGLES);
            gl.popMatrix();

            this.scale = scale;

            this.drawAxisGuide(gl, shaders, h, scale);
        }
    }
    drawAxisGuide(gl, shaders, handler, scale){
        if(!this.hitResult || !this.hitResult.targetAxis){
            return;
        }

        if(GL.keys.SHIFT)
            this.axisAngle.draw(gl, shaders, handler, this.hitResult.targetAxis, scale);
        else
            this.axisLine.draw(gl, shaders, handler, this.hitResult.targetAxis);
    }
    drawHitArea(gl, shaders, context){
        if(!this.isDrawn)
            return;

        gl.clear(gl.DEPTH_BUFFER_BIT);
        const handler = this.context.selectedObjectHandler;
        this.drawHitAreaAxis(handler, 'z');
        this.drawHitAreaAxis(handler, 'x', [90, 0, 1, 0]);
        this.drawHitAreaAxis(handler, 'y', [-90, 1, 0, 0]);
    }
    drawHitAreaAxis(handler, prefix , rotation){
        if(rotation)
            GL.Matrix.processThenLoadTo(this.hitAreaMat, GL.Matrix.rotate, [...rotation]);
        else
            GL.Matrix.identity(this.hitAreaMat);

        const m = this.hitAreaMat.m;
        let pos = (new GL.Vector(0, 0, 0.5)).multiply(this.scale);
        pos = this.hitAreaMat.transformPoint(pos);
        pos = handler.pos.add(pos);

        let max = (new GL.Vector(0.1, 0.1, 0.2)).multiply(this.scale);
        let min = max.negative();
        max = this.hitAreaMat.transformPoint(max);
        min = this.hitAreaMat.transformPoint(min);
        this.context.drawLine(prefix + ' size', pos.add(min), pos.add(max), [1.0, 1.0, 0]);

        const x = new GL.Vector(m[0], m[4], m[8]);
        const y = new GL.Vector(m[1], m[5], m[9]);
        const z = new GL.Vector(m[2], m[6], m[10]);
        this.context.drawLine(prefix + ' x', pos, pos.add(x), [1.0, 0, 0]);
        this.context.drawLine(prefix + ' y', pos, pos.add(y), [0.0, 1.0, 0]);
        this.context.drawLine(prefix + ' z', pos, pos.add(z), [0.0, 0, 1.0]);
    }
    testClick(tracer, ray){
        if(!this.isDrawn)
            return false;

        const handler = this.context.selectedObjectHandler;
        this.hitResult =
            this.getCloserResult(
                this.getCloserResult(
                    this.getCloserResult(
                        this.testClickOnAxis(tracer, ray, handler, 'z'),
                        this.testClickOnAxis(tracer, ray, handler, 'x', [90, 0, 1, 0])),
                    this.testClickOnAxis(tracer, ray, handler, 'y', [-90, 1, 0, 0])),
                this.testClickOnCenter(tracer, ray, handler));
        return this.hitResult;
    }
    getCloserResult(ret1, ret2){
        return (!ret1 || (!!ret2 && ret2.t < ret1.t)) ? ret2 : ret1;
    }
    testClickOnAxis(tracer, ray, handler, targetAxis, rotation){
        if(rotation)
            GL.Matrix.processThenLoadTo(this.hitAreaMat, GL.Matrix.rotate, [...rotation]);
        else
            GL.Matrix.identity(this.hitAreaMat);

        const size = (new GL.Vector(0.1, 0.1, 0.2)).multiply(this.scale);

        let pos = (new GL.Vector(0, 0, 0.5)).multiply(this.scale);
        pos = this.hitAreaMat.transformPoint(pos);
        pos = handler.pos.add(pos);

        const hitResult = GL.Raytracer.hitTestOBB(tracer.eye, ray, pos, this.hitAreaMat, size);
        if(hitResult)
            hitResult.targetAxis = targetAxis;
        return hitResult;
    }
    testClickOnCenter(tracer, ray, handler){
        // MEMO : GL.Raytracer.hitTestBox might work but it returns a different normal from hitTestOBB and it causess a wrong movement when dragging
        const size = (new GL.Vector(0.1, 0.1, 0.1)).multiply(this.scale);
        const hitResult = GL.Raytracer.hitTestOBB(tracer.eye, ray, handler.pos, this.identityMat, size);
        return hitResult;
    }
}
class AxisLine extends GL.Mesh{
    constructor(){
        const options = { lines:true };
        super(options);
        this.vertices = [
            [0.0, 0.0, 100.0],
            [0.0, 0.0, -100.0]
        ];
        this.lines = [
            [0, 1]
        ];
        this.compile();
        this.axisSettings = {
            x: { color:[1.0, 0.0, 0.0], angle:[90, 0, 1, 0]},
            y: { color:[0.0, 1.0, 0.0], angle:[-90, 1, 0, 0]},
            z: { color:[0.0, 0.0, 1.0]},
        }
    }
    draw(gl, shaders, handler, targetAxis){
        const setting = this.axisSettings[targetAxis];
        gl.pushMatrix();
        gl.translate(handler.pos.x, handler.pos.y, handler.pos.z);
        if(setting.angle)
            gl.rotate(...setting.angle);

        shaders.blackShader.uniforms({ color:setting.color});
        shaders.blackShader.draw(this, gl.LINES);
        shaders.blackShader.uniforms(shaders.blackShader.defaultUniforms);  // MEMO : set a default color back
        gl.popMatrix();
    }
}
class AxisAngle extends GL.Mesh{
    constructor(context){
        const options = {
            triangles: true
        };
        super(options);

        this.context = context;
        const verts = this.createTwoCircles(0.1, 0.2);
        const indexes = [];
        for(let i = 0; i < verts.length - 2; i += 2) {
            indexes.push([i, i + 1, i + 2]);
            indexes.push([i + 1, i + 3, i + 2]);
        }
        const index = verts.length - 2;     // MEMO : the last two vertices come back to the starting points
        indexes.push([index, index + 1, 0]);
        indexes.push([index + 1, 1, 0]);

        this.addVertexBuffer('angles', 'angle');
        const vertsIndexArray = [...Array(verts.length).keys()];
        this.angles = vertsIndexArray.map(i => Math.floor(i / 2));
        this.vertices = verts;
        this.triangles = indexes;
        this.compile();
        this.axisSettings = {
            x: { pos:[0.5, 0.0, 0.0]},
            y: { pos:[0.0, 0.5, 0.0]},
            z: { pos:[0.0, 0.0, 0.5]},
        };
        this.cameraMat = new GL.Matrix();
        this.rotationAxisMat = new GL.Matrix();
        this.perpMat = new GL.Matrix();
    }
    draw(gl, shaders, handler, targetAxis, scale){
        gl.clear(gl.DEPTH_BUFFER_BIT);

        gl.pushMatrix();
        gl.translate(handler.pos.x, handler.pos.y, handler.pos.z);
        gl.scale(scale, scale, scale);
        gl.translate(...this.axisSettings[targetAxis].pos);

        // MEMO : when you treat a camera position, you need to make it negative (that means reversing) before calculation
        //          since its position and angle are origin, and other objects are moved by them
        GL.Matrix.processThenLoadTo(this.cameraMat, GL.Matrix.rotate, [-this.context.camera.angleY, 0, 1, 0]);
        GL.Matrix.multiplyThenLoadTo(this.cameraMat, GL.Matrix.rotate, [-this.context.camera.angleX, 1, 0, 0]);
        const cameraPos = this.cameraMat.transformPoint(this.context.camera.pos.negative());
        const directionCurrentlyFacing = new GL.Vector(0, 0, 1);
        const directionTargeting = cameraPos.subtract(handler.pos).unit();

        // MEMO : calculate an angle by dot product. Angle = arccos of cosine
        let angleBetweenFaceAndCamera = Utils.getAngleFromCosine(directionCurrentlyFacing.dot(directionTargeting));

        // MEMO : calculate an axis to rotate to face the camera
        const rotationAxis = directionCurrentlyFacing.cross(directionTargeting).unit();

        /* MEMO :
                The camera top direction won't be perpendicular to the target direction for some reason even though rotating with the camera matrix.
                That's why the target top won't point at the top properly.
                To fix it, calculate the target top (rotatedTop) first, then make the camera top to perpendicular to the target direction by tweaking some angles,
                then calculate an angle between the camera top and the target top (both them are now perpendicular to the target direction),
                and use that calculated angle to rotate around the target direction to point at the right top.
         */
        // MEMO : calculate a current rotated top position
        GL.Matrix.processThenLoadTo(this.rotationAxisMat, GL.Matrix.rotate, [angleBetweenFaceAndCamera, rotationAxis.x, rotationAxis.y, rotationAxis.z]);
        const directionCurrentlyTop = new GL.Vector(0, 1, 0);
        const rotatedTop = this.rotationAxisMat.transformPoint(directionCurrentlyTop).unit();

        // MEMO : make the top of the camera perpendicular to the target direction
        let cameraTop = this.cameraMat.transformPoint(directionCurrentlyTop).unit();
        const angleToPerp = 90 - Utils.getAngleFromCosine(cameraTop.dot(directionTargeting));
        const makeItPerpAxis = cameraTop.cross(directionTargeting).unit();
        GL.Matrix.processThenLoadTo(this.perpMat, GL.Matrix.rotate, [-angleToPerp, makeItPerpAxis.x, makeItPerpAxis.y, makeItPerpAxis.z]);
        cameraTop = this.perpMat.transformPoint(cameraTop).unit();

        /*  MEMO :
                The reason why calculating a determinant in the following code is that to use atan2,
                and the reason why using atan2 instead of Math.acos with a radian calculated dot product is that an angle between -pie to pie (360 degrees) is needed.
                acos returns 0 to pie (0 to 180 degrees) which isn't enough in this case.
                Also note, atan2 signature is atan2(y, x). In other word, atan2(sin, cos). To find out which is x and y,
                dot product is proportional to the cosine of the angle, and determinant is proportional to the sine of the angle in 2D space.
                To find out in 3D space and rotating on a specific plane, the cosine is the same as 2D, but the sine has to be a determinant with a specified axis vector,
                which is "directionTargeting" in this case.

                https://stackoverflow.com/a/16544330/366049
        */
        // MEMO : calculate a determinant of the three vectors to use atan2
        const radianBetweenCameraTopAndRotatedTop = cameraTop.dot(rotatedTop);
        const determinant = GL.Vector.determinant(directionTargeting, rotatedTop, cameraTop);   // MEMO : if you swap rotatedTop and cameraTop, a sign of a result will inverse
        const angleBetweenCameraTopAndRotatedTop = Utils.toDegree(Math.atan2(determinant, radianBetweenCameraTopAndRotatedTop));
        gl.rotate(angleBetweenCameraTopAndRotatedTop, directionTargeting.x, directionTargeting.y, directionTargeting.z);

        gl.rotate(angleBetweenFaceAndCamera, rotationAxis.x, rotationAxis.y, rotationAxis.z);

        shaders.circleShader.uniforms({ currentAngle: handler.angle[targetAxis]});
        shaders.circleShader.draw(this, gl.TRIANGLES);
        gl.popMatrix();
    }
    createTwoCircles(innerLength, outerLength){
        const verts = [];
        const rad = Math.PI / 180;
        for(var i = 0; i < 360; i ++){
            const x = Math.cos(rad*i);
            const y = Math.sin(rad*i);
            verts.push([x*innerLength, y*innerLength, 0.02]);
            verts.push([x*outerLength, y*outerLength, 0.0]);
        }
        return verts;
    }
}
export class CameraAxis extends BlenderObjectMesh{
    constructor(objMesh, context){
        super(objMesh);
        this.context = context;
    }
    draw(gl, shaders) {
        const c = this.context;
        gl.pushMatrix();
        gl.multMatrix(GL.Matrix.inverse(c.camera.faceMat, GL.Matrix.resultMat));
        gl.rotate(180, 0, 1, 0);
        shaders.objAxisShader.draw(this, gl.TRIANGLES);
        gl.popMatrix();
    }
}