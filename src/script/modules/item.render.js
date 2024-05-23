import JSuggestCache from "./cache.js";
import createElement from "./elm.createElement.js";
/**
 * @param {JsonApiSpec} spec
 * @param {int} index
 * @return {HTMLElement}
 */
export default function renderItem(spec, index) {
    let el,
        ret= spec.toString(),
        tpl= JSuggestCache.getTemplate(spec)    
    ;
    
    /**
     * @type {HTMLElement}
     */
    el= createElement('div', {
        idx: spec.get('id'),
        'data-index': index,
        tabIndex:-1
    })

    if(tpl){
        return tpl.getItem(el, index)
    }else{
        el.appendChild(document.createTextNode(ret))
        return el
    }
}