import { 
    MarkerEngine, 
    Submesh,
    tools, enable
} from 'marker-engine';
import { 
    Scene,
    PlaneGeometry,
    Raycaster,
    Mesh,
    Vector3,
    Color,
    MeshPhongMaterial
} from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { create as createLights } from './src/lights.mjs';
import { create as createCamera } from './src/camera.mjs';
import { create as createRenderer } from './src/renderer.mjs';
import { enableSelection } from './src/selection.mjs';
import { Emitter } from 'extended-emitter';

import { Marker } from './src/marker.mjs';
import { Projectile } from './src/projectile.mjs';
import { PhysicsProjectile } from './src/physics-projectile.mjs';
import { Scenery } from './src/scenery.mjs';
import { Monster } from './src/monster.mjs';
import { allMarkers } from './src/preload-fbx.mjs';
export const Entity = Monster;

export { Marker, Projectile, PhysicsProjectile, Scenery, Monster };

const createScene = ()=>{
    const scene = new Scene();
    scene.background = new Color('#99AAEE');
    return scene;
};

export class Treadmill {
    constructor(options={}){
        this.engine = new MarkerEngine({
            voxelFile: options.voxelFile || '/voxels.mjs',
            markerTypesFile: options.markerTypesFile || [Marker]
        });
        this.renderer = options.renderer || createRenderer(options.renderOptions);
        const { camera, controls } = options.camera || createCamera(options.cameraOptions || {
            type: 'orbital',
            dom: this.renderer.domElement,
            aspectRatio: (window.innerWidth / window.innerHeight)
        });
        (new Emitter()).onto(this);
        this.camera = camera;
        this.controls = controls;
        controls.update();
        this.lights = options.lights || createLights(options.lightOptions || { 
            ambient : {},
            directional : { 
                shadows: true, 
                position : new Vector3(8, 8, 0)
            }
        });
        const { ambient, directional } = this.lights;
        this.ambient = ambient;
        this.directional = directional;
        this.scene = options.scene || createScene(options.sceneOptions);
        this.scene.add(ambient);
        this.scene.add(directional);
        if(options.container && this.camera && this.renderer && this.scene){
            this.attachTo(
                options.container, 
                this.camera, 
                this.renderer,
                this.scene
            );
        }
        
        const selection = enableSelection({ 
            container: this.container, 
            camera: this.camera, 
            renderer:this.renderer, 
            treadmill: this,
            onMouseOver: (marker)=>{
                console.log('mouseover', marker);
                /*
                if(marker.mesh.highlightedOutline && !selection.contains(marker)){
                    marker.mesh.highlightedOutline.position.copy(marker.mesh.position);
                    scene.add(marker.mesh.highlightedOutline);
                } //*/
            },
            onMouseAway: (marker)=>{
                /*
                if(marker.mesh.highlightedOutline && !selection.contains(marker)){
                    scene.remove(marker.mesh.highlightedOutline);
                } //*/
            },
            onSelect: (marker)=>{
                selection.add(marker);
                //this.emit('selection', selection.items());
                if(marker.selectionMesh){
                    this.scene.add(marker.selectionMesh);
                    marker.selectionMesh.quaternion.copy(marker.mesh.quaternion);
                    marker.selectionMesh.position.copy(marker.mesh.position);
                }
            },
            onDeselect: (marker)=>{
                if(marker.selectionMesh){
                    this.scene.remove(marker.selectionMesh);
                }
            },
            /*isSelectable: (marker)=>{
                return true;
            }, //*/
            markerTypes: this.markerTypes
        });
        
        if(options.debug) enable({ 
            scene:this.scene, 
            renderer: this.renderer, 
            light: this.directional , 
            camera: this.camera
        });
    }
    
    attachTo(container, camera, renderer, scene){
        const el = typeof container === 'string'?document.querySelector(container):container;
        el.appendChild(renderer.domElement);
        this.container = el;
        const setSize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
        };
        setSize();
        window.addEventListener('resize', () => {
            setSize();
            renderer.render(scene, camera);
        });
    }
    
    activeSubmeshes(){
        return Object.keys(this.engine.submeshes).map((key)=>{
            return this.engine.submeshes[key];
        })
    }
    
    activeMarkers(markerTypes){
        return this.engine.markers.filter((marker)=>{
            return markerTypes.reduce((agg, type)=>{
                return agg || marker instanceof type;
            }, false);
        });
    }
    
    addMarker(marker){
        this.engine.addMarker(marker);
        this.scene.add(marker.mesh || marker.model());
        tools((tool)=>{
            tool.axes(marker.position)
        });
    }
    
    focusOn(marker){
        this.engine.focusOn(marker);
    }
    
    async preload(tlMarkerTypes){
        await this.engine.initialize(async (markerTypes)=>{
            const loadables = [];
            (tlMarkerTypes  || markerTypes).forEach((Type)=>{
                loadables.push(Type.preload());
            });
            await Promise.all(loadables);
        });
    }
    
    start(turnHandler){
        this.renderer.setAnimationLoop(() => {
            //if(window.tools) window.tools.tickStart();
            //if(directional.tick) directional.tick();
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
            //if(window.tools) window.tools.tickStop();
            if(turnHandler) turnHandler();
        }, 100);
        
        tools((tool)=>{
            tool.sceneAxes(new Vector3(0, 0, 0), 2);
            tool.sceneAxes(new Vector3(-16, -16, 0), 2);
            tool.sceneAxes(new Vector3(0, -16, 0), 2);
            tool.sceneAxes(new Vector3(-16, 0, 0), 2);
            tool.sceneAxes(new Vector3(16, 16, 0), 2);
            tool.sceneAxes(new Vector3(16, -16, 0), 2);
            tool.sceneAxes(new Vector3(-16, 16, 0), 2);
            tool.sceneAxes(new Vector3(0, 16, 0), 2);
            tool.sceneAxes(new Vector3(16, 0, 0), 2);
        });
        
        this.engine.on('create-markers', (markers)=>{
            markers.forEach((marker)=>{
                marker.engine = this.engine;
                marker.model();
                marker.selection();
                this.addMarker(marker)
                //this.engine.markers.push(marker);
                //this.scene.add(marker.mesh);
            });
        });
        
        this.engine.on('state', (data)=>{
            const currentMarkers = allMarkers();
            data.markers.forEach((changedMarker)=>{
                currentMarkers.forEach((existingMarker)=>{
                    if(existingMarker.id === changedMarker.id){
                        existingMarker.mesh.position.x = changedMarker.position.x;
                        existingMarker.mesh.position.y = changedMarker.position.y;
                        existingMarker.mesh.position.z = changedMarker.position.z;
                        existingMarker.mesh.quaternion.x = changedMarker.quaternion.x;
                        existingMarker.mesh.quaternion.y = changedMarker.quaternion.y;
                        existingMarker.mesh.quaternion.z = changedMarker.quaternion.z;
                        existingMarker.mesh.quaternion.w = changedMarker.quaternion.w;
                        if(existingMarker.selectionMesh){
                            existingMarker.selectionMesh.position.x = changedMarker.position.x;
                            existingMarker.selectionMesh.position.y = changedMarker.position.y;
                            existingMarker.selectionMesh.position.z = changedMarker.position.z;
                            existingMarker.selectionMesh.quaternion.x = changedMarker.quaternion.x;
                            existingMarker.selectionMesh.quaternion.y = changedMarker.quaternion.y;
                            existingMarker.selectionMesh.quaternion.z = changedMarker.quaternion.z;
                            existingMarker.selectionMesh.quaternion.w = changedMarker.quaternion.w;
                        }
                    }
                });
            });
        });
        this.engine.on('submesh', (incomingSubmesh)=>{
            const submesh = (
                incomingSubmesh instanceof Submesh
            )?incomingSubmesh:new Submesh(incomingSubmesh);
            if(!submesh.mesh) submesh.mesh = submesh.model();
            this.scene.add(submesh.mesh);
            tools((tool)=>{
                tool.axes(submesh.position, 2)
            });
        });
        this.engine.on('remove-submesh', (submesh)=>{
            this.scene.remove(submesh.mesh);
        });
        this.engine.on('remove-markers', (markers)=>{
            markers.forEach((marker)=>{
                this.scene.remove(marker.mesh);
            })
        });
        this.engine.start();
        
    }
    
    stop(){
        this.engine.stop();
    }
}