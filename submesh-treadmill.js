import { Vector3, Raycaster } from "three";
import { Emitter } from 'extended-emitter/browser-es6';
import { Submesh } from './src/submesh';
import { MeshObject } from './src/object';
import { Marker } from './src/marker';
import { Tile } from './src/tile-direction';

const groundRaycaster = new Raycaster( 
    new Vector3(), 
    new Vector3( 0, 1, 0 ), 
    0, 100 
);

const dir = new Vector3();

const timers = {}; //a single global debounce
const debounce_leading = (func, name='default', timeout = 300)=>{
    return (...args) => {
        if(!timers[name]) func.apply(this, args);
        clearTimeout(timers[name]);
        timers[name] = setTimeout(() => { timers[name] = undefined; }, timeout);
    };
}

export { Submesh, MeshObject, Marker };

export class Treadmill {
    constructor(options={}, scene, physicalWorld) {
        this.options = options;
        (new Emitter()).onto(this);
        this.scene = scene;
        this.physicalWorld = physicalWorld;
        //todo: base on orientation
        this.setTreadmillState([
            [ 'current', 'north' ],
            [ 'northeast', 'northwest' ],
            [ 'east', 'west' ],
            [ 'southeast', 'south', 'southwest']
        ]);
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
            this.move(direction, handler);
        }, 'treadmill', 500);
    }

    addMarker(marker, x, y){ //world coords
        const localX = x - (this.x-1); // this.x refers to current
        const localY = y - (this.y-1); // this.y refers to current
        marker.addTo(this.scene, new Vector3(localX, localY, this.getHeightAt(localX, localY)));
    }

    submesh(position){ //pointless??, filter from whitelist?
        return this[position];
    }

    submeshAt(x, y){ //treadmill coords
        let location = '';
        if(y > 16) location += 'north';
        if(y < 0) location += 'south';
        if(x > 16) location += 'west';
        if(x < 0) location += 'east';
        return this.submesh(location || 'current');
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

    activeSubmeshes(){
        return this.positions().map((position)=> this[position]);
    }

    activeSubmeshMeshes(){
        return this.activeSubmeshes().map((submesh)=> submesh?.mesh);
    }

    tick(delta){
        if(this.physicalWorld) this.physicalWorld.step(this.options.timestep || 1/60);
        const submeshes = this.activeSubmeshes()
        let submeshIndex = 0;
        for(; submeshIndex < submeshes.length; submeshIndex++){
            (submeshes[submeshIndex]&& submeshes[submeshIndex].tick(delta, this.scene));
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
        let asyncContext = null;
        workGroups.forEach((workList)=>{
            const thisContext = Promise.all(workList.map((action)=> new Promise((resolve, reject)=>{
                setTimeout(async ()=> { try{
                    if(typeof action === 'object'){
                        if(action.to){
                            this[action.to] = this[action.from];
                            this[action.from] = null;
                            if(!this[action.to].mesh.position){
                                //console.log(action.to, this[action.to])
                                throw new Error(`${action.to} has no position (does it exist in the scene?)`);
                            }
                            this[action.to].moveTo( this.scene, [
                                Tile.offset[action.to].x * this.size, 
                                Tile.offset[action.to].y * this.size
                            ]);
                        }else{ //move off
                            this[action.from].removeFrom(this.scene);
                            this[action.from] = null;
                        }
                    }else{ //strings are for loading
                        const thisX = Tile.offset[action].x;
                        const thisY = Tile.offset[action].y;
                        const submesh =  await this.createSubmesh(
                            Tile.offset[action].x, 
                            Tile.offset[action].y
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
                        console.log(action, submesh, this.scene);
                        if(this && action) this[action] = submesh;
                    }
                    resolve(); 
                }catch(ex) { reject(ex) } });
            })))
            if(!asyncContext) asyncContext = thisContext;
            else asyncContext = asyncContext.then(thisContext);
        });
        await asyncContext;
    }

    async moveDirection(direction){
        const dir = Tile.offsets[direction];
        const queue = [];
        if(dir.y){
            Tile.groups.forEach((row, y)=>{
                row.forEach((value, x)=>{
                    queue.push({
                        from : Tile.groups[y][x],
                        to : Tile.groups[y+dir.y]?Tile.groups[y+dir.y][x]:null
                    }); 
                });
            })
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
            })
        }
        const movingOff = queue.filter((item)=>item.to === null);
        const movingOffNames = movingOff.map((item)=> item.from);
        const movingUp1 = queue.filter((item)=>movingOffNames.indexOf(item.to) !== -1);
        const movingUp1Names = movingUp1.map((item)=> item.from);
        const movingUp2 = queue.filter((item)=>movingUp1Names.indexOf(item.to) !== -1);
        const unloadedNames = movingUp2.map((item)=> item.from);
        this.y = this.y + dir.y;
        await this.setTreadmillState([movingOff, movingUp1, movingUp2, unloadedNames]);
    }
    // Getter
    async move(direction, handler){
        await this.moveDirection(direction);
        if(handler) handler(direction, Tile.offsets[direction]);
    }
}