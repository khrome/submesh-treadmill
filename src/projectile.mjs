import { Projectile as MEProjectile } from 'marker-engine';
import { preloadFBX, setMarkersDirty, customMarkers, setMarkerTypesDirty, allProjectileTypes } from './preload-fbx.mjs';
export class Projectile extends MEProjectile{
    static model = null;
    static modelFile = null;
    static async preload(modelPath){
        const modelLocation = modelPath || this.modelFile;
        if(modelLocation) this.model = await preloadFBX(modelLocation);
        allProjectileTypes.push(this);
        setMarkerTypesDirty();
    }
    constructor(options={}){
        super(options);
        allProjectiles.push(this);
        setMarkersDirty();
    }
}