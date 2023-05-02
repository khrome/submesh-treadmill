import { Raycaster, Vector3, Vector2, ArrowHelper, Quaternion } from "three";
// import { ShadowMesh } from 'three/addons/objects/ShadowMesh.js';
//import { Emitter } from 'extended-emitter-es6';
//const Emitter = exem.Emitter;
import { DevelopmentTools, Logger } from './development.js'

const bbox = (ob)=>{
    if(ob.geometry && ob.geometry.boundingBox) return ob.boundingBox;
    let thisOb = ob;
    while(thisOb && thisOb.children && !thisOb.geometry){
        thisOb = thisOb.children[0];
    }
    if(thisOb && thisOb.geometry && thisOb.geometry.boundingBox) return thisOb.geometry.boundingBox;
    throw new Error('No extractable boundingBox');
}

const twoPI = Math.PI * 2;

const direction = {
    right: new Vector3(0, 1, 0),
    left: new Vector3(0, -1, 0),
    forward: new Vector3(1, 0, 0), //TBD: ??
    backward: new Vector3(-1, 0, 0)
};

const firstNodeWithGeometryInTree = (node)=>{
    let currentNode = node;
    while(currentNode && !currentNode.geometry){
        currentNode = currentNode.children[0];
    }
    return currentNode;
};

const dispCoord = (value)=>{
   return Math.floor(value * 100) / 100;
};

const dispCoords = (vector)=>{
   return [dispCoord(vector.x), dispCoord(vector.y)];
};

let raycaster = new Raycaster();
let result = new Vector3();

export class Marker {
    static CLOCKWISE = -1;
    static WIDDERSHINS = 1;
    constructor(object, options={}) {
        this.object = object;
        this.mesh = this.object.buildObject(options.random);
        try{
            this.boundingBox = bbox(this.mesh);
        }catch(ex){}
        if(this.object.buildCollisionObject){
            this.body = this.object.buildCollisionObject(this.mesh, this);
        }
        this.options = options;
        if(this.options.shadow && this.options.shadow === 'mesh'){
            // this.shadowMesh = new ShadowMesh(this.mesh);
        }
        if(this.options.shadow && this.options.shadow === 'light'){
            this.mesh.castShadow = true;
        }
        this.random = options.random || Math.random;
        this.active = true; //todo: only if npc
        this.original = this.object.defaultValues();
        this.values = JSON.parse(JSON.stringify(this.original));
        this.doing = [];
        this.allInfo = ()=>{
            return Object.assign({}, this.object.options, this.options, this.values);
        }
        // (new Emitter()).onto(this);
        this.linked = [];
        //this.naturalX = this.random() * 16;
        //this.naturalY = this.random() * 16;
        /* this.compute = {
            world : (submesh)=>{
                const local = this.compute.local(submesh);
                const x = this.submesh.submeshX*submesh.size + local.x;
                const y = this.submesh.submeshY*submesh.size + local.y;
                return new Vector3(x, y, 0);
            },
            treadmill : ()=>{
                return new Vector3(this.mesh.position.x, this.mesh.position.y, 0);
            },
            local : (submesh)=>{
                const size = (this.submesh || submesh).size;
                const localX = this.mesh.position.x % size;
                const localY = this.mesh.position.y % size;
                return new Vector3(
                    Math.abs(localX),
                    Math.abs(localY),
                    0
                );
            }
        } */
    }

    //static emitter = new Emitter(); //common channel for all markers

    /*move(relativePoint, scene){
        this.moveTo(new Vector3(
            this.mesh.position.x+relativePoint.x, 
            this.mesh.position.y+relativePoint.y,
            this.mesh.position.z+relativePoint.z
        ), scene);
    }*/
    
    currentOriginalRatio(name){
        if(this.values[name] && this.original[name]){
            return this.values[name] / this.original[name];
        }
    }
    
    alterDurability(types, direction=1){
        //todo: factor in resistances
        const adjustment = Object.keys(types).reduce((agg, key)=> agg + types[key] * direction, 0);
        this.values.durability -= adjustment;
    }
    
    moveInOrientation(directionVector, delta=1, target, treadmill){
        let origin = null;
        if(this.boundingBox){
            origin = this.boundingBox.getCenter()
        }else{
            origin = this.mesh.position;
            //origin = new Vector3();
            //this.mesh.getWorldPosition(origin);
        }
        const movementSpeed = this.values.movementSpeed || 1;
        const maxDistance = movementSpeed * delta;
        const quaternion = new Quaternion();
        directionVector.applyQuaternion(this.mesh.quaternion);
        raycaster.ray.origin.copy(origin);
        raycaster.ray.direction.copy(directionVector);
        let localTarget = target; //&& treadmill.treadmillPointFor(target);
        //Logger.log('mio-target', Logger.DEBUG, 'marker', localTarget);
        //Logger.log('mio-ray', Logger.DEBUG, 'marker', raycaster);
        if(window.tools){
            Logger.log('mio-target', Logger.DEBUG, 'marker', localTarget);
            Logger.log('mio-ray', Logger.DEBUG, 'marker', raycaster);
            //if(localTarget) window.tools.showPoint(localTarget, 'target', '#0000FF');
            //if(target) window.tools.showPoint(target, 'target', '#000099');
            //window.tools.showRay(raycaster, 'bearing-ray', '#000055');
        }
        const markers = treadmill.activeMarkers();
        let lcv=0;
        for(;lcv < markers.length; lcv++){
            const threshold = markers[lcv].values.collisionRadius + this.values.collisionRadius;
            if(markers[lcv] === this) continue;
            if(this.mesh.position.distanceTo(markers[lcv].mesh.position) <= threshold){
                this.impact(markers[lcv], treadmill);
            }
        }
        if(
            target &&
             origin && 
             localTarget && 
             origin.distanceTo(localTarget) < maxDistance
         ){
            //todo: compute remaining time
            this.mesh.position.copy(localTarget);
            return 0;
        }else{
            raycaster.ray.at(maxDistance, result);
            this.moveTo(new Vector2(result.x, result.y));
            return -1;
        }
    }
    
    // all movement functions either proceed to the target or their movement max, whichever comes first
    // and return the remaining delta when complete.
    
    forward(delta=1, target, options, treadmill){ // +x
        return this.moveInOrientation(direction.forward.clone(), delta, target, treadmill);
    }
    
    backward(delta=1, target, options, treadmill){ // -y
        return this.moveInOrientation(direction.backward.clone(), delta, target, treadmill);
    }
    
    strafeRight(delta=1, target, options, treadmill){ // +x
        return this.moveInOrientation(direction.right.clone(), delta, target, treadmill);
    }
    
    strafeLeft(delta=1, target, options, treadmill){ // -x
        return this.moveInOrientation(direction.left.clone(), delta, target, treadmill);
    }
    
    turn(delta=1, direction, target, options, treadmill){
        const turnSpeed = this.values.turnSpeed || 0.1;
        const maxRotation = turnSpeed * delta;
        if(target){
            const localTarget = target; //treadmill.treadmillPointFor(target);
            const raycaster = this.lookAt(localTarget);
            const xDist = localTarget.x - this.mesh.position.x;
            const yDist = localTarget.y - this.mesh.position.y;
            let targetAngle = Math.atan2(yDist, xDist);
            if (targetAngle < 0) { targetAngle += twoPI; }
            if (targetAngle > twoPI) { targetAngle -= twoPI; }
            const delta = this.mesh.rotation.z - targetAngle;
            const motion = direction * maxRotation;
            if(false && window.tools) {
               Logger.log('turn-target', Logger.DEBUG, 'marker', localTarget);
               Logger.log('turn-ray', Logger.DEBUG, 'marker', raycaster);
               //window.tools.showRay(raycaster, 'turn-target-ray', '#0000FF');
               //window.tools.showPoint(localTarget, 'turn-target', '#0000FF');
            }
            if(delta > maxRotation){
                const newValue = this.mesh.rotation.z + motion;
                if(newValue < 0){
                    this.mesh.rotation.z = (this.mesh.rotation.z + motion) + twoPI;
                }else{
                    this.mesh.rotation.z = (this.mesh.rotation.z + motion) % twoPI;
                }
                return -1;
            }else{
                this.mesh.rotation.z = targetAngle;
                //TBD compute remaining time
                return 0;
            }
            return 0;
        }else{
            this.mesh.rotation.z += direction * maxRotation;
            return 0;
        }
    }
    
    turnRight(delta=1, target, options, treadmill){
        return this.turn(delta=1, Marker.CLOCKWISE, target, options, treadmill);
    }
    
    turnLeft(delta=1, target, options, treadmill){
        return this.turn(delta=1, Marker.WIDDERSHINS, target, options, treadmill);
    }

    moveTo(point){
        const from = this.mesh.position.clone()
        this.mesh.position.set(point.x, point.y);
        if(this.body){
            this.body.position.set(point.x, point.y);
        }
        if(this.linked.length){
            const delta = {
                x: point.x - from.x,
                y: point.y - from.y
            }
            this.linked.forEach((marker)=>{
               if(marker.moveTo){ //a marker
                   marker.moveTo(new Vector3(
                       marker.mesh.position.x + delta.x,
                       marker.mesh.position.y + delta.y,
                       marker.mesh.position.z
                   ));
               }else{ //a positionable object
                    marker.position.set(
                        marker.position.x + delta.x,
                        marker.position.y + delta.y
                    )
               }
            });
        }
        //if(this.animation) this.convertAnimation(point.x, point.y);
    }

    lookAt(point){
        try{
            var dir = new Vector3();
            const direction = dir.subVectors( point, this.mesh.position ).normalize();
            var raycaster = new Raycaster( this.mesh.position, direction );
            return raycaster;
        }catch(ex){
            console.log(ex);
        }
    }

    coordinates(){
        return {
            local: this.compute.local(),
            world: this.compute.world(),
            treadmill: this.compute.treadmill()
        }
    }

    /*
        marker rotation on mesh
                    helper.position.set( 0, 0, 0 );
					helper.lookAt( intersects[ 0 ].face.normal );

					helper.position.copy( intersects[ 0 ].point );
    */

    addTo(scene, position, target, options={}){
        scene.add(this.mesh);
        if(this.shadowMesh){
            console.log('added shadowmesh')
            scene.add(this.shadowMesh);
        }
        this.remove = ()=>{
            scene.remove(this.mesh);
            //todo: remove from submesh.markers, too
            if(this.body) scene.treadmill.internal.physics.world.removeBody(this.body);
        }
        if(position){
            this.moveTo(position, scene);
            //this.submesh = scene.treadmill.submeshAt(position.x, position.y);
        }
        let raycaster = null;
        if(target) raycaster = this.lookAt(target);
        if(this.body){
            scene.treadmill.internal.physics.world.addBody(this.body);
            if(target && options.velocity && raycaster){
                //todo if debug, draw ray
                this.body.velocity.set(
                    raycaster.ray.direction.x * options.velocity,
                    raycaster.ray.direction.y * options.velocity,
                    raycaster.ray.direction.z * options.velocity
                );
            }
        }
    }

    animateTo(point, scene, millis=2000){
        let coords = JSON.parse(JSON.stringify(this.mesh.position));
        this.animation = new TWEEN.Tween(coords)
            .to(point, millis)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() =>{
                this.moveTo(coords, scene);
            })
        this.animation.timestamp = Date.now();
        this.animation.millis = millis;
        this.animation.targX = point.x;
        this.animation.targY = point.y;
        this.animation.start();
    }

    cancelAnimation(){
        if(this.animation) this.animation.stop();
    }
    
    spawn(object, target){
        const spawned = new Marker(object);
        const raycaster = this.lookAt(target);
        const outside = spawned.values.collisionRadius + this.values.collisionRadius;
        const spawnpoint = raycaster.ray.at(outside, target);
        spawnpoint.z += 0.5;
        spawned.mesh.position.copy(spawnpoint);
        return spawned;
    }
    
    destroy(){
        this.destroyed = true; //remove from any treadmills
    }
    
    impact(marker, treadmill){
        if(this.destroyed || marker.destroyed) return;
        this.doing = [];
        if(this.object.impact) this.object.impact(marker, this, treadmill);
    }

    convertAnimation(xOffset, yOffset){
        if(this.animation) this.animation.stop();
        const remainingMillis = this.animation.millis - (Date.now() - this.animation.timestamp);
        let coords = JSON.parse(JSON.stringify(this.mesh.position));
        this.animation = new TWEEN.Tween(coords)
            .to({x:this.animation.targX+xOffset, y:this.animation.targY+yOffset}, remainingMillis)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() =>{
                this.mesh.position.set(coords.x, coords.y)
            })
        this.animation.start();

    }
    
    action(name, targ, options={}, treadmill){
        let action = name;
        if(typeof name === 'number'){
            const actions = this.object.actions?.priority || []
            //todo: convert index to action
            action = actions[name];
        }
        let target = targ.clone();
        /*if(target instanceof Vector3){
            const oldV = target;
            target = treadmill.worldPointFor(target)
            console.log('WorldVector', target, oldV, [treadmill.x, treadmill.y])
        }*/
        const origin = treadmill.worldPointFor(this.mesh.position.clone());
        const definition = { action, options, target, origin };
        if(options.interrupt){
            this.doing.unshift(definition);
        }else{
            this.doing.push(definition);
        }
    }
    
    actionTick(delta, treadmill){
        if(!this.doing.length) return;
        const action = this.doing[0];
        if(this.mesh.selectedOutline) this.mesh.selectedOutline.position.copy(this.mesh.position);
        if(this.mesh.highlightedOutline) this.mesh.highlightedOutline.position.copy(this.mesh.position);
        if(!this.object.actions[action.action]) throw new Error(`Unsupported Action: ${action.action}`);
        const localTarget = treadmill.treadmillPointFor(action.target);
        const worldPosition = treadmill.worldPointFor(this.mesh.position);
        const localOrigin = treadmill.treadmillPointFor(action.origin);
        if(window.tools){
            Logger.log('tick-target', Logger.WARN, 'marker', localTarget);
            Logger.log('tick-origin', Logger.WARN, 'marker', localOrigin);
        }
        if(this.values.range){
            //const localOrigin = treadmill.treadmillPointFor(action.origin);
            const raycaster = new Raycaster(localOrigin, localTarget);
            //if(window.tools){
            //    Logger.log('range-ray', Logger.DEBUG, 'marker', raycaster);
            //    Logger.log('range-max', Logger.DEBUG, 'marker', raycaster.ray.at(this.values.range, localTarget));
            //}
            console.log(raycaster.ray.distanceToPoint(this.mesh.position), this.values.range);
            //if(raycaster.ray.distanceToPoint(this.mesh.position) > this.values.range){
                //this.destroy();
            //}
            
        }
        const remainder = this.object.actions[action.action](delta, this, localTarget, action.options, treadmill);
        if(remainder !== -1) this.doing.shift();
    }

    tick(delta, treadmill, scene){
        if(this.doing.length)
        if(this.object.tick) this.object.tick(delta);
        if(this.mesh.position && this.body && this.body.position){
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);
        }
        if(this.options.clampTo){
            this.mesh.position.set(
                this.mesh.position.x, 
                this.mesh.position.y,
                (this.options.clampTo.getHeightAt(this.mesh.position.x, this.mesh.position.y)||0)
            );
            //todo link action to the object
        }
    }
    
    static enableSelection({ 
        container, 
        camera, 
        renderer, 
        treadmill, 
        onSelect,
        onDeselect,
        onMouseOver,
        onMouseAway,
        markerTypes=[] 
    }){
        let selected = [];
        const metalist = ['Shift', 'Control', 'Alt', 'Meta'];
        const meta = {};
        let selectionModel = {
            add : (marker)=>{
                if(selected.indexOf(marker) === -1){
                    selected.push(marker);
                    if(onSelect) onSelect(marker);
                }
            },
            remove : (marker)=>{
                let index = null;
                if((index = selected.indexOf(marker)) !== -1){
                    selected.splice(index, 1);
                    if(onDeselect) onDeselect(marker);
                }
            },
            clear : ()=>{
                while(selected.length) selectionModel.remove(selected[selected.length-1]);
            },
            all : (action)=>{
                //todo: support object actions, which are actual marker actions
                selected.forEach(action);
            },
            contains : (marker)=>{
                selected.indexOf(marker) !== -1;
            },
            items : ()=>{
                return selected;
            }
        };
        container.addEventListener('keydown', (event)=>{
            const metaIndex = metalist.indexOf(event.code.replace('Left', '').replace('Right', ''));
            if(metaIndex !== -1){
                meta[metalist[metaIndex].toLowerCase()] = true;
            }
        });
        container.addEventListener('keyup', (event)=>{
            const metaIndex = metalist.indexOf(event.code.replace('Left', '').replace('Right', ''));
            if(metaIndex !== -1){
                meta[metalist[metaIndex].toLowerCase()] = false;
            }
        });
        let mousedMarker = null;
        container.addEventListener('mousemove', ()=>{
            var raycaster = new Raycaster(); // create once
            var mouse = new Vector2(); // create once
            mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
            raycaster.setFromCamera( mouse, camera );
            var intersects = null;
            try{ //can't do this mid-load
                //todo: optionally support markers, filtered by type
                intersects = raycaster.intersectObjects( 
                    treadmill.activeMarkers().map((marker)=>marker.mesh), 
                    true 
                );
            }catch(ex){console.log(ex) }
            /*if(lastOutline){
                treadmill.scene.remove(lastOutline);
            }*/
            if(intersects && intersects[0]){
                const submeshes = treadmill.activeSubmeshes();
                const markers = treadmill.activeMarkers(null, submeshes);
                const foundMarker = markers.find((marker)=>{
                    return marker.mesh === intersects[0].object
                    || firstNodeWithGeometryInTree(marker.mesh) === intersects[0].object
                });
                if(foundMarker){
                    if(foundMarker !== mousedMarker){
                        if(mousedMarker) onMouseAway(mousedMarker);
                        mousedMarker = foundMarker;
                        if(onMouseOver) onMouseOver(foundMarker);
                    }
                    //foundMarker.object.selectedOutline.position.copy(foundMarker.mesh.position);
                    //treadmill.scene.add(foundMarker.object.selectedOutline);
                    //lastOutline = foundMarker.object.selectedOutline;
                }else{
                    if(mousedMarker){
                        if(onMouseAway) onMouseAway(mousedMarker)
                        mousedMarker = null;
                    }
                }
            }else{
                if(mousedMarker){
                    if(onMouseAway) onMouseAway(mousedMarker)
                    mousedMarker = null;
                }
            }
        });
        const clickHandler = (event)=>{
            var raycaster = new Raycaster(); // create once
            var mouse = new Vector2(); // create once
        
            mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
            //console.log(meta, event);
            
            raycaster.setFromCamera( mouse, camera );
            const submeshes = treadmill.activeSubmeshes();
            const markers = treadmill.activeMarkers(markerTypes, submeshes);
            var intersects = null;
            try{ //can't do this mid-load
                //todo: optionally support markers, filtered by type
                intersects = raycaster.intersectObjects( 
                    submeshes.map((submesh)=> submesh.mesh ).concat(markers.map((marker)=> marker.mesh )), 
                    true 
                );
            }catch(ex){}
            if(intersects && intersects[0]){
                const foundSubmesh = submeshes.find((submesh)=>{ return submesh.mesh == intersects[0].object});
                const foundMarker = markers.find((marker)=>{ return firstNodeWithGeometryInTree(marker.mesh) == intersects[0].object});
                if(event.type === 'contextmenu'){
                    if(foundSubmesh){ // target a spot on the ground
                        const point = intersects[0].point;
                        const worldPoint = treadmill.worldPointFor(point);
                        selectionModel.all((marker)=>{
                            const markerPoint = marker.mesh.position;
                            const markerWorldPoint = treadmill.worldPointFor(marker.mesh.position);
                            if(window.tools){
                                window.tools.showPoint(point, 'local-action', '#FF0000');
                                window.tools.showPoint(worldPoint, 'world-action', '#990000');
                            }
                            if(!meta.shift){
                                marker.doing = [];
                            }
                            marker.action(1, worldPoint, {}, treadmill);
                        });
                    }
                    if(foundMarker){ //target another marker
                        console.log('attack marker');
                    }
                }else{
                    if(foundSubmesh){
                        const point = intersects[0].point;
                        const worldPoint = treadmill.worldPointFor(point);
                        selectionModel.all((marker)=>{
                            const markerPoint = marker.mesh.position;
                            const markerWorldPoint = treadmill.worldPointFor(marker.mesh.position);
                            if(window.tools){
                                window.tools.showPoint(point, 'local', '#FF0000');
                                window.tools.showPoint(worldPoint, 'world', '#990000');
                            }
                            if(!meta.shift){
                                marker.doing = [];
                            }
                            marker.action('moveTo', worldPoint, {}, treadmill);
                        });
                    }
                    if(foundMarker){
                        if(!meta.shift) selectionModel.clear();
                        selectionModel.add(foundMarker)
                        //selected = [foundMarker];
                    }
                }
            }
        };
        container.addEventListener('click', clickHandler);
        container.addEventListener('contextmenu', clickHandler);
        return selectionModel;
    }
};
