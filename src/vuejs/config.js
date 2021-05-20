import * as DIY  from './enums'

export const isDebugMode = true;
const settings = {
    lengthDisplayMode:DIY.LengthDisplayMode.Millimeter,
    setLengthDisplayMode(val){
        this.lengthDisplayMode = val;
        this.unit = this.lengthDisplayMode == DIY.LengthDisplayMode.Millimeter ? "mm" : "inch";
    },
    unit:'mm'

};
export default settings;
