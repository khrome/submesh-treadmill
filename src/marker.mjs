import { Marker as MEMarker } from 'marker-engine';
import { preloadFBX, setMarkersDirty, setMarkerTypesDirty, customMarkers, customMarkerTypes } from './preload-fbx.mjs';
export class Marker extends MEMarker{
    static model = null;
    static modelFile = null;
    static async preload(modelPath){
        const modelLocation = modelPath || this.modelFile;
        if(modelLocation) this.model = await preloadFBX(modelLocation);
        customMarkerTypes.push(this);
        setMarkerTypesDirty();
    }
    constructor(options={}){
        super(options);
        customMarkers.push(this);
        setMarkersDirty();
        console.log('ST MARKER', customMarkers)
    }
}