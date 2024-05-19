import setup from "./modules/setup.js";
import bindEvents from "./modules/event.bindEvents.js";
import suggestCache from "./modules/cache.js";
import destroy from "./modules/suggest.destroy.js";
import focus from "./modules/suggest.focus.js";
import disable from "./modules/suggest.disable.js";
import enable from "./modules/suggest.enable.js";
import clearItems from "./modules/item.clearItems.js";
import {clearValues} from "./modules/suggest.clear.js";
import setValue from "./modules/suggest.setValue.js";
import update from "./modules/suggest.update.js";
import copy from "./modules/suggest.copy.js";
import paste from "./modules/suggest.paste.js";

/**
 * Create a suggest from request or from JSON file|inline data
 * @constructor
 * @param {String|Object} selector
 * @param {Object|null} config
 *  <script>
 * import response from './organisations.json' assert { type: 'json' };
 * 
 * //create a JsonApiManager instance from file
 * let jam = (new JsonApiManager(response.data, response.included||null)).getParsed();
 * 
 * 
 * const testElm= document.querySelector('.testElement')
 * 
 *  //create JSuggest instance with fetch argument
 *  let test= new JSuggest(testElm, {fetch:jam});
 *  
 * </script>

 */
export default function JSuggest (selector, opt)
{
    if (!(this instanceof JSuggest)) return new JSuggest(selector, opt)

    if(!setup.call(this, selector, opt)) return;
    bindEvents.call(this);
    suggestCache.addInstance(this.elms.src.dataset.randid, this);
}

JSuggest.prototype.destroy= function(){
    destroy.call(this); 
    return this
};

JSuggest.prototype.focus= function(){
    focus.bind(this); 
    return this
};
JSuggest.prototype.disable= function(){
    disable.call(this); 
    return this
};
JSuggest.prototype.enable= function(){
    enable.call(this); 
    return this
};
JSuggest.prototype.clearItems= function(){
    clearItems.call(this); 
    return this
};
JSuggest.prototype.clearValues= function(){
    clearValues.call(this); 
    return this
};
/**
 * @param {JsonApiSpec} spec
 */
JSuggest.prototype.setValue= function(spec){
    setValue.call(this, spec); 
    return this
};

JSuggest.prototype.update= function(){
    update.call(this); 
    return this
};

JSuggest.prototype.getInstance= function(){
    return cache.get(el)
};

JSuggest.prototype.getSource= function(){
    return this.elms.source;
};

JSuggest.cache= suggestCache;
JSuggest.copy= copy;
JSuggest.paste= paste;