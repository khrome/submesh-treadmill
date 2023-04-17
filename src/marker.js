import { Raycaster, Vector3, ArrowHelper } from "three";
import { Emitter } from 'extended-emitter/browser-es6';

export class Marker {
    constructor(object, options={}) {
        this.object = object;
        this.mesh = this.object.buildObject(options.random);
        if(this.object.buildCollisionObject){
            this.body = this.object.buildCollisionObject(this.mesh, this);
        }
        this.options = options;
        this.active = true; //todo: only if npc
        this.values = {};
        this.allInfo = ()=>{
            return Object.assign({}, this.object.options, this.options, this.values);
        }
        (new Emitter()).onto(this);
        this.compute = {
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
        }
    }

    static emitter = new Emitter(); //common channel for all markers

    move(relativePoint, scene){
        this.moveTo(new Vector3(
            this.mesh.position.x+relativePoint.x, 
            this.mesh.position.y+relativePoint.y,
            this.mesh.position.z+relativePoint.z
        ), scene);
    }

    moveTo(point, scene){
        const from = this.mesh.position.clone()
        this.mesh.position.x = point.x;
        this.mesh.position.y = point.y;
        if(this.body){
            this.body.position.x = point.x;
            this.body.position.y = point.y;
        }
        if(scene) try{
            let submesh = scene.treadmill.submeshAt(point.x, point.y);
            if(submesh && submesh !== this.submesh){
                if(this.submesh) console.log('exiting')
                // remove from exiting submesh
                if(this.submesh) this.submesh.markers.splice(this.submesh.markers.indexOf(this), 1);
                // add to entering submesh
                submesh.markers.push(this);
                /*const info = this.allInfo();
                info.origin = this.submesh;
                info.destination = submesh;
                info.to = this.mesh.position;
                info.from = from;
                this.emit('marker-submesh-transfer', info);
                Marker.emitter.emit('marker-submesh-transfer', info);*/
                if(this.animation && this.submesh) this.animation.stop();
                this.submesh = submesh;
            }
        }catch(ex){
            console.log(ex);
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

    convertAnimation(xOffset, yOffset){
        if(this.animation) this.animation.stop();
        const remainingMillis = this.animation.millis - (Date.now() - this.animation.timestamp);
        let coords = JSON.parse(JSON.stringify(this.mesh.position));
        this.animation = new TWEEN.Tween(coords)
            .to({x:this.animation.targX+xOffset, y:this.animation.targY+yOffset}, remainingMillis)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() =>{
                //console.log(coords)
                this.mesh.position.set(coords.x, coords.y)
            })
        this.animation.start();

    }

    tick(delta, treadmill, scene){
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
};
