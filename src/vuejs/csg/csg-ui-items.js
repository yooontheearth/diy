import _ from 'lodash'
import CSG from '../lib/csg'
import GL from '../lib/lightgl'
import Utils from '../util'
import './csg-mesh'

export class Group{
    constructor(){
        this.id = Utils.generateId();
        this.childItems = [];
        this.icon = 'icon-group';
        this.isUndrawable = true;
        this.isUiItem = true;
        this.isSelected = false;
        this.parentGroup = null;
    }
    cleanUp(){
        this.childItems.forEach(c => c.parentGroup = null);
    }
    addChild(item){
        this.childItems.push(item);
        item.parentGroup = this;
    }
    insertItemAfter(child, item){
        Utils.insertItemAfter(this.childItems, child, item);
        item.parentGroup = this;
    }
    removeChild(item){
        Utils.removeItem(this.childItems, item);
        item.parentGroup = null;
    }
}

export class Lumber extends GL.Mesh.CSGableCube{
    constructor(option, pos){
        super(option, pos);
        this.id = Utils.generateId();
        this.icon = 'icon-lumber';
        this.parentGroup = null;
    }
    cleanUp(){
        super.cleanUp();
        this.parentGroup = null;
    }
}
