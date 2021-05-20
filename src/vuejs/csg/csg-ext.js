import CSG from '../lib/csg'
import GL from '../lib/lightgl'

CSG.prototype.setColor = function(r, g, b) {
    this.toPolygons().map((polygon) => {
        polygon.shared = [r, g, b];
    });
};
CSG.prototype.toMesh = function(mesh) {
    const indexer = new GL.Indexer();
    this.toPolygons().map((polygon) => {
        let indices = polygon.vertices.map((vertex) => {
            vertex.color = polygon.shared || [1, 1, 1];
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
    return mesh;
};
