import { Scene, PlaneGeometry, Vector2, Vector3, Clock, Color } from "three";
import { Treadmill, Submesh, Marker, MeshObject } from '../submesh-treadmill.js';
import { Cube } from './demo/object.js';
import { SimpleSubmesh } from './demo/submesh.js';

import { create as createRenderer } from './demo/renderer.js';
import { create as createLights } from './demo/lights.js';
import { create as createCamera } from './demo/camera.js';
import { buildScene, importHack, testTimeoutMillis, timeoutOffset } from './util.js';
import { DevelopmentTools } from '../src/development.js';

// this import works across browser and node mocha, hide the magic
const { debug, should, chai, cameraType, headless } = importHack();

describe('submesh-treadmill', ()=>{
   console.log("describe 1");
   describe('creates a treadmill + marker', ()=>{
        it('marker coordinates are sound', async function(){
            this.timeout(testTimeoutMillis + timeoutOffset);
            const startingTile = {x: 0, y: 2};
            const startingPoint = new Vector3(
               16 * startingTile.x + 4, // 4 
               16 * startingTile.y + 4, // 36
               0
            );  // in tile 0, 2
            const targetPoint = new Vector3(38, 38, 0); // head to 4, 4 in tile 2, 2 (go 2 tiles east)
            const {
               treadmill, scene, camera, directional, ambient, clock, container, renderer
            } = buildScene({ startingTile, headless });
            const start = Date.now();
            await treadmill.loading;
            const originalCenterPoint = treadmill.center();
            const originalCenterWorldPoint = treadmill.worldPointFor(originalCenterPoint);
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
            renderer.domElement.remove();
        });
        
        it('navigates to an adjacent cell', async function(){
            console.log("started")
            this.timeout(testTimeoutMillis + timeoutOffset);
            const startingTile = {x: 0, y: 2};
            const startingPoint = new Vector3(
               16 * startingTile.x + 4, // 4 
               16 * startingTile.y + 4, // 36
               0
            );  // in tile 0, 2
            const targetPoint = new Vector3(38, 38, 0); // head to 4, 4 in tile 2, 2 (go 2 tiles east)
            const {
               treadmill, scene, camera, directional, 
               ambient, clock, container, renderer,
               avatar, executeLoopWithTimeout
            } = buildScene({ startingTile, headless });
            const start = Date.now();
            await treadmill.loading;
            const originalCenterPoint = treadmill.center();
            const originalCenterWorldPoint = treadmill.worldPointFor(originalCenterPoint);
            treadmill.addMarker(avatar, startingPoint.x, startingPoint.y, startingPoint.z); // 4, 4 in mesh 2, 2
            console.log('target point', targetPoint)
            avatar.action('moveTo', targetPoint, {}, treadmill);
            if(debug){
                 window.tools = new DevelopmentTools({ scene, clock, renderer, light: directional, camera });
                 window.tools.addShadowCamera();
                 window.tools.sceneAxes(new Vector3(0, 0, 0));
                 //tools.show('output', document.body);
                 //tools.show('mesh', document.body);
                 //tools.activateMeshPointSelection(document.body, renderer, scene, camera, treadmill);
            }
            //execute until the avatar is done performing actions
            await executeLoopWithTimeout(()=> !avatar.doing.length );
            console.log("!!!!");
            renderer.domElement.remove();
        });
    });
});
