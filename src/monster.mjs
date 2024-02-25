import { Monster as MEMonster } from 'marker-engine';
import { preloadFBX, setMarkersDirty, customMarkers, setMarkerTypesDirty, allMonsterTypes } from './preload-fbx.mjs';
export class Monster extends MEMonster{
    static model = null;
    static modelFile = null;
    static async preload(modelPath){
        const modelLocation = modelPath || this.modelFile;
        if(modelLocation) this.model = await preloadFBX(modelLocation);
        allMonsterTypes.push(this);
        setMarkerTypesDirty();
    }
    constructor(options={}){
        super(options);
        allMonsters.push(this);
        setMarkersDirty();
    }
}