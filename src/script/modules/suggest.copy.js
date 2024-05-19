import suggestCache from "./cache.js";
/**
 * @param {HTMLInputElement|HTMLSelectElement} elm 
 * @param {HTMLInputElement|HTMLSelectElement} cp 
 * @returns void
 */
export default function copy (elm){
    let that=suggestCache.get(elm)

    if(!that) return;
    let val, id, spec,
        src= that.getSource(),
        type = src.nodeName.toLowerCase()

    if(type === 'select'){
        if(src.selectedIndex>-1){
            val= src[src.selectedIndex].innerHTML
            id= src[src.selectedIndex].value
        }else{
            val = ''
        }
    }else{//type === 'input'
        val = src.value
        id= src.value
    }
    if(val==='') return
    spec={
        id: id,
        attributes: {
            name: val
        },
        type: src.dataset.specType
    };
    sessionStorage.setItem(elm.name+'.spec', JSON.stringify(spec))
}