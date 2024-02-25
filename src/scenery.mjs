import { Scenery as MEScenery } from 'marker-engine';
import { preloadFBX, setMarkersDirty, customMarkers, allSceneryTypes } from './preload-fbx.mjs';
export class Scenery extends MEScenery{
    static model = null;
    static modelFile = null;
    static async preload(modelPath){
        const modelLocation = modelPath || this.modelFile;
        if(modelLocation) this.model = await preloadFBX(modelLocation);
        allSceneryTypes.push(this);
        setMarkersDirty();
    }
    constructor(options={}){
        super(options);
        allScenery.push(this);
    }
}