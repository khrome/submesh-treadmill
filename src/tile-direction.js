const codirections = [
    ['northwest', 'north',   'northeast'],
    ['west',      'current', 'east'     ],
    ['southwest', 'south',   'southeast'] 
];

const neighbors = (location)=>{
    let x = -1;
    let y = -1;
    codirections.forEach((row, yIndex)=>{
        row.forEach((value, xIndex)=>{
            if(value === location){
                x = xIndex;
                y = yIndex;
            }
        });
    });
    if(x === -1 || y === -1) throw new Error('location not found: '+location)
    return {
        north: codirections[y-1] && codirections[y-1][x],
        south: codirections[y+1] && codirections[y+1][x],
        east: codirections[y][x+1],
        west: codirections[y][x-1],
    }
}

const direction = {
    current: { x: 0, y: 0 },

    north: {
        x: 0, y: 1,
        seam : 'bottom', seamTo : 'that'
    },
    south: {
        x: 0, y: -1,
        seam : 'top', seamTo : 'that'
    },
    east: {
        x: 1, y: 0,
        seam : 'left', seamTo : 'this'
    },
    west: {
        x: -1, y: 0,
        seam : 'right', seamTo : 'that'
    },

    northeast: { x:  1, y:  1 },
    northwest: { x: -1, y:  1 },
    southeast: { x: 1, y: -1 },
    southwest: { x:  -1, y: -1 }
};

export class Tile {
    static offset = direction;
    static neighbors = neighbors;
    static groups = codirections;
}