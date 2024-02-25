import { Marker } from './marker.mjs';
import { Projectile } from './projectile.mjs';
import { PhysicsProjectile } from './physics-projectile.mjs';
import { Scenery } from './scenery.mjs';
import { Monster } from './monster.mjs';
export { Marker, Projectile, PhysicsProjectile, Scenery, Monster };
export const Entity = Monster;

export class Avatar extends Marker{ constructor(o){ super(o) } }

export const markerTypes = async ()=>{
    return [
        Marker, 
        Monster, 
        Projectile, 
        PhysicsProjectile, 
        Scenery, 
        Avatar
    ];
}
