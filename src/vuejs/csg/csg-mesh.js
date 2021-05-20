import _ from 'lodash'
import CSG from '../lib/csg'
import GL from '../lib/lightgl'
import SharedVertices from './csg-sharedvertices'
import HitArea from './csg-hitarea'
import * as HitAreaVisualizer from '../visualizer'
import * as DIY from '../enums.js'
import Global from '../global.js'
import Utils from '../util'
import Plane from './csg-plane'

// MEMO : About OpenGL coordinate space.
//
//  "OpenGL is right handed in object space and world space.
//  But in window space (aka screen space) we are suddenly left handed."
//  https://stackoverflow.com/questions/4124041/is-opengl-coordinate-system-left-handed-or-right-handed
//
//  Right handed, z to -z
//  Left handed, -z to z
//
//  That's why camera's -z means pushing an object further from a screen (that means in right handed space).
//  This looks like a camera itself is coming to a screen when its z is negative, but actually pushing an object away.
//  Also, Left handed rotation is clockwise and Right handed rotation is counter-clockwise

GL.Mesh.prototype.testClick = function(tracer, ray){
    const mat = this.calcRotationMatrix();
    const hitResult = GL.Raytracer.hitTestOBB(tracer.eye, ray, this.pos, mat, this.hitArea.size);
    this.lastPosBeforeDragging = this.pos;
    return hitResult;
}
GL.Mesh.prototype.prepareDragging = function(){
    // MEMO : when an axis is selected, testClick isn't called, so lastPosBeforeDragging must be updated with this method
    this.lastPosBeforeDragging = this.pos;
}
GL.Mesh.prototype.drag = function(movement){
    this.boundingBox.updatePositionFromParentPoint(this.lastPosBeforeDragging.add(movement));
    this.calcLightlyForSnapBase();
}
GL.Mesh.prototype.rotate = function(deltaX, deltaY, deltaZ){
    this.rotateAlong('x', deltaX);
    this.rotateAlong('y', deltaY);
    this.rotateAlong('z', deltaZ);
    this.calcFullyForSnapBase();
}
GL.Mesh.prototype.rotateAlong = function(property, delta){
    this.angle[property] = Utils.clampAngle(this.angle[property] + delta);
    this.calcFullyForSnapBase();
}
GL.Mesh.prototype.draw = function(gl, shaders, context){
    shaders.mainShader.uniforms({
        "isSelected": !!this.isSelected,
        "isPreSelected": !!this.isPreSelected,
        "isSnapBase": !!this.isSnapBase
    });

    gl.pushMatrix();
    gl.translate(this.pos.x, this.pos.y, this.pos.z);
    gl.rotate(this.angle.x, 1, 0, 0);
    gl.rotate(this.angle.y, 0, 1, 0);
    gl.rotate(this.angle.z, 0, 0, 1);

    shaders.mainShader.draw(this, gl.TRIANGLES);

    if(this.isSelected){
        if(context.editMode === DIY.EditMode.Vertex){
            this.sharedVertices.draw(gl, shaders);
        }
    }
    gl.popMatrix();
}
GL.Mesh.prototype.drawHitArea = function(gl, shaders, context){
    gl.pushMatrix();
    gl.translate(this.pos.x, this.pos.y, this.pos.z);
    gl.rotate(this.angle.x, 1, 0, 0);
    gl.rotate(this.angle.y, 0, 1, 0);
    gl.rotate(this.angle.z, 0, 0, 1);
    this.hitArea.draw(gl, shaders, context);
    gl.popMatrix();
}
GL.Mesh.prototype.compileSpecificBuffer = function(attribute, data){
    const buffer = this.vertexBuffers[attribute];
    this[buffer.name] = data;
    buffer.data = this[buffer.name];
    buffer.compile();
}
GL.Mesh.prototype.cleanUp = function(){
    const gl = Global.gl;
    function deleteBuffer(buffer){
        gl.bindBuffer(buffer.target, buffer.buffer);
        gl.bufferData(buffer.target, 1, gl.STATIC_DRAW);
        gl.deleteBuffer(buffer.buffer);
    }

    // gl.deleteTexture(texture.id);	// TODO : delete textures if it's used
    for (let attribute in this.vertexBuffers) {
        deleteBuffer(this.vertexBuffers[attribute]);
    }
    for (let name in this.indexBuffers) {
        deleteBuffer(this.indexBuffers[name]);
    }

    if(this.hitArea){
        this.hitArea.cleanUp();
    }

    if(this.sharedVertices){
        this.sharedVertices.cleanUp();
    }

    if(this.planes){
        this.planes.forEach(p => p.cleanUp());
    }

    HitAreaVisualizer.instance.remove(this);
}
GL.Mesh.prototype.translateToMeshPosition = function(){
    const mat = this.calcRotationMatrix(GL.Matrix.translate(this.pos.x, this.pos.y, this.pos.z));

    this.csg.polygons = this.csg.polygons.map(p => {
        return new CSG.Polygon(p.vertices.map(v => {
            v.pos = new CSG.Vector(mat.transformPoint(v.pos));
            return v;
        }), p.shared);
    });
}
GL.Mesh.prototype.translateToCSGPosition = function(csg){
    let mat = this.calcRotationMatrix(GL.Matrix.translate(this.pos.x, this.pos.y, this.pos.z));
    mat = GL.Matrix.inverse(mat);

    csg.polygons = csg.polygons.map(p =>{
        return new CSG.Polygon(p.vertices.map(v => {
            v.pos = new CSG.Vector(mat.transformPoint(v.pos));
            return v;
        }), p.shared);
    });
}
// CSG operations
GL.Mesh.prototype.updateCSG = function(){
    if(this.isInvalidatedCSG){
        this.isInvalidatedCSG = false;
        const falseNormal = [0, 0, 0];
        this.csg = CSG.fromPolygons(this.triangles.map(t => {
            const polygon = new CSG.Polygon([
                new CSG.Vertex(new CSG.Vector(this.vertices[t[0]]), falseNormal),
                new CSG.Vertex(new CSG.Vector(this.vertices[t[1]]), falseNormal),
                new CSG.Vertex(new CSG.Vector(this.vertices[t[2]]), falseNormal)
            ]);
            polygon.vertices.forEach(v => v.normal = polygon.plane.normal);
            return polygon;
        }));
    }
}
GL.Mesh.prototype.subtract = function(mesh){
    this.updateCSG();
    mesh.updateCSG();
    this.translateToMeshPosition();
    mesh.translateToMeshPosition();
    const result = this.csg.subtract(mesh.csg);
    this.translateToCSGPosition(result);
    return result;
}
GL.Mesh.prototype.setSnapBase = function(){
    this.isSnapBase = true;
    this.calcFullyForSnapBase();
}
GL.Mesh.prototype.calcFullyForSnapBase = function(){
    /* this method is for rotation and changing size */
    if(!this.isSnapBase)
        return false;
    this.calcAxes();
    this.calcPlanes();
}
GL.Mesh.prototype.calcLightlyForSnapBase = function(){
    /* this method is for changing position */
    if(!this.isSnapBase)
        return false;
    this.calcPlanes();
}
GL.Mesh.prototype.calcAxes = function(){
    const m = this.calcRotationMatrix().m;
    const x = new GL.Vector(m[0], m[4], m[8]).unit();
    const y = new GL.Vector(m[1], m[5], m[9]).unit();
    const z = new GL.Vector(m[2], m[6], m[10]).unit();
    this.axes = {
        x,
        y,
        z,
        minusX:x.negative(),
        minusY:y.negative(),
        minusZ:z.negative()
    };
}
GL.Mesh.prototype.getCenterPointsOnBoundingBox = function(){
    return [
        this.axes.x.multiply(this.boundingBox.max.x),
        this.axes.y.multiply(this.boundingBox.max.y),
        this.axes.z.multiply(this.boundingBox.max.z),
        this.axes.minusX.multiply(this.boundingBox.max.x),
        this.axes.minusY.multiply(this.boundingBox.max.y),
        this.axes.minusZ.multiply(this.boundingBox.max.z)
    ];
}
GL.Mesh.prototype.getCenterPointsInPosition = function(){
    return this.getCenterPointsOnBoundingBox().map(p => this.pos.add(p));
}
GL.Mesh.prototype.calcPlanes = function(){
    const pointsOnPlanes = this.getCenterPointsInPosition();
    if(!!this.planes){
        this.planes[0].updateProps(pointsOnPlanes[0], this.axes.x);
        this.planes[1].updateProps(pointsOnPlanes[1], this.axes.y);
        this.planes[2].updateProps(pointsOnPlanes[2], this.axes.z);
        this.planes[3].updateProps(pointsOnPlanes[3], this.axes.minusX);
        this.planes[4].updateProps(pointsOnPlanes[4], this.axes.minusY);
        this.planes[5].updateProps(pointsOnPlanes[5], this.axes.minusZ);
    }
    else {
        this.planes = [
            new Plane(pointsOnPlanes[0], this.axes.x),
            new Plane(pointsOnPlanes[1], this.axes.y),
            new Plane(pointsOnPlanes[2], this.axes.z),
            new Plane(pointsOnPlanes[3], this.axes.minusX),
            new Plane(pointsOnPlanes[4], this.axes.minusY),
            new Plane(pointsOnPlanes[5], this.axes.minusZ)
        ];
    }
}
GL.Mesh.prototype.calcRotationMatrix = function(baseMat){
    const mat  = baseMat || GL.Matrix.identity();
    GL.Matrix.multiplyThenLoadTo(mat, GL.Matrix.rotate, [this.angle.x, 1, 0, 0]);
    GL.Matrix.multiplyThenLoadTo(mat, GL.Matrix.rotate, [this.angle.y, 0, 1, 0]);
    GL.Matrix.multiplyThenLoadTo(mat, GL.Matrix.rotate, [this.angle.z, 0, 0, 1]);
    return mat;
}
GL.Mesh.prototype.calcBoundingBox = function(){
    this.boundingBox = this.boundingBox || new BoundingBox(this);
    this.boundingBox.update(this.vertices);
}
GL.Mesh.prototype.updatePos = function(delta, property){
    this.boundingBox.pos[property] += delta;
    this.boundingBox.updateParentPosition();
    this.calcLightlyForSnapBase();
}
GL.Mesh.prototype.updateSize = function(delta, property){
    const value = delta * .5;
    this.sharedVertices.updateSize(value, property);
    this.boundingBox.update(this.vertices);
    this.calcFullyForSnapBase();
}
GL.Mesh.prototype.getMinMaxInRotatedPosition = function(){
    const mat = this.calcRotationMatrix(GL.Matrix.translate(this.pos.x, this.pos.y, this.pos.z));
    const [min, max] = [this.boundingBox.min, this.boundingBox.max];
    const vertices = [
        [min.x, min.y, min.z],
        [max.x, min.y, min.z],
        [max.x, max.y, min.z],
        [min.x, max.y, min.z],
        [min.x, min.y, max.z],
        [max.x, min.y, max.z],
        [max.x, max.y, max.z],
        [min.x, max.y, max.z]
    ];
    return vertices.map(v => mat.transformPoint(new GL.Vector(...v)));
}

class BoundingBox{
    constructor(parentMesh){
        this.min = new GL.Vector();
        this.max = new GL.Vector();
        this.parentMesh = parentMesh;
        this.pos = this.parentMesh.pos.clone(); // MEMO : used for UI and equivalent to the min of the parent's bounding box
    }
    update(vertices){
        this.min.clear();
        this.max.clear();

        vertices.forEach(v => Utils.updateMinMax(this.min, this.max, v));
        this.size = this.max.subtract(this.min);    // MEMO : mesh's width, height and length
        this.vectorToCenter = this.min.negative();
        this.updateParentPosition();
        this.parentMesh.hitArea.updateSize(this.min, this.max);

    }
    updateParentPosition(){
        this.parentMesh.pos = this.pos.add(this.vectorToCenter);
    }
    updatePositionFromParentPoint(parentPoint){
        this.parentMesh.pos = parentPoint;
        this.pos = parentPoint.subtract(this.vectorToCenter);
    }
}

/* Helpers */
GL.Mesh.decorate = (mesh, pos, angle, options) => {
    // MEMO : mesh's pos is a center point of a mesh, and is used everywhere to compute. BoundingBox.pos is used for UI.
    mesh.pos = pos ? (_.isArray(pos) ? GL.Vector.fromArray(pos) : pos.clone()) : new GL.Vector();
    mesh.angle = angle ? (_.isArray(angle) ? GL.Vector.fromArray(angle) : angle.clone()) : new GL.Vector();
    mesh.name = options ? options.label : "";
    mesh.isSelected = false;
    mesh.isPreSelected = false;
    mesh.isSelectable = true;
    mesh.isSnapBase = false;
    mesh.isBlending = function(){ return mesh.isSelected; };
    mesh.hitArea = new HitArea();
    mesh.calcBoundingBox();
    HitAreaVisualizer.instance.add(mesh, mesh.drawHitArea);
};
GL.Mesh.constructFromCSG = (mesh, csg, pos, angle, options) => {
    csg.toMesh(mesh);
    GL.Mesh.decorate(mesh, pos, angle, options);
    mesh.isCSGable = true;
    mesh.csg = csg;
    mesh.sharedVertices = new SharedVertices({ mesh });
    mesh.isInvalidatedCSG = false;
}
GL.Mesh.CSGableCube = class extends GL.Mesh{
    constructor(options, pos){
        super({ normals: true, colors: true });
        const csg = CSG.cube(options);
        GL.Mesh.constructFromCSG(this, csg, pos, null, options);
    }
}
GL.Mesh.CSGableSphere = class extends GL.Mesh{
    constructor(options, pos){
        super({ normals: true, colors: true });
        const csg = CSG.sphere(options);
        GL.Mesh.constructFromCSG(this, csg, pos, null, options);
    }
}
GL.Mesh.CSGableObject = class extends GL.Mesh{
    constructor(csg, pos, angle){
        super({ normals: true, colors: true });
        GL.Mesh.constructFromCSG(this, csg, pos, angle);
    }
}