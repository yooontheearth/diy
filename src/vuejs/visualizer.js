import * as config from './config'

class HitAreaVisualizer {
    constructor(){
        this.handlers = new Map();
    }
    draw(gl, shaders, context){
        for(let handler of this.handlers.values())
            handler(gl, shaders, context);
    }
    add(obj, handler){
        if(!config.isDebugMode)
            return;
        this.handlers.set(obj, handler.bind(obj));
    }
    remove(obj){
        this.handlers.delete(obj);
    }
}
export const instance = new HitAreaVisualizer();