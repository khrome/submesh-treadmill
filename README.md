submesh-treadmill
=================

[ ![image](https://raw.githubusercontent.com/khrome/submesh-treadmill/master/img/demo.png) ](https://khrome.github.io/submesh-treadmill/)

This is a 3D treadmill built in [Three.js](https://www.npmjs.com/package/three) for navigating through scenes much larger than can fit into memory, it could be used to visualize maps, make a game or visualize a simulation which is compatible with off the shelf physics systems([CANNON.js](https://www.npmjs.com/package/cannon-es)). It also supports (but does not require) browser native modules.

At it's core, it's a tiling engine that keeps the target marker centered in the "current" tile and shifts (and loads) tiles as the user exits out of this region. In this way all you need to do is build a loading interface which loads a tile and it's corresponding markers and the treadmill manages the scene for you. If you choose to build these tiles generatively, in an unbounded context, this should work until the coordinate system goes out of range (in a future update this will change so that the max bounds is the submesh addresses going out of range). Lifecycle events are also coming soon.

| northeast | north     | northwest |
|-----------|-----------|-----------|
| east      | current   | west      |
| southeast | south     | southwest |         

Usage
-----

A simple example would look like:

```javascript
    class SimpleSubmesh extends Submesh{
        constructor(geometry, tilePosition, options={}){
            super(geometry, tilePosition, options);
        }
        createMarkers(){
            return [];
        }
    }
    const treadmill = new Treadmill({
        createSubmesh: (x, y)=>{
            const geometry = new PlaneGeometry( 
                tileSize, tileSize, 
                tileSize, tileSize 
            );
            //reorient to origin @ ll corner
            geometry.translate( tileSize/2, tileSize/2, 0 );
            return new SimpleSubmesh(geometry, new Vector2(x, y), {
                onMarkerExit : (marker, submesh, direction)=>{
                    //when markers leave, check their submesh
                    const newSubmesh = treadmill.submeshAt(
                        marker.mesh.position.x, 
                        marker.mesh.position.y
                    );
                    if(newSubmesh) newSubmesh.markers.push(marker);
                    else threeJsScene.remove(marker.mesh);
                    if(marker.linked && marker.linked[0] === threeJsCamera){
                        //if camera linked marker exits, move treadmill
                        treadmill.moveDirection(direction);
                    };
                }
            });
        },
        x:2, y:2 //centered submesh
    }, threeJsScene);
    // setup lights, camera, skybox, etc here
    // show loading here
    await treadmill.loaded;
    // reveal game here
    renderer.setAnimationLoop(() => {
        const delta = threeJsClock.getDelta();
        treadmill.tick(delta);
        //update other game objects
    }, 100);
    
    //later: shift the treadmill 1 tile northward
    treadmill.moveDirection('north');
```

more docs on markers and mesh-objects will come later

Testing
-------

![image](https://raw.githubusercontent.com/khrome/submesh-treadmill/master/img/test.png)

Run the tests headless.
```bash
npm run test
```
to run the same test inside the browser:

```bash
npm run browser-test
```
to run the same test headless inside docker:

```bash
npm run container-test
```