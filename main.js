// Sample usage for vite
import { Treadmill, Submesh, Marker, MeshObject } from './submesh-treadmill';

class OneByOneCube extends MeshObject{
    buildObject(){
        return 
    }
}

class SimpleSubmesh extends Submesh{
    constructor(geometry, tilePosition, options={}){
        //todo: scan geometry for size
        this.size = 16; 
        this.mesh = this.createMesh(geometry);
        this.body = this.createPhysicalMesh(this.mesh);
        this.markers = this.createMarkers();
        this.options = options;
    }

    createMesh(geometry){
        throw new Error(genericWarning)
    }

    createPhysicalMesh(geometry){
        return null;
    }

    createMarkers(){
        let onesDigit = this.x % 10;
        let onesLcv = 0;
        for(; onesLcv < onesDigit; onesLcv++){

        }
        let tensDigit = Math.floor(this.x/10) % 10;
        let tensLcv = 0;
        for(;tensLcv < tensDigit; tensLcv++){

        }

    }
}