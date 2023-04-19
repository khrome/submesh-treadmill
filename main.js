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
    AmbientLight,
    Scene,
    Color,
    Clock,
    AxesHelper,
    Vector2,
    PerspectiveCamera
} from "three";
import { DevelopmentTools } from './src/development';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Cube extends MeshObject{
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
        mesh.position.z = this.size/2;
        const object = new Group();
        object.add(mesh);
        return object;
    }
}

class SimpleSubmesh extends Submesh{
    constructor(geometry, tilePosition, options={}){
        super(geometry, tilePosition, options);
    }

    createPhysicalMesh(geometry){
        return null;
    }

    createMarkers(){
        // X
        const color = Math.random() * 0x993399 ;
        let onesDigit = this.x % 10;
        let onesLcv = 0;
        let marker = null;
        let markers = [];
        for(; onesLcv < onesDigit; onesLcv++){
            marker = new Marker(new Cube({ color: color, size: 0.5 }));
            marker.naturalX = onesLcv + this.mesh.position.x + 0.5;
            marker.naturalY = 14 + this.mesh.position.y;
            markers.push(marker);
        }
        let tensDigit = Math.floor(this.x/10) % 10;
        let tensLcv = 0;
        for(;tensLcv < tensDigit; tensLcv++){
            marker = new Marker(new Cube({ color: color, size: 0.5 }));
            marker.naturalX = tensLcv + this.mesh.position.x + 0.5;
            marker.naturalY = 12 + this.mesh.position.y;
            markers.push(marker);
        }
        
        // Y
        onesDigit = this.y % 10;
        onesLcv = 0;
        marker = null;
        for(; onesLcv < onesDigit; onesLcv++){
            marker = new Marker(new Cube({ color: color, size: 0.5 }));
            marker.naturalX = onesLcv + this.mesh.position.x + 0.5;
            marker.naturalY = 8 + this.mesh.position.y;
            markers.push(marker);
        }
        tensDigit = Math.floor(this.y/10) % 10;
        tensLcv = 0;
        for(;tensLcv < tensDigit; tensLcv++){
            marker = new Marker(new Cube({ color: color, size: 0.5 }));
            marker.naturalX = tensLcv + this.mesh.position.x + 0.5;
            marker.naturalY = 6 + this.mesh.position.y;
            markers.push(marker);
        }
        return markers;
    }
}

let treadmill;

const createSubmesh = (x, y)=>{
    const geometry = new PlaneGeometry( 
        SimpleSubmesh.tileSize, 
        SimpleSubmesh.tileSize,
        SimpleSubmesh.tileSize, 
        SimpleSubmesh.tileSize
    );
    geometry.translate( 8, 8, 0 ); //reorient to origin @ ll corner
    const debouncedMove = treadmill.blocked(()=>{
        console.log(marker, submesh, action);
    })
    const submesh = new SimpleSubmesh(geometry, new Vector2(x, y), {
        onMarkerExit : (marker, submesh, action)=>{
            console.log('.')
            const newSubmesh = treadmill.submeshAt(marker.mesh.position.x, marker.mesh.position.y);
            if(newSubmesh){
                newSubmesh.markers.push(marker);
            }else{
                scene.remove(marker.mesh);
                // todo: handle body
            }
            debouncedMove(action); //needed?
        }
    });
    return submesh;
};

const tools = new DevelopmentTools();

const container = document.querySelector(".game-world");

const clock = new Clock();
const scene = new Scene();
const renderer = new WebGLRenderer({ antialias: true });
const light = new AmbientLight( 0x404040 );
//const light = new DirectionalLight('#FFFFFF');
//const lightHelper = new DirectionalLightHelper(light, 0);
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
controls.target.set( 8, 8, 0 );
camera.position.set( 0, -20, 20 );
camera.up.set(0, 1, 0);
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

treadmill = new Treadmill({
    createSubmesh,
    x:2, y:2
}, scene);


treadmill.loading.then(()=>{
    // now let's set up an avatar for the camera's target, so we can move it around
    const cameraMarker = new Marker(new Cube({ color: 'red' }));
    treadmill.addMarkerToStage(cameraMarker, 5, 5);
    controls.target = cameraMarker.mesh.position;
    cameraMarker.linked.push(camera);
    //cameraMarker.foo = true;
    
    renderer.setAnimationLoop(() => {
        //cameraMarker
        camera.target = cameraMarker.mesh;
        tools.tickStart();
        const delta = clock.getDelta();
        treadmill.tick();
        if(light.tick) light.tick();
        controls.update();
        renderer.render(scene, camera);
        tools.tickStop();
    }, 100);
    
    let running = false;
    
    window.addEventListener('keydown', (event)=>{
        // console.log(event)
        switch(event.code){
            case 'KeyW': cameraMarker.forward();
                break;
            case 'KeyS': cameraMarker.backward();
                break;
            case 'KeyA': cameraMarker.strafeRight();
                break;
            case 'KeyD': cameraMarker.strafeLeft();
                break;
            case 'Space': running = !running;
            break;
        }
    });
    
    setInterval(()=>{ if(running) cameraMarker.forward() }, 10);
    
    tools.show('output', document.body);
    tools.show('mesh', document.body);
    tools.activateMeshPointSelection(document.body, renderer, scene, camera, treadmill);
});