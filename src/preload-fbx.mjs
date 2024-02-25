export const allProjectileTypes = [];
export const allPhysicsProjectileTypes = [];
export const allSceneryTypes = [];
export const allMonsterTypes = [];
export const customMarkerTypes = [];
export let everyMarkerType = null;
export let markerTypesDirty = true;
export const setMarkerTypesDirty = ()=>{
    markersDirty = true;
}

export const allMarkerTypes = ()=>{
    if(markersDirty){
        markersDirty = [
            ...allProjectileTypes, 
            ...allPhysicsProjectileTypes, 
            ...allSceneryTypes, 
            ...allMonsterTypes,
            ...customMarkerTypes
        ];
        markersDirty = false;
    }
    return markersDirty;
}


export const allProjectiles = [];
export const allPhysicsProjectiles = [];
export const allScenery = [];
export const allMonsters = [];
export const customMarkers = [];
export let everyMarker = null;
export let markersDirty = true;
export const setMarkersDirty = ()=>{
    markersDirty = true;
}

export const allMarkers = ()=>{
    if(markersDirty){
        everyMarker = [
            ...allProjectiles, 
            ...allPhysicsProjectiles, 
            ...allScenery, 
            ...allMonsters,
            ...customMarkers
        ];
        console.log('AM', everyMarker)
        markersDirty = false;
    }
    return everyMarker;
}

export const preloadFBX = async (model, options={})=>{
    const fbxLoader = new FBXLoader()
    return await new Promise((resolve, reject)=>{
        fbxLoader.load(
            model,
            (object) => {
                object.traverse((child)=>{
                    if(child.isMesh){
                        //child.rotation.x += 1.5;
                        //child.scale.set(.01, .01, .01)
                        //child.matrix.makeRotationX(1.5)
                    }
                })
                //object.scale.set(.01, .01, .01)
                //object.makeRotationX(1.5)
                //object.rotation.x += 1.5;
                resolve(object);
            },
            (xhr) => {
                //console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                reject(error)
            }
        );
    });
}