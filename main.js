// Sample usage for vite
import { Treadmill, Submesh, Marker, MeshObject } from './submesh-treadmill';
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
    Scene,
    Color,
    Clock,
    AxesHelper,
    PerspectiveCamera
} from "three";
import { DevelopmentTools } from './src/development';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Cube extends MeshObject{
    constructor(options){
        super(options);
        this.size = this.options.size || 1;
        this.color = Math.random() * 0xffffff ;
    }
    buildObject(){
        const geometry = new BoxGeometry(this.size,this.size,this.size);
        const material = new MeshPhongMaterial({
            color: this.color,    // red (can also use a CSS color string here)
            flatShading: false,
        });
        const mesh = new Mesh( geometry, material );
        mesh.position.z = this.size/2;
        const object = new Group();
        object.add(leavesMesh);
        return object;
    }
}

class SimpleSubmesh extends Submesh{
    constructor(geometry, tilePosition, options={}){
        //todo: scan geometry for size
        super(geometry, tilePosition, options);
        this.size = 16; 
        this.mesh = this.createMesh(geometry);
        this.body = this.createPhysicalMesh(this.mesh);
        this.markers = this.createMarkers() || [];
        this.options = options;
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

const createSubmesh = (x, y)=>{
    const geometry = new PlaneGeometry( 
        SimpleSubmesh.size, 
        SimpleSubmesh.size,
        //SimpleSubmesh.size, 
        //SimpleSubmesh.size
    );
    //geometry.rotateX( - Math.PI / 2);
    const submesh = new SimpleSubmesh(geometry, x, y);
    return submesh;
};

const tools = new DevelopmentTools();

const container = document.querySelector(".game-world");

const clock = new Clock();
const scene = new Scene();
const renderer = new WebGLRenderer({ antialias: true });
const light = new DirectionalLight('#FFFFFF', 0.6);
const lightHelper = new DirectionalLightHelper(light, 0);
scene.add(light);
scene.background = new Color('#99AAEE');
const camera = new PerspectiveCamera(
    45, 
    window.innerWidth / window.innerHeight, 
    1, 
    10000
);
const controls = new OrbitControls( camera, renderer.domElement );
container.append(renderer.domElement);
camera.position.set( 0, 20, 100 );
controls.update();

const setSize = (container, camera, renderer) => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
};
setSize(container, camera, renderer);
window.addEventListener('resize', () => {
    setSize(container, camera, renderer);
    renderer.render(scene, camera);
});

var axesHelper = new AxesHelper( 5 );
axesHelper.setColors('red', 'blue', 'green');
scene.add( axesHelper );

const treadmill = new Treadmill({
    createSubmesh,
    x:2, y:2
}, scene);

renderer.setAnimationLoop(() => {
    tools.tickStart();
    const delta = clock.getDelta();
    treadmill.tick();
    if(light.tick) light.tick();
    controls.update();
    renderer.render(scene, camera);
    tools.tickStop();
});

tools.show('output', document.body);
tools.show('mesh', document.body);