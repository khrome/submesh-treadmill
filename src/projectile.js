import { MeshObject } from './object.js';

export class Projectile extends MeshObject{
    constructor(options={}){
        super(options);
    }
    
    defineActions(){
        return {
            moveTo: (delta, marker, target, options={}, treadmill) => { //meta
                //todo: test "crow flies" obstruction, if obstructed: path find
                marker.action('turn', treadmill.worldPointFor(target), options, treadmill);
                marker.action('forward', treadmill.worldPointFor(target), options, treadmill);
                return delta; 
            },
            turn: (delta, marker, target, options={}, treadmill) => {
                return marker.turnRight(delta, target, options, treadmill);
            },
            turnLeft: (delta, marker, target, options={}, treadmill) => {
                return marker.turnLeft(delta, target, options, treadmill);
            },
            turnRight: (delta, marker, target, options={}, treadmill) => {
                return marker.turnRight(delta, target, options, treadmill);
            },
            forward: (delta, marker, target, options={}, treadmill) => {
                return marker.forward(delta, target, options, treadmill);
            }
        };
    }
    
    impact(marker, impactingMarker, treadmill){
        //todo: allow ricochet;
        if(marker?.actions?.impact) return marker.actions.impact(
            marker, impactingMarker, {}, treadmill
        );
        impactingMarker.destroy();
        marker.alterDurability(impactingMarker.values.damage);
        impactingMarker.alterDurability(impactingMarker.values.damage);
        if(marker.values.durability <= 0){
            if(marker.object.actions.destroy){
                console.log('implement action destruction');
            }else{
                marker.destroy();
            }
        }
    }
    
    defaultValues(){
        return {
            "movementSpeed" : 10,
            "collisionRadius" : (this.options.size || 0.5)/2,
            "damage" : {
                "ballistic" : 10
            },
            "range" : 20,
            "durability": 100,
            "turnSpeed" : 7, // > 2pi
            "health" : 10
        };
    }
    
}