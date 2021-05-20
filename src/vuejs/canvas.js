import _ from 'lodash'
import * as HitAreaVisualizer from './visualizer'
import GL from './lib/lightgl'
import LightSource from './csg/csg-lightsource'
import HitArea from './csg/csg-hitarea'
import Floor from './csg/csg-floor'
import {ObjAxis, HudAxis, CameraAxis} from './csg/csg-obj'
import Global from './global.js'

export class Canvas {
    constructor(downloadedMeshes, gl, c){
        this.setupProperties(downloadedMeshes, gl, c);
        this.setupShaders();
        this.setupBasics();
    }
    addViewer(callback){
        this.viewers.push(callback);
    }
    setupProperties(downloadedMeshes, gl, c){
        this.gl = gl;
        this.c= c;
        Global.gl = gl;
        c.createOverlay();
        c.addItem(new Floor());
        this.light = c.addItem(new LightSource([1.0, 5.0, 1.0]));
        this.hudAxis = new HudAxis(downloadedMeshes.hudAxis);
        this.objAxis = new ObjAxis(downloadedMeshes.objAxis, c);
        Global.objAxis = this.objAxis;
        this.cameraAxis = new CameraAxis(downloadedMeshes.objAxis, c);  // TODO : change to a camera mesh
        this.viewers = [];
    }
    setupShaders(){
        const shaders = this.shaders = {
            circleShader : new GL.Shader(document.getElementById('circle_vs').firstChild.textContent, document.getElementById('circle_fs').firstChild.textContent),
            pointShader : new GL.Shader(document.getElementById('point_vs').firstChild.textContent, document.getElementById('point_fs').firstChild.textContent),
            floorShader : new GL.Shader(document.getElementById('floor_vs').firstChild.textContent, document.getElementById('floor_fs').firstChild.textContent),
            floor2Shader : new GL.Shader(document.getElementById('floor2_vs').firstChild.textContent, document.getElementById('floor2_fs').firstChild.textContent),
            lightShader : new GL.Shader(document.getElementById('light_vs').firstChild.textContent, document.getElementById('light_fs').firstChild.textContent),
            axisShader : new GL.Shader(document.getElementById('axis_vs').firstChild.textContent, document.getElementById('axis_fs').firstChild.textContent),
            objAxisShader : new GL.Shader(document.getElementById('axis_vs').firstChild.textContent, document.getElementById('axis_fs').firstChild.textContent),
            blackShader : new GL.Shader(document.getElementById('black_vs').firstChild.textContent, document.getElementById('black_fs').firstChild.textContent),
            colorLineShader : new GL.Shader(document.getElementById('black_vs').firstChild.textContent, document.getElementById('black_fs').firstChild.textContent),
            mainShader : new GL.Shader(document.getElementById('main_vs').firstChild.textContent, document.getElementById('main_fs').firstChild.textContent)
        };
        shaders.blackShader.defaultUniforms = {
            color:[0,0,0],
            alpha:1.0
        };
        shaders.blackShader.uniforms(shaders.blackShader.defaultUniforms);
        const lightDefaultUniforms = {
            "Light.Position": this.light.pos,
            "Light.La": [.4, .4, .4],
            "Light.Ld": [1.0, 1.0, 1.0],
            "Light.Ls": [1.0, 1.0, 1.0],
        };
        shaders.objAxisShader.uniforms(this.objAxis.materialUniforms);
        shaders.axisShader.uniforms(this.hudAxis.materialUniforms);
        shaders.mainShader.uniforms({
            "Material.Ka": [.9, .5, .3],
            "Material.Kd": [.9, .5, .3],
            "Material.Ks": [.8, .8, .8],
            "Material.Shininess": 5.0,
            "isSelected": false
        });
        shaders.mainShader.uniforms(lightDefaultUniforms);
    }
    setupBasics(){
        const [gl, c, shaders] = [this.gl, this.c, this.shaders];
        gl.onmousedown = c.mouseDownActionHandler.bind(c);
        gl.onmousemove = c.mouseMoveActionHandler.bind(c);
        gl.onmouseup = c.mouseUpActionHandler.bind(c);
        ['mousewheel', 'DOMMouseScroll'].forEach(event => gl.canvas.addEventListener(event, c.mouseWheelActionHandler.bind(c)));
        gl.onupdate = c.increaseTime.bind(c);
        gl.ondraw = () => { this.viewers.forEach(v => v())};    // DRAW!!

        // Set up the viewport
        gl.canvas.width = c.width;
        gl.canvas.height = c.height;
        this.changeViewport(c.width, c.height);

        // Set up WebGL state
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.93, 0.93, 0.93, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.polygonOffset(1, 1);
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.animate();
    }
    changeViewport(w, h){
        this.changeViewportAt(0, 0, w, h);
    }
    changeViewportAt(x, y, w, h){
        const gl = this.gl;
        gl.viewport(x, y, w, h);
        gl.matrixMode(gl.PROJECTION);
        gl.loadIdentity();
        gl.perspective(45, w / h, 0.1, 100);
        gl.matrixMode(gl.MODELVIEW);
    }
    drawHUD(){
        const [gl, c, shaders] = [this.gl, this.c, this.shaders];
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.pushMatrix();
        this.changeViewport(100, 100);
        gl.loadIdentity();
        gl.translate(0, 0, -12);
        gl.rotate(c.camera.angleX, 1, 0, 0);
        gl.rotate(c.camera.angleY, 0, 1, 0);
        this.hudAxis.draw(gl, shaders);
        gl.popMatrix();
    }
    enableBlending(){
        this.gl.enable(this.gl.BLEND);
        this.gl.depthMask(false);
    }
    disableBlending(){
        this.gl.disable(this.gl.BLEND);
        this.gl.depthMask(true);
    }
}

export class MainView{
    constructor(canvas){
        const boundView = this.view.bind(canvas);
        canvas.addViewer(function(){ boundView({}); });
    }
    view(options){
        const [gl, c, shaders] = [this.gl, this.c, this.shaders];
        gl.makeCurrent();

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.loadIdentity();
        gl.multMatrix(c.camera.faceMat);

        const lightPosUniform = {
            "Light.Position": gl.modelviewMatrix.transformPoint(this.light.pos)
        };
        shaders.mainShader.uniforms(lightPosUniform);
        shaders.lightShader.uniforms({
            "time": c.time
        });
        shaders.floorShader.uniforms({
            "floorTexSampler" : 0
        });
        shaders.pointShader.uniforms({
            "windowSize" : [c.width, c.height]
        });

        c.drawableItems.filter(m => !m.isBlending()).forEach(m => { m.draw(gl, shaders, c); });
        c.selectedObjectHandler.draw(gl, shaders, c);
        HitAreaVisualizer.instance.draw(gl, shaders, c);

        this.enableBlending();
        c.drawableItems.filter(m => m.isBlending()).forEach(m => { m.draw(gl, shaders, c); });
        c.drawSnapPlanes(gl, shaders, c);
        this.disableBlending();

        this.objAxis.draw(gl, shaders);
        c.overlay.draw();
        this.drawHUD();
        this.changeViewport(c.width, c.height);
    }
}

export class SubView{
    constructor(canvas, context){
        const defaultOptions = {
            camera: { pos: GL.Vector.fromArray([0, -1.5, -10]), angleX:10, angleY:0 }
        };
        const self = this;
        self.options = Object.assign(defaultOptions, {});
        this.updateSize(context);

        const boundView = this.view.bind(canvas);
        canvas.addViewer(function(){ boundView(self.options); });
    }
    updateSize(context){
        this.options.width = _.clamp(context.width/2, 200, 600);
        this.options.height = _.clamp(context.height/2, 200, 600);
    }
    view(options){
        const [gl, c, shaders] = [this.gl, this.c, this.shaders];
        const [w, h] = [options.width, options.height];
        const [x, y] = [c.width-w, c.height-h];

        gl.makeCurrent();
        this.changeViewportAt(x, y, w, h);
        gl.scissor(x, y, w, h);
        gl.enable(gl.SCISSOR_TEST);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.pushMatrix();
        gl.loadIdentity();
        gl.translate(options.camera.pos.x, options.camera.pos.y, options.camera.pos.z);
        gl.rotate(options.camera.angleX, 1, 0, 0);
        gl.rotate(options.camera.angleY, 0, 1, 0);

        const lightPosUniform = {
            "Light.Position": gl.modelviewMatrix.transformPoint(this.light.pos)
        };
        shaders.mainShader.uniforms(lightPosUniform);
        shaders.pointShader.uniforms({
            "windowSize" : [w, h]
        });

        this.cameraAxis.draw(gl, shaders);  // show the camera
        c.drawableItems.filter(m => !m.isBlending()).forEach(m => { m.draw(gl, shaders, c); });
        c.selectedObjectHandler.draw(gl, shaders, c);
        HitAreaVisualizer.instance.draw(gl, shaders, c);

        this.enableBlending();
        c.drawableItems.filter(m => m.isBlending()).forEach(m => { m.draw(gl, shaders, c); });
        c.drawSnapPlanes(gl, shaders, c);
        this.disableBlending();

        this.objAxis.draw(gl, shaders);

        gl.disable(gl.SCISSOR_TEST);
        this.changeViewport(c.width, c.height);
        gl.popMatrix();
    }
}