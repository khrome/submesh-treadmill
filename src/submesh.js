import { MeshPhongMaterial, DoubleSide, Vector3, Raycaster, Vector2, Mesh } from "three";
import { Random } from "./random";

const genericWarning = 'Submesh is a generic class and cannot be instantiated directly';

export class Submesh{
    constructor(geometry, tilePosition, options={}){
        //todo: scan geometry for size
        this.size = 16; 
        this.mesh = this.createMesh(geometry);
        this.body = this.createPhysicalMesh(this.mesh);
        this.markers = this.createMarkers() || [];
        this.options = options;
    }

    createMesh(geometry){
        const material = new MeshPhongMaterial({
            color: '#000088',    // red (can also use a CSS color string here)
            flatShading: false,
            side: DoubleSide
        });
        const mesh = new Mesh( geometry, material );
        return mesh;
    }

    createPhysicalMesh(geometry){
        return null;
    }

    createMarkers(){
        throw new Error(genericWarning)
    }

    refreshGeometry(){
        this.mesh.geometry.attributes.position.array = Float32Array.from(submesh.coords);
        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.mesh.material.needsUpdate = true;
        this.mesh.geometry.computeVertexNormals();
    }

    addTo(offset, scene, physicalWorld){
        console.log('adding', this.mesh, offset);
        scene.add( this.mesh );
        this.mesh.position.set(offset.x, offset.y, 0);
        if(this.body && physicalWorld){
            physicalWorld.addBody(this.body);
            this.body.position.copy(this.mesh.position)
            this.body.quaternion.copy(this.mesh.quaternion);
        }
        //todo: for
        if(this.markers) this.markers.forEach((marker)=>{
            scene.add( marker.mesh );
            marker.mesh.position.set(
                marker.x + offset.x, 
                marker.y + offset.y, 
                this.getHeightAt(marker.x + offset.x, marker.y + offset.y)
            );
            if(position){
                marker.mesh.position.x = marker.initialX || 0;
                marker.mesh.position.y = marker.initialY || 0;
                if(marker.body){
                    marker.body.position.x = point.x;
                    marker.body.position.y = point.y;
                }
            }
            let raycaster = null;
            if(target) raycaster = this.lookAt(target);
            if(this.body && physicalWorld){
                physicalWorld.addBody(this.body);
                if(target && options.velocity && raycaster){
                    //todo if debug, draw ray
                    this.body.velocity.set(
                        raycaster.ray.direction.x * options.velocity,
                        raycaster.ray.direction.y * options.velocity,
                        raycaster.ray.direction.z * options.velocity
                    );
                }
            }
        });
    }

    removeFrom(scene, physicalWorld){
        if(this.body && physicalWorld){
            physicalWorld.removeBody(this.body);
        }
        scene.remove(this.mesh);
        if(this.markers) this.markers.forEach((marker)=>{
            scene.remove( marker.mesh );
        });
        // todo: marker bodies
    }

    tick(){
        if(this.mesh.position && this.body && this.body.position){
            this.body.position.copy(this.mesh.position);
            this.body.quaternion.copy(this.mesh.quaternion);
        }
        let markerIndex = 0;
        const markers = this.markers;
        let marker = null;
        let x = null;
        const xOffset = this.mesh.position.x;
        let y = null;
        const yOffset = this.mesh.position.y;
        //todo: for
        if(markers) for(; markerIndex < markers.length; markerIndex++){
            marker = markers[markerIndex];
            x = marker.mesh.position.x;
            y = marker.mesh.position.y;
            let action = 'east';
            if(x - xOffset < 0) action = 'east';
            if(x - xOffset > this.size) action = 'west';
            if(y - yOffset < 0) action = 'south';
            if(x - xOffset > this.size) action = 'north';
            if(action){
                let index = this.markers.indexOf(marker);
                this.markers.splice(index, 1);
                if(this.options.onMarkerExit) this.options.onMarkerExit(marker, this, action);
            }
        }
    }

    weld(partnerSubmesh, edge, target='that'){
        weldSubmesh(submesh, partnerSubmesh, target, edge)
    }
    
}

/*export function createSubmesh(voxelMesh, x, y){
    const submesh = {
        voxels : voxelMesh.getSubmeshVoxels(x, y, 2)
    };
    submesh.coords = voxelMesh.getCoordsFromVoxels(x, y, 2, submesh.voxels);
    const submeshRandom = new Random(voxelMesh.getSeed(x, y));
    const markers = [];
    submesh.submeshX = x;
    submesh.submeshY = y;
    submesh.markers = [];
    const biome = populateFromBiome('forest', submeshRandom.random, submesh);
    const material = biome.primaryMaterial();
    submesh.mesh = voxelMesh.getSubmesh(x, y, 2, submesh.coords, material.visual);
    submesh.size = voxelMesh.submeshSize;
    submesh.body = new CANNON.Body({
        shape: new CANNON.Trimesh(submesh.coords, submesh.coords.map((item, index)=>index)),
        type: CANNON.Body.STATIC,
        material: material.physical
        //mass:5
    });
    submesh.body.astralType = 'submesh';

    submesh.materials = ()=>{
        return biome.materials();
    };

    submesh.addTo = (scene, [offsetX, offsetY]=[0, 0])=>{
        addSubmesh(submesh, scene, [offsetX, offsetY]);
    };

    submesh.moveTo = (scene, [offsetX, offsetY]=[0, 0])=>{
        const oldPosition = submesh.mesh.position.clone();
        submesh.mesh.position.set(offsetX, offsetY, 0);
        if(submesh.markers) submesh.markers.forEach((marker)=>{
            //const local = marker.compute.local(submesh);
            //const x = local.x + offsetX;
            //const y = local.y + offsetY;
            //scene.treadmill.getHeightAt(x, y)
            marker.move(new Vector3(offsetX, offsetY, 0));
        });
        //submesh.mesh.position.set(offsetX, offsetY, 0);
    };

    submesh.removeFrom = (scene)=>{
        removeSubmesh(submesh, scene);
    };

    submesh.init = (scene)=>{ //on add to mesh
        try{
            scene.treadmill.internal.physics.world.addBody(submesh.body);
            submesh.body.position.copy(submesh.mesh.position)
            submesh.body.quaternion.copy(submesh.mesh.quaternion);
        }catch(ex){
            console.log(ex);
        }
    };

    submesh.tick = (delta, scene)=>{
        if(submesh.mesh.position && submesh.body.position){
            //submesh.mesh.position.copy(submesh.body.position);
            //submesh.mesh.quaternion.copy(submesh.body.quaternion);
            submesh.body.position.copy(submesh.mesh.position);
            submesh.body.quaternion.copy(submesh.mesh.quaternion);
        }
        let markerIndex = 0;
        const markers = submesh.markers;
        if(markers) for(; markerIndex < markers.length; markerIndex++){
            markers[markerIndex].tick(delta, this, scene)
        }
    }

    submesh.refreshGeometry = (lowerBound, upperBound)=>{
        //let faces = voxelMesh.getCoordsFromVoxels(x, y, 2, submesh.voxels);
        //submesh.coords = faces;
        submesh.mesh.geometry.attributes.position.array = Float32Array.from(submesh.coords);
        submesh.mesh.geometry.attributes.position.needsUpdate = true;
        submesh.mesh.material.needsUpdate = true;
        submesh.mesh.geometry.computeVertexNormals();

    }
    submesh.weld = (partnerSubmesh, edge, target='that')=>{
        weldSubmesh(submesh, partnerSubmesh, target, edge)
    }
    return submesh;
}*/

const weldSubmesh = (submeshA, submeshB, target, edge)=>{
    let llo = (submeshA.size-1)*submeshA.size*3*3;
    switch(edge){
        case 'bottom':
            if(target === 'this' || !target){
            }else{
                let updateIndices = [];
                let x=0;
                let len = Math.floor(submeshB.coords.length/3);
                for(;x < len; x++){
                    if(
                        submeshB.coords[x*3+1] === 0
                    ){
                        updateIndices.push(x*3)
                    }
                }
                let offset = llo*3;
                let subsearch = submeshA.coords //.slice(offset);
                let lcv=0;
                let item = {x:null, y:null, z:null}
                for(;lcv < updateIndices.length; lcv ++){

                    let updateIndex = updateIndices[lcv];
                    let result = null;
                    let index=0; 
                    for(;index < subsearch.length; index+=3){
                        item.x = subsearch[index];
                        item.y = subsearch[index+1];
                        item.z = subsearch[index+2];
                        if(
                            submeshB.coords[updateIndex] === item.x &&
                            submeshB.coords[updateIndex+1] === submeshB.size - item.y
                        ){
                            result = item;
                            submeshA.coords[index+2] = submeshB.coords[updateIndex+2];
                        }
                    }
                }
                submeshA.refreshGeometry();
            }
            break;
        case 'top':
            break;
        case 'right':
            break;
        case 'left':
            if(target === 'this' || !target){
            }else{
                let updateIndices = [];
                let x=0;
                let len = Math.floor(submeshB.coords.length/3);
                for(;x < len; x++){
                    if(
                        submeshB.coords[x*3] === 0
                    ){
                        updateIndices.push(x*3)
                    }
                }
                let offset = llo*3;
                let subsearch = submeshA.coords //.slice(offset);
                let lcv=0;
                let item = { x:null, y:null, z:null };
                for(;lcv < updateIndices.length; lcv ++){

                    let updateIndex = updateIndices[lcv];
                    let result = null;
                    let index=0; 
                    for(;index < subsearch.length; index+=3){
                        item.x = subsearch[index];
                        item.y = subsearch[index+1];
                        item.z = subsearch[index+2];
                        if(
                            submeshB.coords[updateIndex] === submeshA.size - item.x &&
                            submeshB.coords[updateIndex+1] === item.y
                        ){
                            result = item;
                            submeshA.coords[index+2] = submeshB.coords[updateIndex+2];
                        }
                    }
                }
                submeshA.refreshGeometry();
            }
            break;
    }
}

/*const addSubmesh = (submesh, scene, [offsetX, offsetY]=[0, 0])=>{
    scene.add( submesh.mesh );
    submesh.mesh.position.set(offsetX, offsetY, 0);
    submesh.init(scene);
    try{
        scene.treadmill.internal.physics.world.addBody(submesh.body);
    }catch(ex){ console.log(ex) }
    if(submesh.markers) submesh.markers.forEach((marker)=>{
        scene.add( marker.mesh );
        marker.mesh.position.set(marker.x + offsetX, marker.y + offsetY, 0);
    })
}

const moveSubmesh = (submesh, scene, [offsetX, offsetY]=[0, 0])=>{
    const currentOffsets = submesh.offsets();
    submesh.mesh.position.set(offsetX, offsetY, 0);
    if(submesh.markers) submesh.markers.forEach((marker)=>{
        const x = marker.mesh.position.x - currentOffsets.x + offsetX;
        const y = marker.mesh.position.y - currentOffsets.y + offsetY;
        //scene.treadmill.getHeightAt(x, y)
        marker.moveTo(new Vector3(x, y, 0), scene);
    });
}

const removeSubmesh = (submesh, scene)=>{
    scene.remove(submesh.mesh);
    if(submesh.markers) submesh.markers.forEach((marker)=>{
        scene.remove( marker.mesh );
    })
}*/