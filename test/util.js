import { Scene, PlaneGeometry, Vector2, Vector3, Clock, Color } from "three";
import { Treadmill, Submesh, Marker, MeshObject } from '../submesh-treadmill.js';
import { Cube } from './demo/object.js';
import { SimpleSubmesh } from './demo/submesh.js';
import * as chai from 'chai';

import { create as createRenderer } from './demo/renderer.js';
import { create as createLights } from './demo/lights.js';
import { create as createCamera } from './demo/camera.js';

const dispCoord = (value)=>{
   return Math.floor(value * 100) / 100;
};

export const dispCoords = (vector)=>{
   return [dispCoord(vector.x), dispCoord(vector.y)];
};

const testTimeoutSeconds = 60;
export const testTimeoutMillis = testTimeoutSeconds * 1000;
export const timeoutOffset = 5000;

// this is not better than commonjs, and seems like an FU from the committee
let cameraType = null;
//BEGIN BULLSHIT IMPORT HACKS
export const importHack = ()=>{
    cameraType = 'orbital';
    let headless = false;
    if(typeof global === 'object'){
       if(!global.window) global.window = {
           addEventListener: ()=>{}
       };
       if(!global.document) global.document = {
           querySelector: ()=>{ 
               return {
                   append: ()=>{}
               }
           }
       };
       headless = true;
       cameraType = 'perspective';
    }
    const should = (chai.should?chai:window.chai).should();
    const debug = true;
    return { debug, should, chai, cameraType, headless};
}
//END BULLSHIT IMPORT HACKS

export const buildScene = (options={})=>{
    const scene = new Scene();
    const clock = new Clock();
    const container = document.querySelector(".game-world");
    const renderer = createRenderer({ headless: options.headless });
    scene.background = new Color('#99AAEE');
    const { ambient, directional } = createLights({ 
        ambient : {},
        directional : { 
           shadows: true, 
           position : new Vector3(8, 8, 0)
       }
    });
    scene.add(directional);
    scene.add(ambient);
    const { camera, controls } = createCamera({
        type: cameraType,
        dom: renderer.domElement,
        aspectRatio: (window.innerWidth / window.innerHeight)
    });
    scene.add(camera);
    console.log(renderer);
    const avatar = new Marker(new Cube({ color: 'red' }));
    container.append(renderer.domElement);
    Treadmill.handleResize(container, camera, renderer);
    const treadmill = new Treadmill({
        createSubmesh: (x, y)=>{
            const size = SimpleSubmesh.tileSize;
            const geometry = new PlaneGeometry( size, size, size, size );
            geometry.translate( 8, 8, 0 ); //reorient to origin @ ll corner
            const submesh = new SimpleSubmesh(geometry, new Vector2(x, y), {
                onMarkerExit : (marker, submesh, action)=>{
                    if(options.debug){
                        console.log('was removed?', submesh.markers.indexOf(marker) === -1);
                        console.log('is avatar?', marker === avatar);
                    }
                    const newSubmesh = treadmill.submeshAt(
                        marker.mesh.position.x, 
                        marker.mesh.position.y
                    );
                    if(newSubmesh) newSubmesh.markers.push(marker);
                    else scene.remove(marker.mesh);
                    if(marker === avatar){
                        treadmill.moveDirection(action)
                    };
                }
            });
            return new Promise((resolve, reject)=>{
                try{ resolve(submesh) }catch(ex){ reject(ex) }
            });
        },
        x: options.startingTile.x, y: options.startingTile.y
    }, scene);
    const result = {
        treadmill, 
        scene, 
        camera, 
        directional, 
        ambient, 
        clock, 
        container, 
        renderer,
        avatar,
        createLoop: (handler)=>{
            renderer.setAnimationLoop(() => {
                if(window.tools) window.tools.tickStart();
                const delta = clock.getDelta();
                treadmill.tick(delta);
                if(directional.tick) directional.tick();
                if(controls) controls.update();
                renderer.render(scene, camera);
                if(window.tools) window.tools.tickStop();
                handler(delta);
            }, 100);
        },
        executeLoopWithTimeout: (doneWhen)=>{
            return new Promise((resolve, reject)=>{
                let resolved = false;
                setTimeout(()=>{
                    console.log('timeout triggered!')
                    if(!resolved){
                        renderer.setAnimationLoop(null);
                        renderer.domElement.remove();
                        resolved = true;
                        reject(new Error('Exceeded Internal Timeout'));
                    }
                }, testTimeoutMillis)
                result.createLoop(()=>{
                    if(doneWhen() && !resolved){
                       renderer.setAnimationLoop(null);
                       resolved = true;
                       resolve();
                    }
                });
            });
        }
    };
    return result;
}