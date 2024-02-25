import { PhysicsProjectile as MEPhysicsProjectile } from 'marker-engine';
import { preloadFBX, setMarkersDirty, customMarkers, setMarkerTypesDirty, allPhysicsProjectileTypes } from './preload-fbx.mjs';
export class PhysicsProjectile extends MEPhysicsProjectile{
    static model = null;
    static modelFile = null;
    static async preload(modelPath){
        const modelLocation = modelPath || this.modelFile;
        if(modelLocation) this.model = await preloadFBX(modelLocation);
        allPhysicsProjectileTypes.push(this);
        setMarkerTypesDirty();
    }
    constructor(options={}){
        super(options);
        allPhysicsProjectiles.push(this);
        setMarkersDirty();
    }
}