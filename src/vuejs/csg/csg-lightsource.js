import CSG from '../lib/csg'
import GL from '../lib/lightgl'
import * as HitAreaVisualizer from "../visualizer";

export default class LightSource extends GL.Mesh {
    constructor(pos, visible){
        super({ normals: true, colors: true });
        const innerSphere = CSG.sphere({ radius:0.8, shared:[1, 1, 1, 0.9] });
        const outerSphere = CSG.sphere({ radius:1.2, shared:[1, 1, 1, 0.5] });
        const mesh = this;
        const indexer = new GL.Indexer();
        innerSphere.toPolygons().concat(outerSphere.toPolygons()).map(polygon => {
            let indices = polygon.vertices.map((vertex) => {
                vertex.color = polygon.shared;
                return indexer.add(vertex);
            });
            for (let i = 2; i < indices.length; i++) {
                mesh.triangles.push([indices[0], indices[i - 1], indices[i]]);
            }
        });
        mesh.vertices = indexer.unique.map(v => { return [v.pos.x, v.pos.y, v.pos.z]; });
        mesh.normals = indexer.unique.map(v => { return [v.normal.x, v.normal.y, v.normal.z]; });
        mesh.colors = indexer.unique.map(v => { return v.color; });
        mesh.compile();
        GL.Mesh.decorate(this, pos);
        this.isSelectable = false;  // TODO change to true later
        this.isBlending = function(){ return true; };

        this.visible = visible;
        if(!this.visible)
            HitAreaVisualizer.instance.remove(this);
    }
    draw(gl, shaders){
        if(!this.visible)
            return;

        shaders.lightShader.uniforms({
            "isSelected": !!this.isSelected
        });
        gl.pushMatrix();
        gl.translate(this.pos.x, this.pos.y, this.pos.z);
        shaders.lightShader.draw(this, gl.TRIANGLES);
        gl.popMatrix();
    }
}
