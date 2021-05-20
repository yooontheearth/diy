import './css/index.styl'
import _ from 'lodash'
import Vue from "vue"
import LumberList from './components/lumber-list.vue'
import RightSideContainer from './components/right-side-container'
import OBJ from './lib/webgl-obj-loader'
import GL from './lib/lightgl'
import Context from './context'
import { Canvas, MainView, SubView } from './canvas'
import './csg/csg-mesh'
import './csg/csg-ext'
import { Lumber, Group } from './csg/csg-ui-items'

document.addEventListener("DOMContentLoaded",() => {
    OBJ.downloadMeshes({
        'hudAxis': '/objs/axis.obj',
        'objAxis': '/objs/axis-for-object.obj',
    }, (downloadedMeshes) => {
        const root = new Vue({
            el:'#root',
            components:{
                LumberList,
                RightSideContainer
            },
            data:{
                context: new Context(800, 600)
            },
            mounted: function(){
                const gl = GL.create({id:'main-canvas'});
                this.context.notifyPageMounted();

                this.canvas = new Canvas(downloadedMeshes, gl, this.context);
                new MainView(this.canvas);
                this.subView = new SubView(this.canvas, this.context);
                this.resizeWindow();

                window.addEventListener("resize", this.resizeWindow);
            },
            beforeDestroy: function(){
                window.removeEventListener("resize", this.resizeWindow);
            },
            methods: {
                resizeWindow: _.debounce(function(){
                    this.context.updateCanvasSize();
                    this.subView.updateSize(this.context);
                }, 300),
                addLumbers: function(addLumberInfo){
                    let lastX = 0;
                    addLumberInfo.forEach((item, index) => {
                        const option = {
                            radius: [item.width*.5, item.length*.5, item.height*.5 ],
                            label: item.label
                        };

                        // TODO : add to a selected group if there is
                        this.context.addItem(new Lumber(option, [lastX, 0, 0]));
                        lastX += item.width;
                    });
                },
                subtract: function () {
                    const items = this.context.selectedWebGLItemQueue;
                    if (items.length > 2) {
                        alert('You selected more than two meshes');
                        return;
                    }
                    if (items.length === 0) {
                        alert('You selected none meshes');
                        return;
                    }
                    if (items.length === 1) {
                        alert('You need to select two meshes');
                        return;
                    }
                    if (items.some(item => !item.isCSGable)) {
                        alert('You selected an object which is not csg operationable');
                        return;
                    }

                    // TODO : the position of the newly created object is weird, need to fix
                    let s = items[0].subtract(items[1]);
                    this.context.addItem(new GL.Mesh.CSGableObject(s, items[0].pos, items[0].angle));
                    this.context.removeItems(items);   // MEMO : subtraction makes a new mesh, so the meshes used for subtraction must be removed
                },
                debug: function () {
                    // MEMO : call debug code you want to test
                    alert('Not implemented right now')
                },
                toggleEditMode: function () { this.context.toggleEditMode(); },
                toggleDebugView: function () { this.context.toggleDebugView(); },
                snapMode: function(){ this.context.snapMode(); },
                focusMode: function(){ this.context.toggleFocusMode(); },
                resetCamera: function () { this.context.resetCameraPosition(); },
                moveCameraToFront: function () { this.context.moveCameraToFront(); },
                moveCameraToRight: function () { this.context.moveCameraToRight(); },
                moveCameraToBack: function () { this.context.moveCameraToBack(); },
                moveCameraToLeft: function () { this.context.moveCameraToLeft(); },
                moveCameraToTop: function () { this.context.moveCameraToTop(); },
                moveCameraToBottom: function () { this.context.moveCameraToBottom(); }
            }
        });

        // TODO : debug purpose
        root._data.context.addItem(new Lumber({
            radius: [0.2*.5, 3.0*.5, 0.5*.5 ],
            label: '1'
        }));
        root._data.context.addItem(new Lumber({
            radius: [0.2*.5, 1.0*.5, 0.2*.5 ],
            label: '2'
        }, [-1.5, 0, 0]));
        root._data.context.addItem(new Lumber({
            radius: [0.2*.5, 1.0*.5, 0.2*.5 ],
            label: '3'
        }, [-1.5, 1, 0]));
        const item = root._data.context.addItem(new Lumber({
            radius: [0.2*.5, 1.0*.5, 0.2*.5 ],
            label: '4'
        }, [-1.5, 2, 0]));

        const group = new Group();
        group.addChild(item);
        root._data.context.addItem(group);
    });
});