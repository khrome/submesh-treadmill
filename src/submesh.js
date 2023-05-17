import { MeshPhongMaterial, DoubleSide, Vector3, Raycaster, Vector2, Mesh } from "three";
// import { Random } from "./random";

const genericWarning = 'Submesh is a generic class and cannot be instantiated directly';

const groundRaycaster = new Raycaster( 
    new Vector3(), 
    new Vector3( 0, 1, 0 ), 
    0, 100 
);

const dir = new Vector3();

export class Submesh{
    
    static tileSize = 16;
    
    constructor(geometry, tilePosition, options={}){
        //todo: scan geometry for size
        this.x = tilePosition.x;
        this.y = tilePosition.y;
        this.options = options;
        this.size = Submesh.tileSize;
        this.mesh = this.createMesh(geometry, tilePosition);
        this.body = this.createPhysicalMesh(this.mesh);
        if(this.body){
            this.body.markerType = 'submesh';
        }
        this.markers = this.createMarkers() || [];
    }

    createMesh(geometry){
        const material = new MeshPhongMaterial({
            color: "#00FF00",    // red (can also use a CSS color string here)
            flatShading: false
        });
        const mesh = new Mesh( geometry, material );
        mesh.receiveShadow = true;
        return mesh;
    }
    
    center(){
        const center = new Vector2(this.size/2, this.size/2);
        return center;
    }

    createPhysicalMesh(geometry){
        return null;
    }

    createMarkers(){
        throw new Error(genericWarning)
    }
    
    moveTo(scene, point){
        const from = this.mesh.position.clone();
        const delta = {
            x: point.x - from.x,
            y: point.y - from.y
        }
        this.mesh.position.copy(point);
        const newPoint = new Vector3();
        let x = null;
        let y = null;
        //console.log(delta, this.markers.length, [this.x, this.y]);
        this.markers.forEach((marker)=>{
            x = marker.mesh.position.x + delta.x;
            y = marker.mesh.position.y + delta.y;
            newPoint.set(x, y, this.getHeightAt(x, y) );
            marker.moveTo(newPoint);
            if(marker.mesh.highlightedOutline) marker.mesh.highlightedOutline.position.copy(marker.mesh.position)
            if(marker.mesh.selectedOutline) marker.mesh.selectedOutline.position.copy(marker.mesh.position)
        });
    }

    refreshGeometry(){
        this.mesh.geometry.attributes.position.array = Float32Array.from(submesh.coords);
        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.mesh.material.needsUpdate = true;
        this.mesh.geometry.computeVertexNormals();
    }

    addTo(offset, scene, physicalWorld){
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
            if(marker.shadowMesh){
                console.log('shadow');
                scene.add( marker.shadowMesh );
            }
            marker.mesh.position.set(
                marker.x + offset.x, 
                marker.y + offset.y, 
                this.getHeightAt(marker.x + offset.x, marker.y + offset.y)
            );
            marker.mesh.position.set(
                this.mesh.position.x + (marker.naturalX || 0),
                this.mesh.position.y + (marker.naturalY || 0)
            );
            if(marker.body){
                marker.body.position.x = point.x;
                marker.body.position.y = point.y;
            }
            let raycaster = null;
            if(this.target) raycaster = this.lookAt(this.target);
            if(marker.body && physicalWorld){
                physicalWorld.addBody(marker.body);
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
    
    getHeightAt(x, y){
        const target = new Vector3(x, y, 30);
        groundRaycaster.set(
            new Vector3(x, y, 30), 
            dir.subVectors(new Vector3(x, y, 0), target).normalize()
        );
        if(this.mesh){
            const intersections = groundRaycaster.intersectObjects( [this.mesh], false );
            if(intersections[0] && intersections[0].point){
                return intersections[0].point.z;
            }
        }
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

    tick(delta, scene, treadmill){
        if(this.mesh.position && this.body && this.body.position){
            if(this.physics){
                //physics mode, copy position from body
                this.mesh.position.copy(this.body.position);
                this.mesh.quaternion.copy(this.body.quaternion);
            }else{
                //marker mode, copy position to body
                this.body.position.copy(this.mesh.position);
                this.body.quaternion.copy(this.mesh.quaternion);
            }
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
            if(marker.destroyed){
                const index = this.markers.indexOf(marker);
                if(index !== -1){
                    this.markers.splice(index, 1);
                    treadmill.scene.remove(marker.mesh);
                }else{
                    console.log('tried to remove a marker that doesn\'t exist in this submesh');
                }
                
                //todo: notify, for parallel removal
            }
            if(marker.doing.length) marker.actionTick(delta, treadmill);
            x = marker.mesh.position.x;
            y = marker.mesh.position.y;
            let action = '';
            if((y - yOffset) < 0) action += 'south';
            if((y - yOffset) > this.size) action += 'north';
            if((x - xOffset) < 0) action += 'east';
            if((x - xOffset) > this.size) action += 'west';
            if(action){
                let index = this.markers.indexOf(marker);
                if(index !== -1){
                    this.markers.splice(index, 1);
                    if(this.options.onMarkerExit) this.options.onMarkerExit(marker, this, action);
                };
            }
        }
    }

    weld(partnerSubmesh, edge, target='that'){
        weldSubmesh(submesh, partnerSubmesh, target, edge)
    }
    
}

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