import l from "./event.listeners.js";
import {env} from "./globals.js";

/**
 * @this {JSuggest}
 */
export default function bindEvents() 
{
    let elms= this.elms,
        li={};
    for (let i in l) {
        li[i]= l[i].bind(this);
     }

    // add event handlers
    elms.container.addEventListener("focus", li.containerFocusListener);
    if(elms.hasOwnProperty('falseClear') && elms.falseClear) elms.falseClear.addEventListener("click", li.falseClearClickListener);
    elms.falseInput.addEventListener('search', li.falseClearClickListener);//nuevo
    elms.falseInput.addEventListener('focus', li.falseInputFocusListener);
    elms.falseInput.addEventListener('change', li.falseInputChangeListener)
    elms.realInput.addEventListener("keydown", li.realInputKeydownListener);
    elms.realInput.addEventListener(env.keyUpEventName, li.realInputKeyupListener);
    elms.realInput.addEventListener("blur", li.realInputBlurListener);
    elms.realInput.addEventListener("focus", li.realInputFocusListener);
    elms.container.addEventListener('focus', li.containerFocusListener)
    elms.container.addEventListener('containerMousedown', li.containerMousedownListener)
    
}