import { Scene, PlaneGeometry, Vector2, Vector3, Clock, Color } from "three";
import { Treadmill, Submesh, Marker, MeshObject } from '../submesh-treadmill.js';
import { Cube } from './demo/object.js';
import { SimpleSubmesh } from './demo/submesh.js';
import * as chai from 'chai';

import { create as createRenderer } from './demo/renderer.js';
import { create as createLights } from './demo/lights.js';
import { create as createCamera } from './demo/camera.js';
import { DevelopmentTools } from '../src/development.js';

// this is not better than commonjs, and seems like an FU from the committee

//BEGIN BULLSHIT IMPORT HACKS
if(typeof global === 'object'){
   if(!global.window) global.window = {};
}
const should = (chai.should?chai:window.chai).should();
//END BULLSHIT IMPORT HACKS

const dispCoord = (value)=>{
   return Math.floor(value * 100) / 100;
};

const dispCoords = (vector)=>{
   return [dispCoord(vector.x), dispCoord(vector.y)];
};

describe('submesh-treadmill', ()=>{
   console.log("describe 1");
   describe('creates a treadmill + marker', ()=>{
         console.log("describe 2");
        it('navigates to an adjacent cell', async function(){
            console.log("started")
            this.timeout(60000);
            const startingTile = {x: 0, y: 2};
            const startingPoint = new Vector3(
               16 * startingTile.x + 4, // 4 
               16 * startingTile.y + 4, // 36
               0
            );  // in tile 0, 2
            const targetPoint = new Vector3(38, 38, 0); // head to 4, 4 in tile 2, 2 (go 2 tiles east)
            const scene = new Scene();
            const clock = new Clock();
            const container = document.querySelector(".game-world");
            const renderer = createRenderer();
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
                type: 'orbital',
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
                           console.log('was removed?', submesh.markers.indexOf(marker) === -1);
                           console.log('is avatar?', marker === avatar);
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
                x:startingTile.x, y:startingTile.y
            }, scene);
            const start = Date.now();
            await treadmill.loading;
            const originalCenterPoint = treadmill.center();
            const originalCenterWorldPoint = treadmill.worldPointFor(originalCenterPoint);
            treadmill.addMarker(avatar, startingPoint.x, startingPoint.y, startingPoint.z); // 4, 4 in mesh 2, 2
            console.log('target point', targetPoint)
            avatar.action('moveTo', targetPoint, {}, treadmill);
            if(true){
                 window.tools = new DevelopmentTools({ scene, clock, renderer, light: directional, camera });
                 //tools.addShadowCamera();
                 //tools.sceneAxes(new Vector3(0, 0, 0));
                 //tools.show('output', document.body);
                 //tools.show('mesh', document.body);
                 //tools.activateMeshPointSelection(document.body, renderer, scene, camera, treadmill);
             }
            await new Promise((resolve)=>{
               renderer.setAnimationLoop(() => {
                    window.tools.tickStart();
                    const delta = clock.getDelta();
                    treadmill.tick(delta);
                    if(directional.tick) directional.tick();
                    if(controls) controls.update();
                    renderer.render(scene, camera);
                    window.tools.tickStop();
                    if(!avatar.doing.length){
                       //clearInterval(tickInterval);
                       resolve();
                    }
                }, 100);
            })
            console.log("!!!!")
            const coords = [treadmill.x, treadmill.y];
            await treadmill.moveDirection('north');
            const translatedCenterPoint = treadmill.treadmillPointFor(originalCenterWorldPoint);
            const coords2 = [treadmill.x, treadmill.y];
            
            // compute the change in the new and old center points
            const dx = (coords2[0] - coords[0]) * -16; 
            const dy = (coords2[1] - coords[1]) * -16;
            console.log(dx, dy, translatedCenterPoint, originalCenterPoint)
            translatedCenterPoint.x.should.equal(originalCenterPoint.x + dx);
            translatedCenterPoint.y.should.equal(originalCenterPoint.y + dy);
        });
    });
});
