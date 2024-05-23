import setSourceValue from "./elm.setSourceValue.js";
import JSuggestCache from "./cache.js";
import createElement from "./elm.createElement.js";
/**
 * @this {JSuggest} 
 * @param {JsonApiSpec} spec
 */
export default  function setValue(spec){

   if(!(spec instanceof JsonApiSpec)){
       throw new Error ('Invalid argument. expected instance of JsonApiSpec, got ' + typeof spec)
   }
   if(this.vars.selected!== spec) this.vars.selected= spec

    let tpl= JSuggestCache.getTemplate(spec).
        e= createElement(this.elms.falseInput,
        {
            value: spec.toString(),
            title: spec.toString() + '. ' + spec.id,
            idx: spec.id
        }
    );

    if(tpl){
       tpl.setInput(e)
   }

   setSourceValue.call(this, {id: spec.id, value: spec.toString()})
}

