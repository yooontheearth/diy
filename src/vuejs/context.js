import _ from 'lodash'
import * as DIY from './enums.js'
import * as HitAreaVisualizer from './visualizer'
import GL from './lib/lightgl'
import Line from './csg/csg-line'
import Global from './global.js'
import Overlay from './misc/overlay'
import SelectedObjectHandler from './misc/selected-obj-handler'
import Plane from './csg/csg-plane'
import Utils from "./util";

const   LEFT_BUTTON = 1,
        RIGHT_BUTTON = 2;

export default class Context {
    constructor(width, height){
        this.width = width;
        this.height = height;
        this.objHitResult = null;
        this.axisHitResult = null;
        this.selectedWebGLItemQueue = [];    // MEMO : it contains web gl items in queue order (it uses for csg operations)
        this.selectedVertexQueue = [];
        this.items = [];    // MEMO : it contains both ui and webgl items
        this.defaultCameraPosition = GL.Vector.fromArray([0, -2.0, -2.0]);
        this.camera = {};
        this.resetCameraPosition();
        this.time = 0;
        this.editMode = DIY.EditMode.Mesh;
        this.lines = new Map();
        this.axes = {
            'x': new GL.Vector(1, 0, 0),
            'y': new GL.Vector(0, 1, 0),
            'z': new GL.Vector(0, 0, 1),
            'guide': new GL.Vector(1, 1, 1).unit()
        };
        this.selectedObjectHandler = new SelectedObjectHandler(this);
        this.snapBase = null;
        this.focusMode = false;
        this.debugView = true;
    }
    get webGLItems(){
        return this.items.filter(item => !item.isUiItem);
    }
    get selectableWebGLItems(){
        return this.webGLItems.filter(item => item.isSelectable);
    }
    get selectedWebGLItems(){
        return this.webGLItems.filter(item => item.isSelected);
    }
    get uiItems(){
        return this.items.filter(item => item.isSelectable || item.isUiItem);
    }
    get uiItemsInUiOrder(){
        // MEMO : UI order is nested
        const items = [];
        function dig(children){
            children.forEach(c => {
                items.push(c);
                if(!!c.childItems)
                    dig(c.childItems);
            })
        }
        dig(this.rootUiItems);
        return items;
    }
    get selectedUiItems(){
        return this.uiItemsInUiOrder.filter(item => item.isSelected);
    }
    get rootUiItems(){
        return this.uiItems.filter(item => item.parentGroup === null);
    }
    get drawableItems(){
        return this.items.filter(item => !item.isUndrawable);
    }
    unselectAllItems(){
        this.uiItems.forEach(m => m.isSelected = false);
    }
    createOverlay(){
        this.overlay = new Overlay(this, this.width, this.height);
    }
    addItem (item){
        this.items.push(item);
        return item;
    }
    removeItems (removingItems){
        _.remove(this.items, m => { return _.find(removingItems, (m2) => { return m === m2 }); });
        removingItems.forEach(m => {
            if(!!m.parentGroup)
                m.parentGroup.removeChild(m);
            m.cleanUp();
        });
        this.items = [...this.items]; // MEMO : notify to Vue that the array is changed
        this.updateSelectedItems();
    }
    updateSelectedItems(needsToUpdateQueueAsWell = true){
        function makeChildSelected(item){
            item.isSelected = true;
            if(!!item.childItems)
                item.childItems.forEach(child => makeChildSelected(child));
        }
        this.selectedUiItems.forEach(makeChildSelected);

        if(needsToUpdateQueueAsWell)
            this.selectedWebGLItemQueue = this.selectableWebGLItems.filter(item => item.isSelected);
        this.selectedObjectHandler.reset();
    }
    mouseDownActionHandler(e){
        if(e.buttons === RIGHT_BUTTON)
            return;

        this.selectObjects(e);
    }
    selectObjects (e){
        let tracer = new GL.Raytracer(),
            ray = tracer.getRayForPixel(e.x, e.y);

        if(this.editMode === DIY.EditMode.Mesh){
            this.selectItems(tracer, ray, e);
        }
        else{
            this.selectVertices(tracer, ray, e);
        }
    }
    selectItems(tracer, ray, e){
        this.axisHitResult = Global.objAxis.testClick(tracer, ray);
        if(this.axisHitResult){
            this.objHitResult = this.axisHitResult;
            this.selectedObjectHandler.prepareDragging();
            return;
        }

        this.objHitResult = null;
        const tempSelectedMeshes = this.selectedWebGLItemQueue.slice();
        if(!GL.keys.CTRL){
            tempSelectedMeshes.length = 0;
            this.unselectAllItems();
        }

        const resultSet = [];
        this.selectableWebGLItems.forEach(item => {
            const tempHitResult = item.testClick(tracer, ray);
            if(!this.objHitResult || (!!tempHitResult && tempHitResult.t < this.objHitResult.t)){
                this.objHitResult = tempHitResult;
                if(this.objHitResult) {
                    this.objHitResult.item = item;
                }
            }
            resultSet.push({ result:tempHitResult, item:item });
        });
        resultSet.forEach(s => {
            if(!this.objHitResult || s.result !== this.objHitResult){
                if(!GL.keys.CTRL) {
                    s.item.isSelected = false;
                    _.remove(tempSelectedMeshes, s.item);
                }
            }
            else if(!!this.objHitResult && s.result === this.objHitResult){
                if (GL.keys.CTRL) {
                    s.item.isSelected = !s.item.isSelected;
                }
                else {
                    s.item.isSelected = true;
                }
                if(!s.item.isSelected){
                    _.remove(tempSelectedMeshes, s.item);
                }
            }
        });

        if(this.objHitResult){
            // MEMO : the mesh might not be selected if CTRL is pressed
            if(this.objHitResult.item.isSelected) {
                tempSelectedMeshes.push(this.objHitResult.item);
            }
        }
        else{
            tempSelectedMeshes.length = 0;
            this.overlay.startDragging(e.x, e.y);
        }

        this.selectedWebGLItemQueue = tempSelectedMeshes;
        this.updateSelectedItems(false);
    }
    drawLine(name, start, end, lineColor){
        if(!this.lines.has(name)){
            const line = new Line({ start, end, lineColor});
            HitAreaVisualizer.instance.add(line, line.draw);
            this.lines.set(name, line);
        }
        else{
            const line = this.lines.get(name);
            line.vertices = [
                [start.x, start.y, start.z],
                [end.x, end.y, end.z]
            ];
            line.compile();
        }
    }
    selectVertices(tracer, ray, e){
        this.objHitResult = null;
        const mustRecompileMeshes = new Set();
        if(!GL.keys.CTRL){
            this.selectedVertexQueue.length = 0;
        }
        this.selectedWebGLItems.forEach(m => {
            m.sharedVertices.sharedVertexArray.forEach(v => {
                const previousState = v.isSelected;
                // TODO : refactor similar to selectMeshes
                const tempHitResult = v.testClick(tracer, ray);
                if(!tempHitResult){
                    if(!GL.keys.CTRL) {
                        v.isSelected = false;
                    }
                }
                else{
                    if (GL.keys.CTRL) {
                        v.isSelected = !!this.objHitResult ? v.isSelected : !v.isSelected;
                    }
                    else {
                        v.isSelected = !this.objHitResult;
                    }

                    if(!this.objHitResult) {
                        this.objHitResult = tempHitResult;
                        this.selectedVertexQueue.push({m, v});  // MEMO : to recompile buffers on a mesh only once, keep a selected vertex owning mesh as well
                    }
                }
                if(previousState !== v.isSelected){
                    mustRecompileMeshes.add(m);
                }
            });
        });
        if(!this.objHitResult){
            this.selectedVertexQueue.length = 0;
        }
        else{
            this.objHitResult.normal = tracer.eye.subtract(this.objHitResult.hit).unit();
        }
        mustRecompileMeshes.forEach(m => m.sharedVertices.recompileOnSelectedPoint());
    }
    mouseMoveActionHandler(e){
        if (!e.dragging) {
            return;
        }

        if(e.buttons === LEFT_BUTTON) {
            if(this.overlay.isEnabled){
                this.overlay.drag(e.x, e.y);
                this.selectObjectsViaOverlay();
            } else if (this.selectedObjectHandler.visible && GL.keys.SHIFT) {
                this.rotateObjects(e);
            } else if (this.selectedObjectHandler.visible && this.editMode === DIY.EditMode.Vertex) {
                this.dragVertices(e)
            } else if (this.selectedObjectHandler.visible && this.editMode === DIY.EditMode.Mesh) {
                this.dragObjects(e)
            }
        }
        else if (e.buttons === RIGHT_BUTTON){
            if(GL.keys.CTRL){
                this.camera.faceY += e.deltaX * .1;
                this.camera.faceX += e.deltaY * .1;
            }
            else {
                this.camera.angleY += e.deltaX * .5;
                this.camera.angleX += e.deltaY * .5;
            }
            this.updateCamera();
        }
        Global.gl.ondraw();
    }
    updateCamera(){
        if(this.focusMode && this.selectedObjectHandler.visible){
            this.lookAt(this.selectedObjectHandler.pos);
        }
        else{
            GL.Matrix.processThenLoadTo(this.camera.faceMat, GL.Matrix.rotate, [this.camera.faceX, 1, 0, 0]);
            GL.Matrix.multiplyThenLoadTo(this.camera.faceMat, GL.Matrix.rotate, [this.camera.faceY, 0, 1, 0]);
            GL.Matrix.multiplyThenLoadTo(this.camera.faceMat, GL.Matrix.translate, [this.camera.pos.x, this.camera.pos.y, this.camera.pos.z]);
            GL.Matrix.multiplyThenLoadTo(this.camera.faceMat, GL.Matrix.rotate, [this.camera.angleX, 1, 0, 0]);
            GL.Matrix.multiplyThenLoadTo(this.camera.faceMat, GL.Matrix.rotate, [this.camera.angleY, 0, 1, 0]);
        }
    }
    lookAt(center){
        GL.Matrix.processThenLoadTo(this.camera.faceMat, GL.Matrix.rotate, [-this.camera.angleY, 0, 1, 0]);
        GL.Matrix.multiplyThenLoadTo(this.camera.faceMat, GL.Matrix.rotate, [-this.camera.angleX, 1, 0, 0]);
        const eye = this.camera.faceMat.transformPoint(this.camera.pos.negative());
        const up = new GL.Vector(0, 1, 0);
        GL.Matrix.lookAt(eye.x, eye.y, eye.z, center.x, center.y, center.z, up.x, up.y, up.z, this.camera.faceMat);
    }
    selectObjectsViaOverlay(){
        this.selectableWebGLItems.forEach(m => {
            const point = Global.gl.project(m.pos.x, m.pos.y, m.pos.z);
            m.isPreSelected = this.overlay.containPoint(point.x, point.y);
        });
    }
    rotateObjects(e){
        let deltas;
        if(this.axisHitResult && this.axisHitResult.targetAxis) {
            const axis = this.axes[this.axisHitResult.targetAxis];
            const length = this.axes.guide.dot(new GL.Vector(e.deltaX, e.deltaY, 0));
            deltas = axis.multiply(length).toArray();
        }
        else{
            deltas = [e.deltaY, e.deltaX, 0];
        }
        deltas = deltas.map(m => Math.ceil(m));
        this.selectedObjectHandler.addAngles(deltas);
    }
    dragObjects(e){
        /* MEMO :
         These two calculation are equivalent. The first one doesn't need a plane distance, instead it needs a hit point,
         but that point needs no matter what to calculate a movement, so let's keep using the first for simplicity.

            this.objHitResult.hit.subtract(tracer.eye).dot(this.objHitResult.normal)
            this.objHitResult.planeDistance - (tracer.eye).dot(this.objHitResult.normal)
         */

        let tracer = new GL.Raytracer(),
            ray = tracer.getRayForPixel(e.x, e.y),
            t = this.objHitResult.hit.subtract(tracer.eye).dot(this.objHitResult.normal) / ray.dot(this.objHitResult.normal),
            hit = tracer.eye.add(ray.multiply(t)),
            movement = hit.subtract(this.objHitResult.hit);

        // MEMO : Move along a selected axis
        if(this.axisHitResult && this.axisHitResult.targetAxis) {
           const axis = this.axes[this.axisHitResult.targetAxis];
           const length = movement.dot(axis);
           movement = axis.multiply(length);
        }

        if(!this.snapBase || this.snapBase.isSelected) {
            this.selectedObjectHandler.drag(movement);
        }
        else{
            this.selectedObjectHandler.snap(this.snapBase, movement);
        }
    }
    dragVertices(e){
        // TODO : refactor duplication
        let tracer = new GL.Raytracer(),
            ray = tracer.getRayForPixel(e.x, e.y),
            t = this.objHitResult.hit.subtract(tracer.eye).dot(this.objHitResult.normal) / ray.dot(this.objHitResult.normal),
            hit = tracer.eye.add(ray.multiply(t)),
            movement = hit.subtract(this.objHitResult.hit);
        this.selectedVertexQueue.forEach(s => { s.v.drag(movement); });
        [...new Set(this.selectedVertexQueue.map(s => s.m))].forEach(m => m.sharedVertices.recompile());
    }
    mouseUpActionHandler(e){
        if (e.buttons === RIGHT_BUTTON)
            return;

        if(this.overlay.isEnabled) {
            this.overlay.endDragging();
            this.items.forEach(m => {
                m.isSelected = m.isPreSelected;
                m.isPreSelected = false;
            });
            this.updateSelectedItems();
        }
    }
    mouseWheelActionHandler(e){
        this.translateCamera(e);
    }
    translateCamera (e){
        let wheelData = 0;
        if (e.wheelDelta > 0 || e.detail < 0) {
            wheelData += (Math.abs(e.wheelDelta || e.detail) * 0.005);
        }
        else {
            wheelData -= (Math.abs(e.wheelDelta || e.detail) * 0.005);
        }

        if(GL.keys.SHIFT){
            this.camera.pos.y -= wheelData;
        }
        else if(GL.keys.CTRL){
            this.camera.pos.x -= wheelData;
        }
        else{
            this.camera.pos.z += wheelData;
        }
        this.updateCamera();
        e.preventDefault();
    }
    moveCameraTo(posArray, angleX, angleY){
        this.camera.pos = GL.Vector.fromArray(posArray);
        this.camera.angleX = angleX;
        this.camera.angleY = angleY;
        this.camera.faceMat = GL.Matrix.identity();
        this.camera.faceX = 0;
        this.camera.faceY = 0;
        this.updateCamera();
    }
    resetCameraPosition(){ this.moveCameraTo(this.defaultCameraPosition.toArray(), 20, 0); }
    moveCameraToFront(){ this.moveCameraTo([0, 0, -4], 0, 0); }
    moveCameraToRight(){ this.moveCameraTo([0, 0, -4], 0, -90); }
    moveCameraToBack(){ this.moveCameraTo([0, 0, -4], 0, 180); }
    moveCameraToLeft(){ this.moveCameraTo([0, 0, -4], 0, 90); }
    moveCameraToTop(){ this.moveCameraTo([0, 0, -4], 90, 0); }
    moveCameraToBottom(){ this.moveCameraTo([0, 0, -4], -90, 0); }
    increaseTime(time){
        this.time += time;
        this.blinkSnapPlanes();
    }
    toggleEditMode(){
        this.editMode = this.editMode === DIY.EditMode.Mesh ? DIY.EditMode.Vertex : DIY.EditMode.Mesh;
        if(this.editMode === DIY.EditMode.Vertex && !this.selectedObjectHandler.visible){
            alert('To enable Vertex Edit, please select one or more meshes before');
            this.editMode = DIY.EditMode.Mesh;
        } else if(this.editMode === DIY.EditMode.Vertex && this.selectedWebGLItems.some(m => !m.isCSGable)){
            alert('To enable Vertex Edit, please select CSGable objects');
            this.editMode = DIY.EditMode.Mesh;
        }
    }
    snapMode(){
        this.snapBase = null;
        this.items.forEach(m => m.isSnapBase = false);
        if(this.selectedWebGLItems.length > 0){
            this.selectedWebGLItems[0].setSnapBase();
            this.snapBase = this.selectedWebGLItems[0];
        }
    }
    blinkSnapPlanes(){
        if(!this.snapBase)
            return;
        this.snapBase.planes.forEach(p => p.blink());
    }
    drawSnapPlanes(gl, shaders, context){
        if(!this.snapBase)
            return;
        this.snapBase.planes.forEach(p => p.draw(gl, shaders, context));
    }
    toggleFocusMode(){
        this.focusMode = !this.focusMode;
    }
    toggleDebugView(){
        this.debugView = !this.debugView;
    }
    updateCanvasSize(){
        const windowSize = Utils.getWindowSize();
        const LumberListWidth = 31;
        const RightSideContainer = 29;
        const LowerBound = 100;
        this.width = Math.max(600, windowSize.width - (RightSideContainer + LumberListWidth));
        this.height = Math.max(400, windowSize.height - LowerBound);
        Global.gl.canvas.width = this.width;
        Global.gl.canvas.height = this.height;
        this.overlay.updateCanvasSize(this.width, this.height);

        const $editor = document.getElementById('editor');
        $editor.style.height = this.height + 'px';
    }
    notifyPageMounted(){
        this.selectedObjectHandler.initMesh();
    }
}