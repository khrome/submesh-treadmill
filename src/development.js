import Stats from 'stats.js';
import { Color, Scene, AxesHelper, Raycaster, Vector2, Vector3, LineBasicMaterial, BufferGeometry, Line, ArrowHelper } from 'three';

const kvs = {}

const kv = (name)=> kvs[name] || '';

const digits = (num, places)=>{
    let factor = 1;
    let lcv=0;
    for(;lcv < places; lcv++) factor = factor * 10;
    return Math.floor(num*factor)/factor;
}

export class DevelopmentTools{
    constructor(options={}){
        this.options = options;
        this.panes = {};
        this.stats = {};
    }
    
    value(ob, value){
        if(ob && typeof ob === 'object' && !value){
            const safeOb = ob || {};
            Object.keys(safeOb).forEach((key)=>{
                kvs[key] = safeOb[key];
            });
        }else{ //individual value
            if(arguments.length == 2){
                kvs[ob] = value;
            }
            return kvs[ob];
        }
    }
    
    showRay(origin, raycaster, scene){
        scene.remove ( this.arrow );
        this.arrow = new ArrowHelper(
            raycaster.ray.direction, 
            this.mesh.position, 
            100, 
            Math.random() * 0xffffff 
        );
        scene.add( this.arrow );
    }
    
    activateMeshTriangleSelection(container, renderer, scene, camera, treadmill){
        this.isSelectingTriangles = true;
        this.activateHoverInfo(container, renderer, scene, camera, treadmill);
    }
    
    activateHoverInfo(container, renderer, scene, camera, treadmill){
        container.addEventListener('mousemove', (event)=>{
            var raycaster = new Raycaster(); // create once
            var mouse = new Vector2(); // create once
            mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
            raycaster.setFromCamera( mouse, camera );
            var intersects = null;
            try{ //can't do this mid-load
                intersects = raycaster.intersectObjects( treadmill.activeSubmeshMeshes(), true );
            }catch(ex){}
            if(intersects && intersects[0]){
                if(this.isSelectingTriangles){
                    const geometry = intersects[0]?.object?.geometry;
                    if(geometry){
                        const offset = intersects[0].faceIndex * geometry.attributes.position.itemSize*3;
                        const face = Array.prototype.slice.call(geometry.attributes.position.array, offset, offset+3*3);
                        const submeshName = scene.treadmill.positionOfMesh(intersects[0].object);
                        const submesh = scene.treadmill.submesh(submeshName);
                        this.value({ 
                            face, 
                            submesh: submeshName,
                            submeshX: submesh.submeshX,
                            submeshY: submesh.submeshY,
                            submeshTreadmillX: Math.floor(submesh.mesh.position.x/16),
                            submeshTreadmillY: Math.floor(submesh.mesh.position.y/16)
                        });
                        selectTriangle(face, intersects[0], scene);
                        if(this.panes.mesh) this.panes.mesh.refresh();
                    }
                }
                if(this.isSelectingPoints){
                    this.value('point', intersects[0].point);
                    if(this.panes.mesh) this.panes.mesh.refresh();
                }
            }else{
                this.value('face', []);
                this.value('point', '');
            }
        });
    }
    
    activateMeshPointSelection(container, renderer, scene, camera, treadmill){
        this.isSelectingPoints = true;
        this.activateHoverInfo(container, renderer, scene, camera, treadmill);
    }
    
    tickStart(){
        const keys = Object.keys(this.stats);
        let lcv = 0;
        for(; lcv< keys.length; lcv++){
            if(this.stats[keys[lcv]].begin) this.stats[keys[lcv]].begin();
        }
    }
    
    tickStop(){
        const keys = Object.keys(this.stats);
        let lcv = 0;
        for(; lcv< keys.length; lcv++){
            if(this.stats[keys[lcv]].end) this.stats[keys[lcv]].end();
        }
    }
    
    show(type, container){
        const uncasedType = type.toLowerCase();
        let result = null;
        switch(uncasedType){
            case 'output':
            case 'latency':
            case 'overhead':
                result = createStats(uncasedType);
                this.stats[uncasedType] = result;
                break;
            case 'axis':
                result = createStats();
                this.stats[uncasedType] = result;
                break;
            case 'mesh':
                result = makeInfoPane('Mesh Info', {id: 'mesh_info'});
                result.refresh = ()=>{
                    result.clear().appendChild(createBox(uncasedType));
                }
                result.refresh();
                this.panes[uncasedType] = result;
                break;
        }
        console.log(`[${uncasedType}]>>>`, container, result);
        if(container && result){
            container.appendChild(result.dom);
            setHUDPositions(
                Object.keys(this.stats).map((key)=>this.stats[key]),
                Object.keys(this.panes).map((key)=>this.panes[key]),
            );
        }
        
        return result;
    }
    
    
}

const setHUDPositions = (statsArray, infoArray, side='right', orientation='top')=>{
    let infoOffset = 0;
    let x = 0;
    let y = 0;
    statsArray.forEach((stats, index)=>{
        if(index%2 === 0){
            infoOffset += 50;
            x = 0;
        }else{
            x += 80;
        }
        stats.dom.style.left = null;
        stats.dom.style.top = null;
        stats.dom.style[orientation] = `${y}px`;
        stats.dom.style[side] = `${x}px`;
        if(index%2 === 1){
            y += 50;
        }
    });
    x = 0;
    y = infoOffset;
    infoArray.forEach((infoPane)=>{
        infoPane.dom.style[orientation] = `${y}px`;
        infoPane.dom.style[side] = `${x}px`;
        y += infoPane.dom.style.height;
    })
};

const createAxisStats = (camera)=>{
    const scene = new Scene();
    var axesHelper = new AxesHelper( 5 );
    axesHelper.setColors('red', 'blue', 'green')
    scene.background = new Color(color);
};

const createStats = (type)=>{
    const existing = document.getElementById(type);
    if(existing) existing.parentNode.removeChild(existing);
    const stats = new Stats();
    // .showPanel(): 0: fps, 1: ms, 2: mb, 3+: custom
    stats.dom.setAttribute('id', type);
    switch(type){
        case'output': stats.showPanel(0); break;
        case'latency': stats.showPanel(1); break;
        case'overhead': stats.showPanel(2); break;
    }
    return stats;
};

const createBox = (type, target) => {
    switch(type){
        case 'mesh' : 
            const thisContent = document.createElement("div");
            const submeshName = document.createTextNode(
                `[${
                    kv('submeshX')
                }, ${
                    kv('submeshY')
                }] ${
                    kv('submesh')
                } (${
                    kv('submeshTreadmillX')
                }, ${
                    kv('submeshTreadmillY')
                })`
            );
            const safeFace = (kvs.face || '');
            const safeCoord = (start, stop)=>{
                return safeFace.slice(start,stop) &&
                safeFace
                .slice(start,stop)
                .concat(safeFace[stop]?Math.floor(safeFace[stop]*10000)/10000:'')
                .join(', ') || ''
            }
            const point = document.createTextNode(kvs.point?`${digits(kvs.point.x, 4)}, ${digits(kvs.point.y, 4)}`:'');
            const coord1 = document.createTextNode(safeCoord(0, 2));
            const coord2 = document.createTextNode(safeCoord(3, 5));
            const coord3 = document.createTextNode(safeCoord(6, 8));
            const bolded = document.createElement("b");
            bolded.appendChild(submeshName);
            thisContent.appendChild(bolded);
            thisContent.appendChild(document.createElement("br"));
            thisContent.appendChild(point);
            thisContent.appendChild(document.createElement("br"));
            thisContent.appendChild(coord1);
            thisContent.appendChild(document.createElement("br"));
            thisContent.appendChild(coord2);
            thisContent.appendChild(document.createElement("br"));
            thisContent.appendChild(coord3);
            if(target){}
            return thisContent;
            break;
    }
};

const makeInfoPane = (title, options={})=>{
    const devtoolsDiv = document.createElement("div");
    if(options.id){
        const existing = document.getElementById(options.id);
        if(existing) existing.parentNode.removeChild(existing);
        devtoolsDiv.setAttribute('id', options.id);
    }
    
    // and give it some content
    const subheading = document.createTextNode(title);
    const contentDiv = document.createElement("div");
    devtoolsDiv.appendChild(subheading);
    devtoolsDiv.appendChild(contentDiv);
    devtoolsDiv.style.display = 'block';
    devtoolsDiv.style.position = 'absolute';
    devtoolsDiv.style.fontSize = '10px';
    devtoolsDiv.style.color = '#FFDDDD';
    if(options.left){
        devtoolsDiv.style.left = options.left;
    }
    if(options.right){
        devtoolsDiv.style.right = options.right;
    }
    if(options.top){
        devtoolsDiv.style.top = options.top;
    }
    if(options.bottom){
        devtoolsDiv.style.bottom = options.bottom;
    }
    devtoolsDiv.style.width = '150px';
    devtoolsDiv.style.backgroundColor = '#991144';
    devtoolsDiv.style.opacity = 0.8;

    contentDiv.style.backgroundColor = '#BB4477';
    contentDiv.style.display = 'block';
    contentDiv.style.maxWidth = '140px';
    contentDiv.style.minHeight = '55px';
    contentDiv.style.marginLeft = '5px';
    contentDiv.style.border = '5px';
    contentDiv.style.marginBottom = '5px;';
    contentDiv.style.overflow = 'hidden';
    const result = { dom : devtoolsDiv };
    result.clear = ()=>{
        while (contentDiv.lastElementChild) {
            contentDiv.removeChild(contentDiv.lastElementChild);
        }
        return contentDiv;
    }
    devtoolsDiv.style.position = 'fixed'
    return result;
};

let selection = null;
const selectTriangle = (faces, intersection, scene)=>{
    if(selection) scene.remove(selection);
    const material = new LineBasicMaterial( { color: 0x0000ff } );
    const offset = intersection.object.position;
    const points = [
        new Vector3( offset.x+faces[0], offset.y+faces[1], faces[2]+0.01 ),
        new Vector3( offset.x+faces[3], offset.y+faces[4], faces[5]+0.01 ),
        new Vector3( offset.x+faces[6], offset.y+faces[7], faces[8]+0.01 ),
        new Vector3( offset.x+faces[0], offset.y+faces[1], faces[2]+0.01 )
    ];
    const geometry = new BufferGeometry().setFromPoints( points );
    const line = new Line( geometry, material );
    selection = line;
    scene.add( line );
}

const activateTriangleSelection = (container, renderer, scene, loop, camera)=>{
    container.addEventListener('mousemove', (event)=>{
        var raycaster = new Raycaster(); // create once
        var mouse = new Vector2(); // create once

        mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

        raycaster.setFromCamera( mouse, camera );
        var intersects = null;
        try{ //can't do this mid-load
            intersects = raycaster.intersectObjects( scene.treadmill.activeSubmeshMeshes(), true );
        }catch(ex){}
        if(intersects && intersects[0]){
            const geometry = intersects[0]?.object?.geometry;
            if(geometry){
                const offset = intersects[0].faceIndex * geometry.attributes.position.itemSize*3;
                const face = Array.prototype.slice.call(geometry.attributes.position.array, offset, offset+3*3);
                const submeshName = scene.treadmill.positionOfMesh(intersects[0].object);
                const submesh = scene.treadmill.submesh(submeshName);
                loop.devtools.setDevOutput('face', { 
                    face, 
                    submesh: submeshName,
                    submeshX: submesh.submeshX,
                    submeshY: submesh.submeshY,
                    submeshTreadmillX: Math.floor(submesh.mesh.position.x/16),
                    submeshTreadmillY: Math.floor(submesh.mesh.position.y/16)
                });
                selectTriangle(face, intersects[0], scene);
            }
        }else loop.devtools.setDevOutput('face', { face: []});
    });
}