// Sample usage for vite
import { Treadmill, Submesh, Marker, MeshObject } from '../../submesh-treadmill';
import { ShadowMesh } from 'three/addons/objects/ShadowMesh.js';
import {
    BoxGeometry,
    Mesh,
    MeshLambertMaterial,
    MeshPhongMaterial,
    Group,
    WebGLRenderer,
    DirectionalLightHelper,
    DirectionalLight,
    SphereGeometry,
    PlaneGeometry,
    AmbientLight,
    SpotLight,
    Scene,
    Color,
    Clock,
    AxesHelper,
    BasicShadowMap,
    Vector2,
    Vector3,
    PerspectiveCamera
} from "three";

const GetAngle = (A, B)=>{
    // |A·B| = |A| |B| COS(θ)
    // |A×B| = |A| |B| SIN(θ)

    return Math.atan2(Cross(A,B), Dot(A,B));
}

const Dot = (A, B)=>{
    return A.X*B.X+A.Y*B.Y;
}
const Cross = (A, B)=>{
    return A.X*B.Y-A.Y*B.X;
}

export class Cube extends MeshObject{
    constructor(options={}){
        super(options);
        this.size = this.options.size || 1;
        this.color = options.color || Math.random() * 0xffffff ;
    }
    
    defineActions(){
        return {
            priority: ['moveTo', 'attack'],
            moveTo: (delta, marker, target, options={}, treadmill) => { //meta
                //todo: test "crow flies" obstruction, if obstructed: path find
                marker.action('turn', target, options, treadmill);
                marker.action('forward', target, options, treadmill);
                return delta; 
            },
            turn: (delta, marker, target, options={}, treadmill) => {
                //todo: animate
                const raycaster = marker.lookAt(target);
                //marker.mesh.rotation.z = raycaster.ray.rotation.z;
                const xDist = target.x - marker.mesh.position.x;
                const yDist = target.y - marker.mesh.position.y;
                //const angle = Math.atan2(yDist, xDist);
                //let angle =  Math.atan2(target.y, target.x) -  Math.atan2(marker.mesh.position.y, marker.mesh.position.x);
                //if (angle < 0) { angle += 2 * M_PI; }
                const angle = GetAngle(marker.mesh.position, target);
                //marker.mesh.rotation.z  = angle;
                if(window.tools) window.tools.showRay(raycaster);
                console.log('look', target)
                //marker.mesh.lookAt(target);
                return 0;
            },
            turnLeft: (delta, marker, target, options={}, treadmill) => {
                return marker.turnLeft(delta, target, options, treadmill);
            },
            turnRight: (delta, marker, target, options={}, treadmill) => {
                return marker.turnRight(delta, target, options, treadmill);
            },
            strafeLeft: (delta, marker, target, options={}, treadmill) => {
                return marker.strafeLeft(delta, target, options, treadmill);
            },
            strafeRight: (delta, marker, target, options={}, treadmill) => {
                return marker.strafeRight(delta, target, options, treadmill);
            },
            forward: (delta, marker, target, options={}, treadmill) => {
                return marker.forward(delta, target, options, treadmill);
            },
            backward: (delta, marker, target, options={}, treadmill) => {
                return marker.backward(delta, target, options, treadmill);
            },
            attack: (delta, marker, target, options={}) => {
                console.log('attack', target);
            }
        };
    }
    
    buildObject(){
        const geometry = new BoxGeometry(this.size,this.size,this.size);
        const material = new MeshPhongMaterial({
            color: this.color,    // red (can also use a CSS color string here)
            flatShading: false,
        });
        const mesh = new Mesh( geometry, material );
        mesh.castShadow = true;
        mesh.position.z = this.size/2;
        const object = new Group();
        object.add(mesh);
        return object;
    }
}
