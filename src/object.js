export class MeshObject{
    constructor(options={}){
        this.options = options;
        this.actions = this.defineActions();
    }
    
    defineActions(){
        throw new Error('.defineActions() must be defined in any child class of MeshObject');
    }
    
    act(marker){
        
    }
    
}