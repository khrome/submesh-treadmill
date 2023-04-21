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
import { DevelopmentTools } from '../../src/development';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Cube } from './object';
import { SimpleSubmesh } from './submesh';

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
            const newSubmesh = treadmill.submeshAt(marker.mesh.position.x, marker.mesh.position.y);
            console.log(marker.mesh.position.x, marker.mesh.position.y, submesh);
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

const container = document.querySelector(".game-world");

const clock = new Clock();
const scene = new Scene();

const horizonPlaneGeometry = new PlaneGeometry( 1024, 1024 );
horizonPlaneGeometry.translate( 8, 8, -0.001 );
const horizonMaterial = new MeshPhongMaterial({
    color: "#00FF00",    // red (can also use a CSS color string here)
    flatShading: false
});
const horizonPlane = new Mesh( horizonPlaneGeometry, horizonMaterial );
scene.add(horizonPlane)

const renderer = new WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = BasicShadowMap;
const ambient = new AmbientLight( 0x404040 , 0.1);
scene.add(ambient);


const spot = new SpotLight( 0x404040, 0.8);
spot.castShadow = true;
spot.shadow.mapSize.width = 2048;
spot.shadow.mapSize.height = 2048;
spot.shadow.bias = 0.0001;
spot.shadow.decay = 4;
spot.position.set(8, 8, 8);
spot.target.position.set(8, 8, 0);
scene.add(spot);

const light = spot;

scene.background = new Color('#220822');
const camera = new PerspectiveCamera(
    45, 
    window.innerWidth / window.innerHeight, 
    1, 
    10000
);
window.tools = new DevelopmentTools({ scene, clock, renderer, light, camera });
const controls = new OrbitControls( camera, renderer.domElement );
container.append(renderer.domElement);

controls.target.set( 8, 8, 0 );
controls.minPolarAngle = Math.PI * .5; 
controls.maxPolarAngle = Math.PI;
controls.maxDistance = 20;
camera.position.set( 3.5, -20, 7 );
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

treadmill = new Treadmill({
    createSubmesh,
    x:2, y:2
}, scene);

const cameraMarker = new Marker(new Cube({ color: 'red' }));
let running = false;

window.handleKey = (event)=>{ //handle iframes, yay!
    // console.log(event)
    switch(event.code){
        case 'KeyW': cameraMarker.forward(1, null, null, treadmill);
            break;
        case 'KeyS': cameraMarker.backward(1, null, null, treadmill);
            break;
        case 'KeyA': cameraMarker.strafeRight(1, null, null, treadmill);
            break;
        case 'KeyD': cameraMarker.strafeLeft(1, null, null, treadmill);
            break;
        case 'KeyQ': cameraMarker.turnLeft(1, null, null, treadmill);
            break;
        case 'KeyE': cameraMarker.turnRight(1, null, null, treadmill);
            break;
        case 'Space': running = !running;
            break;
    }
}

treadmill.loading.then(()=>{
    // now let's set up an avatar for the camera's target, so we can move it around
    treadmill.addMarkerToStage(cameraMarker, 5, 5);
    controls.target = cameraMarker.mesh.position;
    cameraMarker.linked.push(camera);
    // tools.addShadowCamera();
    
    scene.add(light.target);
    
    console.log(light.shadow.camera);
    light.updateMatrixWorld();
    renderer.setAnimationLoop(() => {
        tools.tickStart();
        spot.position.set(cameraMarker.mesh.position.x, cameraMarker.mesh.position.y);
        spot.target.position.set(cameraMarker.mesh.position.x, cameraMarker.mesh.position.y);
        const delta = clock.getDelta();
        treadmill.tick();
        if(light.tick) light.tick();
        controls.update();
        renderer.render(scene, camera);
        tools.tickStop();
    }, 100);
    
    window.addEventListener('keydown', window.handleKey);
    
    setInterval(()=>{ if(running) cameraMarker.forward(1, null, null, treadmill) }, 10);
    // tools.sceneAxes(new Vector3(0, 0, 0));
    tools.show('output', document.body);
    //tools.show('mesh', document.body);
    //tools.activateMeshPointSelection(document.body, renderer, scene, camera, treadmill);
});