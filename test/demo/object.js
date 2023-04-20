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

export class Cube extends MeshObject{
    constructor(options={}){
        super(options);
        this.size = this.options.size || 1;
        this.color = options.color || Math.random() * 0xffffff ;
    }
    
    defineActions(){
        return {
            walk: (options) => {
                
            },
            attack: (options) => {
                
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
