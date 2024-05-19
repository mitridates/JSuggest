import suggestCache from "./cache.js";
/**
 * @param {HTMLInputElement|HTMLSelectElement} elm 
 * @param {HTMLInputElement|HTMLSelectElement} cp 
 * @returns void
 */
export default function paste (elm){
        let
        spec= sessionStorage.getItem(elm.name+'.spec'),
        that=suggestCache.get(elm),
        jas
    ;
    if(spec && that){
        jas= new JsonApiSpec(JSON.parse(spec))
        jas.toString= ()=> jas.attributes.name;
        that.setValue(new JsonApiSpec(JSON.parse(spec)))
    }
}