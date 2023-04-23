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
    CylinderGeometry,
    PlaneGeometry,
    AmbientLight,
    Matrix4,
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

export class Cube extends MeshObject{
    constructor(options={}){
        super(options);
        this.size = this.options.size || 1;
        this.color = options.color || Math.random() * 0xffffff ;
    }
    
    defaultValues(){
        return {
            "movementSpeed" : 1,
            "turnSpeed" : 0.1,
            "health" : 10
        }
    }
    
    defineActions(){
        return {
            priority: ['moveTo', 'attack'],
            moveTo: (delta, marker, target, options={}, treadmill) => { //meta
                //todo: test "crow flies" obstruction, if obstructed: path find
                //window.tools.showPoint(target, 'target');
                marker.action('turn', target, options, treadmill);
                marker.action('forward', target, options, treadmill);
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
            interact: (delta, marker, target, options={}) => {
                console.log('attack', target);
            }
        };
    }
    
    buildObject(){
        //const geometry = new BoxGeometry(this.size,this.size,this.size);
        const height = this.options.height || 2;
        const geometry = new CylinderGeometry( this.size, this.size, height, 8 );
        geometry.applyMatrix4( new Matrix4().makeRotationX( Math.PI / 2 ) );
        geometry.applyMatrix4( new Matrix4().makeTranslation( 0,  0, height/2) );
        const material = new MeshPhongMaterial({
            color: this.color,    // red (can also use a CSS color string here)
            flatShading: false,
        });
        const mesh = new Mesh( geometry, material );
        mesh.castShadow = true;
        const object = new Group();
        object.add(mesh);
        if(window.tools){
            console.log('added axes');
            const offset = mesh.position.clone();
            offset.x -= .002;
            offset.y -= .002;
            offset.z -= .002;
            object.add(window.tools.axes(offset));
        }
        return object;
    }
}