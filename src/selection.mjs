import { 
    Scene,
    PlaneGeometry,
    Raycaster,
    Mesh,
    Vector2,
    Color,
    MeshPhongMaterial
} from 'three';

const firstNodeWithGeometryInTree = (node)=>{
    let currentNode = node;
    while(currentNode && !currentNode.geometry){
        currentNode = currentNode.children[0];
    }
    return currentNode;
};

export const enableSelection = ({ 
    container, 
    camera, 
    renderer, 
    treadmill, 
    onSelect,
    onDeselect,
    onMouseOver,
    onMouseAway,
    isSelectable,
    markerTypes=[] 
})=>{
    let selected = [];
    const metalist = ['Shift', 'Control', 'Alt', 'Meta'];
    const meta = {};
    let selectionModel = {
        add : (marker)=>{
            if(selected.indexOf(marker) === -1){
                selected.push(marker);
                if(onSelect) onSelect(marker);
            }
        },
        remove : (marker)=>{
            let index = null;
            if((index = selected.indexOf(marker)) !== -1){
                selected.splice(index, 1);
                if(onDeselect) onDeselect(marker);
            }
        },
        clear : ()=>{
            while(selected.length) selectionModel.remove(selected[selected.length-1]);
        },
        all : (action)=>{
            //todo: support object actions, which are actual marker actions
            selected.forEach(action);
        },
        contains : (marker)=>{
            selected.indexOf(marker) !== -1;
        },
        items : ()=>{
            return selected;
        }
    };
    container.addEventListener('keydown', (event)=>{
        const metaIndex = metalist.indexOf(event.code.replace('Left', '').replace('Right', ''));
        if(metaIndex !== -1){
            meta[metalist[metaIndex].toLowerCase()] = true;
        }
    });
    container.addEventListener('keyup', (event)=>{
        const metaIndex = metalist.indexOf(event.code.replace('Left', '').replace('Right', ''));
        if(metaIndex !== -1){
            meta[metalist[metaIndex].toLowerCase()] = false;
        }
    });
    let mousedMarker = null;
    container.addEventListener('mousemove', ()=>{
        var raycaster = new Raycaster(); // create once
        var mouse = new Vector2(); // create once
        mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        var intersects = null;
        try{ //can't do this mid-load
            // todo: optionally support markers, filtered by type
            console.log('M?', treadmill.engine.markers)
            intersects = raycaster.intersectObjects( 
                treadmill.engine.markers.map((marker)=>marker.mesh), 
                true 
            );
        }catch(ex){console.log(ex) }
        /*if(lastOutline){
            treadmill.scene.remove(lastOutline);
        }*/
        if(intersects && intersects[0]){
            const submeshes = treadmill.activeSubmeshes();
            const markers = treadmill.engine.markers;
            const foundMarker = markers.find((marker)=>{
                return marker.mesh === intersects[0].object
                || firstNodeWithGeometryInTree(marker.mesh) === intersects[0].object
            });
            if(foundMarker){
                if(foundMarker !== mousedMarker){
                    if(mousedMarker) onMouseAway(mousedMarker);
                    mousedMarker = foundMarker;
                    if(onMouseOver) onMouseOver(foundMarker);
                }
                //foundMarker.object.selectedOutline.position.copy(foundMarker.mesh.position);
                //treadmill.scene.add(foundMarker.object.selectedOutline);
                //lastOutline = foundMarker.object.selectedOutline;
            }else{
                if(mousedMarker){
                    if(onMouseAway) onMouseAway(mousedMarker)
                    mousedMarker = null;
                }
            }
        }else{
            if(mousedMarker){
                if(onMouseAway) onMouseAway(mousedMarker)
                mousedMarker = null;
            }
        }
    });
    const clickHandler = (event)=>{
        var raycaster = new Raycaster(); // create once
        var mouse = new Vector2(); // create once
    
        mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
        //console.log(meta, event);
        
        raycaster.setFromCamera( mouse, camera );
        const submeshes = treadmill.activeSubmeshes();
        const markers = treadmill.engine.markers;
        var intersects = null;
        try{ //can't do this mid-load
            //todo: optionally support markers, filtered by type
            intersects = raycaster.intersectObjects( 
                submeshes.map((submesh)=> submesh.mesh ).concat(markers.map((marker)=> marker.mesh )), 
                true 
            );
        }catch(ex){}
        console.log('I', intersects, markers)
        if(intersects && intersects[0]){
            const foundSubmesh = submeshes.find((submesh)=>{ return submesh.mesh == intersects[0].object});
            const foundMarker = markers.find((marker)=>{ return firstNodeWithGeometryInTree(marker.mesh) == intersects[0].object});
            if(event.type === 'contextmenu'){
                const point = intersects[0].point;
                const worldPoint = treadmill.worldPointFor(point);
                if(foundSubmesh){ // target a spot on the ground
                    selectionModel.all((marker)=>{
                        const markerPoint = marker.mesh.position;
                        const markerWorldPoint = treadmill.worldPointFor(marker.mesh.position);
                        if(window.tools){
                            window.tools.showPoint(point, 'local-action', '#FF0000');
                            window.tools.showPoint(worldPoint, 'world-action', '#990000');
                        }
                        if(!meta.shift){
                            marker.doing = [];
                        }
                        if(meta.alt){
                           marker.action(2, worldPoint, {}, treadmill);
                        }else{
                           marker.action(1, worldPoint, {}, treadmill);
                        }
                    });
                }
                if(foundMarker){ //target another marker
                    console.log('attack marker');
                    selectionModel.all((marker)=>{
                        const doing = marker.doing;
                        marker.doing = [];
                        if(meta.alt){
                            marker.action(2, worldPoint, {}, treadmill);
                        }else{
                            marker.action(1, worldPoint, {}, treadmill);
                        }
                        marker.doing = marker.doing.concat(doing);
                    });
                }
            }else{
                const point = intersects[0].point; //position in scene from central mesh origin
                const worldPoint = treadmill.worldPointFor(point); //absolute position
                const localPoint = treadmill.submeshPointFor(worldPoint); //position in submesh it targets
                const sb = treadmill.submeshAt(point.x, point.y);
                if(
                    foundSubmesh &&
                    (
                       (
                           isSelectable && isSelectable(sb, point, worldPoint, localPoint)
                       ) || !isSelectable
                    )
                ){
                    selectionModel.all((marker)=>{
                        const markerPoint = marker.mesh.position;
                        const markerWorldPoint = treadmill.worldPointFor(marker.mesh.position);
                        if(window.tools){
                            window.tools.showPoint(point, 'local', '#FF0000');
                            window.tools.showPoint(worldPoint, 'world', '#990000');
                        }
                        if(!meta.shift){
                            marker.doing = [];
                        }
                        marker.action('moveTo', worldPoint, {}, treadmill);
                        //marker.action('pathTo', worldPoint, {}, treadmill);
                    });
                }
                if(foundMarker){
                    if(!meta.shift) selectionModel.clear();
                    selectionModel.add(foundMarker)
                    //selected = [foundMarker];
                }
            }
        }
    };
    container.addEventListener('click', clickHandler);
    container.addEventListener('contextmenu', clickHandler);
    return selectionModel;
}