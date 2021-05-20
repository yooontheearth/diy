import GL from '../lib/lightgl'
import * as HitAreaVisualizer from '../visualizer'
import HitArea from "./csg-hitarea";

export default class SharedVertices extends GL.Mesh{
	constructor(options){
        options = options || {};
        options.points = true;
        super(options);

        const parentMesh = options.mesh;    // MEMO : to pass to the parse method, make a local variable
		this.parentMesh = parentMesh;
		const tempSharedVertexMap = {};
		const self = this;
		function parse(posArray){
			const key = JSON.stringify(posArray);
			if (!(key in tempSharedVertexMap)) {
			  tempSharedVertexMap[key] = new SharedVertex(posArray, parentMesh, self);
			}
			tempSharedVertexMap[key].addReference(posArray);
		}
		this.parentMesh.vertices.forEach(parse);
		this.sharedVertexArray = [];
		_.forOwn(tempSharedVertexMap, (sv, key) =>{ this.sharedVertexArray.push(sv); });
		
		this.vertices = this.sharedVertexArray.map(sv => sv.toArray());
		this.addVertexBuffer('selectedPoints', 'selectedPoint');
		this.selectedPoints = this.sharedVertexArray.map(sv => false);
		this.compile();

		this.hitAreaForVertex = new HitArea({ radius: 0.008  });    // TODO change it to corresponding point shader size
		this.hitAreaForSelectecdVertex = new HitArea({ radius: 0.012 });

        HitAreaVisualizer.instance.add(this, this.drawHitArea);  // TODO debug purpose
		this.hitAreaMat = new GL.Matrix();
	}
	draw(gl, shaders){		
		shaders.pointShader.draw(this, gl.POINTS);
	}
	recompile(){
		this.sharedVertexArray.forEach(sv => sv.applyMovementToReferences());
		this.parentMesh.isInvalidatedCSG = true;	// MEMO : mesh.csg needs to be updated before processing a CSG operation
		this.parentMesh.compileSpecificBuffer('gl_Vertex', this.parentMesh.vertices);
		this.compileSpecificBuffer('gl_Vertex', this.sharedVertexArray.map(sv => sv.toArray()));
		this.compileSpecificBuffer('selectedPoint', this.sharedVertexArray.map(sv => sv.isSelected));
	}
	recompileOnSelectedPoint(){
        this.compileSpecificBuffer('selectedPoint', this.sharedVertexArray.map(sv => sv.isSelected));
    }
    drawHitArea(gl, shaders, context){
        gl.pushMatrix();
        const currentPos = this.parentMesh.pos;
        const mat = this.hitAreaMat;
        GL.Matrix.processThenLoadTo(mat, GL.Matrix.translate, [currentPos.x, currentPos.y, currentPos.z]);
        GL.Matrix.multiplyThenLoadTo(mat, GL.Matrix.rotate, [this.parentMesh.angle.x, 1, 0, 0]);
        GL.Matrix.multiplyThenLoadTo(mat, GL.Matrix.rotate, [this.parentMesh.angle.y, 0, 1, 0]);
        GL.Matrix.multiplyThenLoadTo(mat, GL.Matrix.rotate, [this.parentMesh.angle.z, 0, 0, 1]);

        this.sharedVertexArray.forEach(sv =>{
            gl.pushMatrix();
            gl.multMatrix(mat);
            gl.translate(...sv.toArray());
            const hitArea = this.isSelected ? this.hitAreaForSelectecdVertex : this.hitAreaForVertex;
            shaders.blackShader.draw(hitArea, gl.LINES);
            gl.popMatrix();
        });
        gl.popMatrix();
	}
	updateSize(value, property){
		this.sharedVertexArray.forEach(sv => {
			const propValue = sv[property];
			if(propValue < 0)
                sv[property] = propValue - value;
			else
                sv[property] = propValue + value;
		});
		this.recompile();
	}
}
class SharedVertex extends GL.Vector {
	constructor(posArray, parentMesh, sharedVertices){
		super(...posArray);
		this.references = [];
		this.isSelected = false;
		this.parentMesh = parentMesh;
		this.sharedVertices = sharedVertices;
        this.mat = new GL.Matrix();
	}
	addReference(posArray){
		this.references.push(posArray);
	}
	testClick(tracer, ray){
        const hitArea = this.isSelected ? this.sharedVertices.hitAreaForSelectecdVertex : this.sharedVertices.hitAreaForVertex;

        const currentPos = this.parentMesh.pos;
        GL.Matrix.processThenLoadTo(this.mat, GL.Matrix.translate, [currentPos.x, currentPos.y, currentPos.z]);
        GL.Matrix.multiplyThenLoadTo(this.mat, GL.Matrix.rotate, [this.parentMesh.angle.x, 1, 0, 0]);
        GL.Matrix.multiplyThenLoadTo(this.mat, GL.Matrix.rotate, [this.parentMesh.angle.y, 0, 1, 0]);
        GL.Matrix.multiplyThenLoadTo(this.mat, GL.Matrix.rotate, [this.parentMesh.angle.z, 0, 0, 1]);
		const calculatedPos = this.mat.transformPoint(this);

		// MEMO : vertex itself doesn't rotate, so doesn't need to hittest with obb
		const hitResult = GL.Raytracer.hitTestBox(tracer.eye, ray, calculatedPos.subtract(hitArea.size), calculatedPos.add(hitArea.size));
		this.lastPosBeforeDragging = this.clone();
		return hitResult;
	}
	drag(movement){
        // TODO : needs to fix, especially when rotating heavily, movement isn't correct
        GL.Matrix.processThenLoadTo(this.mat, GL.Matrix.rotate, [this.parentMesh.angle.x, 1, 0, 0]);
        GL.Matrix.multiplyThenLoadTo(this.mat, GL.Matrix.rotate, [this.parentMesh.angle.y, 0, 1, 0]);
        GL.Matrix.multiplyThenLoadTo(this.mat, GL.Matrix.rotate, [this.parentMesh.angle.z, 0, 0, 1]);
        const rotatedMovement = this.mat.transformPoint(movement);

	    const newPos = this.lastPosBeforeDragging.add(rotatedMovement);
		this.x = newPos.x;
		this.y = newPos.y;
		this.z = newPos.z;
	}
	applyMovementToReferences(){
		this.references.forEach(posArray => { 
			posArray[0] = this.x;
			posArray[1] = this.y;
			posArray[2] = this.z;
		})
	}
}
