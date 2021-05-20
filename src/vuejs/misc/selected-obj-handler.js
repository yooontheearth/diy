import GL from '../lib/lightgl'
import Utils from '../util'
import HitArea from "../csg//csg-hitarea";
import * as DIY from "../enums";

export default class SelectedObjectHandler{
    constructor(context){
        this.context = context;
        this.name = "";
        this.pos = new GL.Vector(0,0,0);
        this.visualPos = new GL.Vector(0,0,0);
        this.angle = new GL.Vector(0,0,0);
        this.size = new GL.Vector(0,0,0);
        this.visible = false;
        this.lastPosBeforeDragging = null;
        this.hitArea = null;
    }
    initMesh(){
        // MEMO : Mesh has to be initialized after the gl is created
        this.hitArea = new HitArea();
    }
    reset(){
        const q = this.context.selectedWebGLItems;
        if(q.length === 0){
            this.visible = false;
        }
        else{
            this.visible = true;
            let pos, visualPos, angle, size, name;
            if(q.length === 1){
                [pos, visualPos, angle, size, name] = [q[0].pos, q[0].boundingBox.pos, q[0].angle, q[0].boundingBox.size, q[0].name];
            }
            else{
                const [min, max] = [q[0].pos.clone(), q[0].pos.clone()];
                for(let i = 1; i < q.length; i ++){
                    Utils.updateMinMax(min, max, q[i].pos);
                }
                pos = max.subtract(min).divide(2).add(min);
                visualPos = pos;    // MEMO : when multiple objects are selected, a visual position is the same as its true location
                angle = new GL.Vector();
                size = new GL.Vector();
                name = q[0].name;

                // a selected objects' bounding box
                let defaultBBs = q[0].getMinMaxInRotatedPosition();
                let [bbMin, bbMax] = defaultBBs.slice(0, 2).map(bb => bb.clone());
                function updateBbMinMax(p){
                    Utils.updateMinMax(bbMin, bbMax, p);
                }
                defaultBBs.forEach(updateBbMinMax);
                for(let i = 1; i < q.length; i ++){
                    q[i].getMinMaxInRotatedPosition().forEach(updateBbMinMax);
                }
                bbMin = bbMin.subtract(pos);
                bbMax = bbMax.subtract(pos);
                this.hitArea.updateSize(bbMin, bbMax);
            }

            this.setProps(pos, this.pos);
            this.setProps(visualPos, this.visualPos);
            this.setProps(angle, this.angle);
            this.setProps(size, this.size);
            this.name = name;
        }
    }
    prepareDragging(){
        this.lastPosBeforeDragging = this.pos;
        this.context.selectedWebGLItems.forEach(m => m.prepareDragging());
    }
    changePos(newValue, oldValue, property){
        const q = this.context.selectedWebGLItems;
        const delta = newValue - oldValue;
        q.forEach(m => { m.updatePos(delta, property); });

        // MEMO : visualPos is update via vector-viewer
        if(q.length === 1){
            this.pos = q[0].pos.clone();
        }else{
            this.pos[property] = this.visualPos[property];
        }
    }
    drag(movement){
        const q = this.context.selectedWebGLItems;
        q.forEach(m => { m.drag(movement); });

        if(q.length === 1){
            this.pos = q[0].pos.clone();
            this.visualPos = q[0].boundingBox.pos.clone();
        }else{
            this.pos = this.lastPosBeforeDragging.add(movement);
            this.visualPos = this.pos.clone();
        }
    }
    snap(snapBase, movement){
        const q = this.context.selectedWebGLItems;
        q.forEach(m => {
            m.drag(movement);
            let meshMovement = movement;

            // MEMO : calculate a closest plane for each point (so six planes total) then move a mesh to the plane if a distance between them is less than a threshold
            m.calcAxes();
            const centerPoints = m.getCenterPointsOnBoundingBox();
            Object.values(m.axes).forEach((axis, index) => {
                const centerPointInPosition = m.pos.add(centerPoints[index]);   // MEMO : always calculate with a latest position
                const closest = { distance:10.0 };
                snapBase.planes.forEach(p => {
                    const time = p.calcTime(centerPointInPosition, axis);
                    if(time === null)
                        return;

                    const pointOnPlane = centerPointInPosition.add(axis.multiply(time));
                    const toPlane = pointOnPlane.subtract(centerPointInPosition);
                    const distance = toPlane.length();
                    if(distance < closest.distance){
                        closest.distance = distance;
                        closest.toPlane = toPlane;
                        closest.plane = p;
                    }
                });

                if(closest.distance < 0.1){
                    closest.plane.startBlink();
                    meshMovement = meshMovement.add(closest.toPlane);   // MEMO : accumulate a movement when moved
                    m.drag(meshMovement);
                }
            });
        });

        if(q.length === 1){
            this.pos = q[0].pos.clone();
            this.visualPos = q[0].boundingBox.pos.clone();
        }else{
            this.reset();
        }
    }
    changeAngle(newValue, oldValue, property){
        const delta = newValue - oldValue;
        this.context.selectedWebGLItems.forEach(m => { m.rotateAlong(property, delta); });
    }
    addAngles(deltas){
        this.context.selectedWebGLItems.forEach(m => { m.rotate(...deltas); });

        this.angle.x = Utils.clampAngle(this.angle.x + deltas[0]);
        this.angle.y = Utils.clampAngle(this.angle.y + deltas[1]);
        this.angle.z = Utils.clampAngle(this.angle.z + deltas[2]);
    }
    changeSize(newValue, oldValue, property){
        const delta = newValue - oldValue;
        this.context.selectedWebGLItems.forEach(m => { m.updateSize(delta, property); });
    }
    setProps(from, to){
        to.x = from.x;
        to.y = from.y;
        to.z = from.z;
    }
    changeName(newValue){
        this.context.selectedWebGLItems.forEach(m => { m.name = newValue; });
    }
    draw(gl, shaders, context){
        const q = this.context.selectedWebGLItems;
        if(this.visible && q.length > 1) {
            gl.pushMatrix();
            gl.translate(this.pos.x, this.pos.y, this.pos.z);
            this.hitArea.draw(gl, shaders, context);
            gl.popMatrix();
        }
    }
}