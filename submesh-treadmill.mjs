import { 
    MarkerEngine, 
    Submesh, 
    Marker as MEMarker, 
    Projectile as MEProjectile, 
    PhysicsProjectile as MEPhysicsProjectile, 
    Scenery as MEScenery, 
    Monster as MEMonster,
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

const preloadFBX = async (model, options={})=>{
    const fbxLoader = new FBXLoader()
    return await new Promise((resolve, reject)=>{
        fbxLoader.load(
            model,
            (object) => {
                object.traverse((child)=>{
                    if(child.isMesh){
                        //child.rotation.x += 1.5;
                        //child.scale.set(.01, .01, .01)
                        //child.matrix.makeRotationX(1.5)
                    }
                })
                //object.scale.set(.01, .01, .01)
                //object.makeRotationX(1.5)
                //object.rotation.x += 1.5;
                resolve(object);
            },
            (xhr) => {
                //console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                reject(error)
            }
        );
    });
}

const createScene = ()=>{
    const scene = new Scene();
    scene.background = new Color('#99AAEE');
    return scene;
};

export const allProjectileTypes = [];
export const allPhysicsProjectileTypes = [];
export const allSceneryTypes = [];
export const allMonsterTypes = [];
const customMarkerTypes = [];
let everyMarkerType = null;
let markerTypesDirty = true;

export const allMarkerTypes = ()=>{
    if(markersDirty){
        markersDirty = [
            ...allProjectileTypes, 
            ...allPhysicsProjectileTypes, 
            ...allSceneryTypes, 
            ...allMonsterTypes,
            ...customMarkerTypes
        ];
        markersDirty = false;
    }
    return markersDirty;
}


export const allProjectiles = [];
export const allPhysicsProjectiles = [];
export const allScenery = [];
export const allMonsters = [];
const customMarkers = [];
let everyMarker = null;
let markersDirty = true;

export const allMarkers = ()=>{
    if(markersDirty){
        markersDirty = [
            ...allProjectiles, 
            ...allPhysicsProjectiles, 
            ...allScenery, 
            ...allMonsters,
            ...customMarkers
        ];
        markersDirty = false;
    }
    return markersDirty;
}

export class Marker extends MEMarker{
    static model = null;
    static modelFile = null;
    static async preload(modelPath){
        const modelLocation = modelPath || this.modelFile;
        if(modelLocation) this.model = await preloadFBX(modelLocation);
        customMarkerTypes.push(this);
        markersDirty = true;
    }
    constructor(options={}){
        super(options);
        customMarkers.push(this);
    }
}

export class Projectile extends MEProjectile{
    static model = null;
    static modelFile = null;
    static async preload(modelPath){
        const modelLocation = modelPath || this.modelFile;
        if(modelLocation) this.model = await preloadFBX(modelLocation);
        allProjectileTypes.push(this);
        markersDirty = true;
    }
    constructor(options={}){
        super(options);
        allProjectiles.push(this);
    }
}

export class PhysicsProjectile extends MEPhysicsProjectile{
    static model = null;
    static modelFile = null;
    static async preload(modelPath){
        const modelLocation = modelPath || this.modelFile;
        if(modelLocation) this.model = await preloadFBX(modelLocation);
        allPhysicsProjectileTypes.push(this);
        markersDirty = true;
    }
    constructor(options={}){
        super(options);
        allPhysicsProjectiles.push(this);
    }
}

export class Scenery extends MEScenery{
    static model = null;
    static modelFile = null;
    static async preload(modelPath){
        const modelLocation = modelPath || this.modelFile;
        if(modelLocation) this.model = await preloadFBX(modelLocation);
        allSceneryTypes.push(this);
        markersDirty = true;
    }
    constructor(options={}){
        super(options);
        allScenery.push(this);
    }
}

export class Monster extends MEMonster{
    static model = null;
    static modelFile = null;
    static async preload(modelPath){
        const modelLocation = modelPath || this.modelFile;
        if(modelLocation) this.model = await preloadFBX(modelLocation);
        allMonsterTypes.push(this);
        markersDirty = true;
    }
    constructor(options={}){
        super(options);
        allMonsters.push(this);
    }
}

export class Treadmill {
    constructor(options={}){
        this.markerTypes = options.markerTypes || [Marker];
        this.engine = new MarkerEngine({
            voxelFile: options.voxelFile || '/voxels.mjs'
        });
        this.renderer = options.renderer || createRenderer(options.renderOptions);
        const { camera, controls } = options.camera || createCamera(options.cameraOptions || {
            type: 'orbital',
            dom: this.renderer.domElement,
            aspectRatio: (window.innerWidth / window.innerHeight)
        });
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
                console.log('select', marker);
                /*if(marker.mesh.selectedOutline){
                    marker.mesh.selectedOutline.position.copy(marker.mesh.position);
                    scene.add(marker.mesh.selectedOutline);
                } //*/
            },
            onDeselect: (marker)=>{
                /*
                if(marker.mesh.selectedOutline){
                    console.log('deselect', marker);
                    scene.remove(marker.mesh.selectedOutline);
                } //*/
            },
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
        Object.keys(this.engine.submeshes).map((key)=>{
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
        this.scene.add(marker.model());
        tools((tool)=>{
            tool.axes(marker.position)
        });
    }
    
    focusOn(marker){
        this.engine.focusOn(marker);
    }
    
    async preload(markerTypes){
        const loadables = [];
        markerTypes.forEach((Type)=>{
            loadables.push(Type.preload());
        });
        await Promise.all(loadables);
        await this.engine.initialize();
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
            markers.forEach((model)=>{
                model.model();
                this.engine.markers.push(model);
                this.scene.add(model.mesh);
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