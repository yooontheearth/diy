import _ from "lodash";

class Utils {
    constructor(){
        this.uiId = 1;
    }
    generateId(){
        return this.uiId ++;
    }
    round(number, precision) {
        const shift = (number, precision) => {
            const numArray = ("" + number).split("e");
            return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
        };
        return shift(Math.round(shift(number, +precision)), -precision);
    }
    toDegree(radian){
        return radian * (180/Math.PI);
    }
    updateMinMax(min, max, vector){
        const [x, y, z] = _.isArray(vector) ? vector : vector.toArray();
        if(x < min.x)
            min.x = x;
        if(y < min.y)
            min.y = y;
        if(z < min.z)
            min.z = z;

        if(max.x < x)
            max.x = x;
        if(max.y < y)
            max.y = y;
        if(max.z < z)
            max.z = z;
    }
    clampAngle(angle){
        return _.clamp(Math.round(angle), 0, 360);
    }
    getAngleFromCosine(radian){
        return this.toDegree(Math.acos(radian));
    }
    getWindowSize(){
        const w = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0],
            wi = w.innerWidth || e.clientWidth || g.clientWidth,
            h = w.innerHeight|| e.clientHeight|| g.clientHeight;
        return { width:wi, height:h };
    }
    insertItemAfter(array, child, item){
        const index = array.indexOf(child);
        array.splice(index + 1, 0, item);
    }
    removeItem(array, item){
        const index = array.indexOf(item);
        if (index > -1)
            array.splice(index, 1);
    }
}
export default new Utils();