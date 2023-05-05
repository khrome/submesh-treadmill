import { Projectile } from './projectile.js';

export class PhysicsProjectile extends Projectile{
    constructor(options={}){
        super(options);
        this.physics = true;
    }
    
    defineActions(){
        return {
            settle: (delta, marker, target, options={}, treadmill) => {
                
            },
            impact: (delta, marker, target, options={}, treadmill) => {
                
            }
        };
    }
    
    impact(marker, impactingMarker, treadmill){
        //treadmill.scene.remove(impactingMarker.mesh);
        //console.log(marker.damage, impactingMarker.damage);
        //todo: allow ricochet;
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