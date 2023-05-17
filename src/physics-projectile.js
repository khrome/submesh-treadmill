import { Projectile } from './projectile.js';

export class PhysicsProjectile extends Projectile{
    constructor(options={}){
        super(options);
        this.physics = true;
    }
    
    defineActions(){
        return {
            settle: (marker, target, options={}, treadmill) => {
                
            },
            impact: (marker, incomingMarker, options={}, treadmill) => {
                
            }
        };
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