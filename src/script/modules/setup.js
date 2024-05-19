import {elms, setConfig, vars} from "./globals.js";
import wrapSourceElement from "./elm.wrapSourceElm.js";
import setFalseInput from "./elm.setFalseInput.js";
import syncAttributes from "./elm.syncAttributes.js";
import observeMutations from "./elm.observeMutations.js";

/**
 * @this {JSuggest}
 * @param {*} selector 
 * @param {*} opt 
 * @returns 
 */
export default function setup(selector, opt)
{
    let src= null;
    if ( !selector ) {
        throw new Error("You must supply either a HTMLInputElement, HTMLSelectElement or a CSS3 selector string.");
    } else if (typeof selector === 'string'){
        src = document.querySelector(selector)
    }else if ( selector.nodeType ){
        if(selector.getAttribute("data-jsuggest")){//already a jsuggest element
            return false;
        }
        src= selector
    }
    if (!src) throw new Error("JSuggest element not found.");
    if (!/^(?:input|select)$/i.test(src.nodeName.toLowerCase())) throw new Error("The element is not a HTMLInputElement or HTMLSelectElement.");
    src.setAttribute('data-randid', Math.random().toString(36).slice(2));
    this.config= setConfig(opt, src);
    
    this.vars=Object.assign({}, vars, {});
 /*    {
        req:null,
        isOpen:null,
        selected:null,
        keypressCounter:0,
        debounceTimer:undefined, 
        items:[]
    }; */

    this.elms= wrapSourceElement(src, this.config);

    setFalseInput(this.elms.falseInput, src);
    syncAttributes.call(this);
    observeMutations.call(this)
    return true;
}
