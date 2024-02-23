import { Marker } from '../submesh-treadmill.mjs';
export const voxels = (x, y, depth, options={})=>{ 
    const results = [];
    for(let lcv=0; lcv<256; lcv++){
        results.push(0.001);
    }
    return results;
};

const randomId = ()=>{
    return Math.floor(Math.random() * 100000000000).toString();
}

export const markers = (x, y, depth, options={})=>{
    const markers = [];
    const xDigits = Math.abs(x).toString().split('').map((chr)=>parseInt(chr));
    const yDigits = Math.abs(y).toString().split('').map((chr)=>parseInt(chr));
    let yPos = 2;
    let xPos = 2;
    for(let position = 0; position < xDigits.length; position++){
        xPos = 2;
        for(let count = 0; count < xDigits[position]; count++){
            markers.push(new Marker({
                id : randomId(),
                meshAttached: true,
                x: xPos,
                y: yPos,
                values: {
                    movementSpeed: 5
                }
            }));
            xPos += 2;
        }
        yPos += 2;
    }
    yPos += 2;
    for(let position = 0; position < yDigits.length; position++){
        xPos = 2;
        for(let count = 0; count < yDigits[position]; count++){
            markers.push(new Marker({
                id : randomId(),
                meshAttached: true,
                x: xPos,
                y: yPos,
                values: {
                    movementSpeed: 5
                }
            }));
            xPos += 2;
        }
        yPos += 2;
    }
    return markers;
};

export const scripts = (x, y, depth, options={})=>{
    const scripts = {};
    return scripts;
};