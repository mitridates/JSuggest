import JSuggestCache from  "./cache.js";
import createElement from "./elm.createElement.js";

/**
 * @param {JsonApiSpec} spec
 */
export default function setItemValue(spec) 
{
    let tpl, e, val,
    elms= this.elms,
    src= elms.src,
    vars= this.vars,
    type= src.nodeName.toLowerCase()
    ;

        if(!(spec instanceof JsonApiSpec)){
            throw new Error ('Invalid argument. expected instance of JsonApiSpec, got ' + typeof spec)
        }else{
            val= spec.toString();
        }

        if(vars.selected!== spec) vars.selected= spec

        tpl= JSuggestCache.getTemplate(spec)


        e= createElement(elms.falseInput, {
            value: val,
            title: val + '. ' + spec.id,
            idx: spec.id
        })

        if(tpl){
            tpl.setInput(e)
        }

        if(type === 'select'){
            src.length = 0
            src.appendChild(createElement('option', {
                value: spec.id,
                text: val,
                selected: 'selected'
            }))
        }else if(type === 'input'){
            createElement(src, {
                value: spec.id,
                title: val + '. ' + spec.id
            })
        }
    }