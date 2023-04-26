import {
    WebGLRenderer,
    BasicShadowMap
} from "three";

export const create = (options={})=>{
    if(options.dummy){
        return {
            setAnimationLoop : (loopHandler, interval=100)=>{
                setInterval(loopHandler, interval)
            },
            render : ()=>{
                
            }
        }
    }
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = BasicShadowMap;    
    return renderer;
}