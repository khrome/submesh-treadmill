import { Vector2, Vector3, Raycaster } from "three";
//import { Emitter } from 'extended-emitter-es6';
import { Submesh } from './src/submesh.js';
import { MeshObject } from './src/object.js';
import { Marker } from './src/marker.js';
import { Projectile } from './src/projectile.js';
import { Tile } from './src/tile-direction.js';

const groundRaycaster = new Raycaster( 
    new Vector3(), 
    new Vector3( 0, 1, 0 ), 
    0, 100 
);

const isMarkerOfTypeGenerator = (markerTypes)=>{
    return (instance)=>{
        return markerTypes.reduce((isA, thisType)=>{
            return isA || instance.object instanceof thisType;
        }, false)
    };
};

const dir = new Vector3();

const timers = {}; //a single global debounce
const debounce_leading = (func, name='default', timeout = 300)=>{
    return (...args) => {
        if(!timers[name]){
            func.apply(this, args);
        }
        clearTimeout(timers[name]);
        timers[name] = setTimeout(() => { timers[name] = undefined; }, timeout);
    };
}

export { Submesh, MeshObject, Marker, Tile, Projectile };

export class Treadmill {
    static handleResize(container, camera, renderer){
        const setSize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
        };
        setSize();
        window.addEventListener('resize', () => {
            setSize();
            renderer.render(this.scene, camera);
        });
    }
    constructor(options={}, scene, physicalWorld) {
        this.options = options;
        //(new Emitter()).onto(this);
        this.scene = scene;
        this.physicalWorld = physicalWorld;
        //todo: base on orientation
        this.setTreadmillState([
            [ 'current', 'north' ],
            [ 'northeast', 'northwest' ],
            [ 'east', 'west' ],
            [ 'southeast', 'south', 'southwest']
        ]);
        this.x = options.x || 0;
        this.y = options.y || 0;
    }

    async createSubmesh(x, y){
        const options = {
            onLoad:(submesh)=>{
            },
            onMarkerExit:(marker, x, y)=>{
                const submesh = this.submeshAt(x, y);
                if(submesh){
                    submesh.addMarker(marker, x, y);
                }
            }
        };
        const submesh = await this.options.createSubmesh(x, y);
        return submesh;
    }

    blocked(handler){
        return debounce_leading((direction)=>{
            this.moveDirection(direction, handler);
        }, 'treadmill', 500);
    }

    addMarker(marker, x, y, z){ //world coords
        const local = this.treadmillPointFor(new Vector3(x, y, z)); //y refers to current
        const submesh = this.submeshAt(local.x, local.y);
        if(submesh){
            marker.addTo(this.scene, new Vector3(local.x, local.y, z || this.getHeightAt(local.x, local.y)));
            submesh.markers.push(marker);
        }else{
            console.log('this marker is off the stage', marker, x, y, z);
        }
    }
    
    addMarkerToStage(marker, x, y, z){ //treadmill coords coords: -16 - 32
        const submesh = this.submeshAt(x, y);
        if(submesh){
            marker.addTo(this.scene, new Vector3(x, y, z || this.getHeightAt(x, y)));
            submesh.markers.push(marker);
        }
    }

    submesh(position){ //pointless??, filter from whitelist?
        return this[position];
    }
    
    submeshCellAt(x, y){
        let location = '';
        if(y > 16) location += 'north';
        if(y < 0) location += 'south';
        if(x > 16) location += 'east';
        if(x < 0) location += 'west';
        return location || 'current';
    }

    submeshAt(x, y){ //treadmill coords
        return this.submesh(this.submeshCellAt(x, y));
    }

    positionOfMesh(mesh){
        let index = -1;
        this.activeSubmeshes().forEach((submesh, pos)=>{
            if(submesh.mesh === mesh) index = pos;
        });
        if(index === -1) return -1;
        return this.positions()[index];
    }
    
    offsets(submesh){
        const dir = Tile.offset[this.positionOf(submesh)];
        return {
            treadmill : new Vector3(dir.x*submesh.size, dir.y*submesh.size, 0), 
            world : new Vector3(submesh.submeshX*submesh.size, submesh.submeshY*submesh.size, 0)
        };
    }

    positions(){
        return Tile.list;
    }
    
    center(){
        const center = this.current.center();
        // on 'current' treadmill & local coords are the same!
        return center;
    }
    
    worldPointFor(treadmillPoint){
        const copy = treadmillPoint.clone();
        copy.x += this.x * Submesh.tileSize;
        copy.y += this.y * Submesh.tileSize;
        return copy;
    }
    
    treadmillPointFor(worldPoint){
        const copy = worldPoint.clone();
        copy.x = copy.x - this.x * Submesh.tileSize;
        copy.y = copy.y - this.y * Submesh.tileSize;
        return copy;
    }

    activeSubmeshes(){
        return Tile.list.map((position)=> this[position]);
    }

    activeSubmeshMeshes(){
        return this.activeSubmeshes().map((submesh)=> submesh?.mesh);
    }
    
    activeMarkers(types, submeshes = this.activeSubmeshes()){
        const allMarkers = submeshes.reduce((agg, item)=>{
            return agg.concat(item.markers);
        }, []);
        if(types){
            const isSelectableMarker = isMarkerOfTypeGenerator(types);
            return allMarkers.filter(isSelectableMarker);
        }
        return allMarkers;
    }
    
    activeSubmeshMeshesAndMarkers(markerClasses, submeshes = this.activeSubmeshes() ){
        return submeshes.map((submesh)=> submesh?.mesh).concat(this.activeMarkers(markerClasses));
    }

    tick(delta){
        if(this.physicalWorld) this.physicalWorld.step(this.options.timestep || 1/60);
        const submeshes = this.activeSubmeshes()
        let submeshIndex = 0;
        for(; submeshIndex < submeshes.length; submeshIndex++){
            (submeshes[submeshIndex]&& submeshes[submeshIndex].tick(delta, null, this));
        }
    }

    getHeightAt (x, y, sub){
        const submesh = sub || this.submeshAt(x, y);
        const target = new Vector3(x, y, 30);
        if(submesh){
            groundRaycaster.set(
                new Vector3(x, y, 30), 
                dir.subVectors(new Vector3(x, y, 0), target).normalize()
            );
            if(submesh.mesh){
                const intersections = groundRaycaster.intersectObjects( [submesh.mesh], false );
                if(intersections[0] && intersections[0].point){
                    return intersections[0].point.z;
                }
            }
        }
        return 0;
    }

    async setTreadmillState(workGroups){
        let asyncContexts = [];
        workGroups.forEach((workList)=>{
            const thisContext = Promise.all(workList.map((action)=> new Promise((resolve, reject)=>{
                setTimeout(async ()=> { 
                    try{
                        if(typeof action === 'object'){
                            if(action.to){
                                if(!this[action.from].mesh.position){
                                    throw new Error(`${action.to} has no position (does it exist in the scene?)`);
                                }
                                this[action.from].moveTo( this.scene, new Vector3(
                                    Tile.offset[action.to].x * Submesh.tileSize, 
                                    Tile.offset[action.to].y * Submesh.tileSize,
                                    0
                                ));
                                this[action.to] = this[action.from];
                                this[action.from] = null;
                            }else{ //move off
                                this[action.from].removeFrom(this.scene);
                                this[action.from] = null;
                            }
                        }else{ //strings are for loading
                            const thisX = Tile.offset[action].x;
                            const thisY = Tile.offset[action].y;
                            const submesh =  await this.createSubmesh(
                                Tile.offset[action].x+this.x, 
                                Tile.offset[action].y+this.y
                            );
                            submesh.addTo(new Vector3(
                                thisX * submesh.size, 
                                thisY * submesh.size, 
                                this.getHeightAt(
                                    thisX * submesh.size, 
                                    thisY * submesh.size, 
                                    submesh
                                )
                            ), this.scene);
                            if(this && action) this[action] = submesh;
                        }
                        resolve();
                    }catch(ex) { console.log(ex) } 
                });
            })));
            asyncContexts.push(thisContext);
        });
        const thisLoad = Promise.all(asyncContexts);
        this.loading = thisLoad;
        return thisLoad;
    }

    async moveDirection(direction){
        const dir = Tile.offset[direction];
        const queue = [];
        if(dir.y){
            Tile.groups.forEach((row, y)=>{
                row.forEach((value, x)=>{
                    queue.push({
                        from : Tile.groups[y][x],
                        to : Tile.groups[y+dir.y]?Tile.groups[y+dir.y][x]:null
                    }); 
                });
            });
            this.y = this.y + dir.y;
        }else{
            if(!dir.x) throw new Error('No action for passed move');
            Tile.groups.forEach((row, y)=>{
                row.forEach((value, x)=>{
                    queue.push({
                        from : Tile.groups[y][x],
                        to : (
                            Tile.groups[y] &&
                            Tile.groups[y][x+dir.x]
                        )?Tile.groups[y][x+dir.x]:null
                    }); 
                });
            });
            this.x = this.x - dir.x;
        }
        const movingOff = queue.filter((item)=>item.to === null);
        const movingOffNames = movingOff.map((item)=> item.from);
        const movingUp1 = queue.filter((item)=>movingOffNames.indexOf(item.to) !== -1);
        const movingUp1Names = movingUp1.map((item)=> item.from);
        const movingUp2 = queue.filter((item)=>movingUp1Names.indexOf(item.to) !== -1);
        const unloadedNames = movingUp2.map((item)=> item.from);
        await this.setTreadmillState([movingOff, movingUp1, movingUp2, unloadedNames]);
    }
    // Getter
    async move(direction, handler){
        await this.moveDirection(direction);
        if(handler) handler(direction, Tile.offset[direction]);
    }
}