import createElement from "./elm.createElement.js";
import clearItems from "./item.clearItems.js";

/**
 * Clear view and autocomplete state
 * @this {JSuggest}
 */
export function clearValues(){
    let src= this.elms.src;
    createElement(this.elms.falseInput, {
        value: '',
        title: '',
        idx: ''
    })
    if(src.nodeName.toLowerCase() ==='select'){
        src.options.length = 0
    }else{/**is input*/
    src.value = ''
    src.title= ''
    }
    clearItems.call(this)
}
