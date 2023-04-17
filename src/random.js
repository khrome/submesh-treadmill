import * as rand from "seed-random";
var r = {};
r.seed = function(seed){
    return rand(seed);
};
const Random = function(seed){
  let rnd = rand(seed);
  return {random:()=>{
    return rnd()
  }}
}
export { Random };