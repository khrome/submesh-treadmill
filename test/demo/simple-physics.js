// Sample usage for vite
import { Treadmill, Submesh, Marker, MeshObject } from '../../submesh-treadmill';
//import { ShadowMesh } from 'three/addons/objects/ShadowMesh.js';
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
    Vector3
} from "three";
import { DevelopmentTools } from '../../src/development';
import { Cube } from './object';
import { SimpleSubmesh } from './submesh';
import { create as createLights } from './lights';
import { create as createCamera } from './camera';
import { create as createRenderer } from './renderer';

const params = new URLSearchParams(window.location.search);
const debug = params.has('debug');

let treadmill;

const container = document.querySelector(".game-world");

const clock = new Clock();
const scene = new Scene();

const horizonPlaneGeometry = new PlaneGeometry( 1024, 1024 );
horizonPlaneGeometry.translate( 8, 8, -0.001 );
const horizonMaterial = new MeshPhongMaterial({
    color: "#00FF00", 
    flatShading: false
});
const horizonPlane = new Mesh( horizonPlaneGeometry, horizonMaterial );
scene.add(horizonPlane)


const renderer = createRenderer();
container.append(renderer.domElement);
const { ambient, directional } = createLights({ 
    ambient : {},
    directional : { 
        shadows: true, 
        position : new Vector3(8, 8, 0)
    }
});
scene.add(ambient);
scene.add(directional);

scene.background = new Color('#99AAEE');
const { camera, controls } = createCamera({
    type: 'orbital',
    dom: renderer.domElement,
    aspectRatio: (window.innerWidth / window.innerHeight)
});
controls.update();

Treadmill.handleResize(container, camera, renderer);
treadmill = new Treadmill({
    createSubmesh: (x, y)=>{
        const size = SimpleSubmesh.tileSize;
        const geometry = new PlaneGeometry( size, size, size, size );
        geometry.translate( 8, 8, 0 ); //reorient to origin @ ll corner
        const submesh = new SimpleSubmesh(geometry, new Vector2(x, y), {
            onMarkerExit : (marker, submesh, action)=>{
                const newSubmesh = treadmill.submeshAt(marker.mesh.position.x, marker.mesh.position.y);
                if(newSubmesh){ newSubmesh.markers.push(marker);
                }else{
                    scene.remove(marker.mesh);
                    // todo: handle body
                }
                if(marker.linked && marker.linked[0] === camera){
                    treadmill.moveDirection(action)
                };
            }
        });
        return submesh;
    },
    x:2, y:2
}, scene);

let running = false;
const cameraMarker = new Marker(new Cube({ color: 'red' }));
window.handleKey = (event)=>{ //handle iframes, yay!
    // console.log(event)
    switch(event.code){
        case 'KeyW': cameraMarker.forward(1, null, null, treadmill); break;
        case 'KeyS': cameraMarker.backward(1, null, null, treadmill); break;
        case 'KeyA': cameraMarker.strafeRight(1, null, null, treadmill); break;
        case 'KeyD': cameraMarker.strafeLeft(1, null, null, treadmill); break;
        case 'KeyQ': cameraMarker.turnLeft(1, null, null, treadmill); break;
        case 'KeyE': cameraMarker.turnRight(1, null, null, treadmill); break;
        case 'Space': running = !running; break;
    }
}


treadmill.loading.then(()=>{
    // now let's set up an avatar for the camera's target, so we can move it around
    treadmill.addMarkerToStage(cameraMarker, 5, 5);
    controls.target = cameraMarker.mesh.position;
    cameraMarker.linked.push(camera);
    
    scene.add(directional.target);
    directional.updateMatrixWorld();
    
    if(debug){
        window.tools = new DevelopmentTools({ scene, clock, renderer, light: directional, camera });
        window.tools.addShadowCamera();
        window.tools.sceneAxes(new Vector3(0, 0, 0));
        window.tools.show('output', document.body);
        window.tools.show('mesh', document.body);
        window.tools.activateMeshPointSelection(document.body, renderer, scene, camera, treadmill);
    }
    
    renderer.setAnimationLoop(() => {
        if(window.tools) window.tools.tickStart();
        const delta = clock.getDelta();
        treadmill.tick(delta);
        if(directional.tick) directional.tick();
        controls.update();
        renderer.render(scene, camera);
        if(window.tools) window.tools.tickStop();
    }, 100);
    
    Marker.enableSelection(document.body, camera, renderer, treadmill, [Cube]);
    
    window.addEventListener('keydown', window.handleKey);
    
    setInterval(()=>{ if(running) cameraMarker.forward(0.2, null, null, treadmill) }, 10);
});