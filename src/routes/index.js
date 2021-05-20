var express = require('express');
var router = express.Router();
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

function readFileAsync(fileName){
    return new Promise((resolve, reject) => {
        try {
            fs.readFile(fileName, 'utf8', (err, buffer) =>{
                if (err) reject(err);
                else resolve(buffer);
            });
        } catch (err) {
            reject(err);
        }
    });
}

router.get('/index', async (req, res, next) => {
    const black_vs = `void main() {
        gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
    }`;
    const black_fs = `uniform vec3 color;
    uniform float alpha;
    void main() {        
        gl_FragColor = vec4(color, alpha);
    }`;

    console.log(__dirname);
    try{
        const main_vs = await readFileAsync('./shaders/main-vertex.glsl');
        const main_fs = await readFileAsync('./shaders/main-fragment.glsl');
        const axis_vs = await readFileAsync('./shaders/axis-vertex.glsl');
        const axis_fs = await readFileAsync('./shaders/axis-fragment.glsl');
        const light_vs = await readFileAsync('./shaders/light-vertex.glsl');
        const light_fs = await readFileAsync('./shaders/light-fragment.glsl');
        const floor_vs = await readFileAsync('./shaders/floor-vertex.glsl');
        const floor_fs = await readFileAsync('./shaders/floor-fragment.glsl');
        const floor2_vs = await readFileAsync('./shaders/floor2-vertex.glsl');
        const floor2_fs = await readFileAsync('./shaders/floor2-fragment.glsl');
        const point_vs = await readFileAsync('./shaders/point-vertex.glsl');
        const point_fs = await readFileAsync('./shaders/point-fragment.glsl');
        const circle_vs = await readFileAsync('./shaders/circle-vertex.glsl');
        const circle_fs = await readFileAsync('./shaders/circle-fragment.glsl');
        res.render('index', { title: 'index',  main_vs, main_fs, black_vs, black_fs, axis_vs, axis_fs, light_vs, light_fs, floor_vs, floor_fs, floor2_vs, floor2_fs, point_vs, point_fs, circle_vs, circle_fs});
    }
    catch(e){
        console.log(e);
        res.render('index', { title: 'index error'});
    }
});

router.get('/raycast', async (req, res, next) => {
    console.log(__dirname);
    try{
        res.render('raycast', { title: 'raycast'});
    }
    catch(e){
        console.log(e);
        res.render('raycast', { title: 'raycast error'});
    }
});



module.exports = router;
