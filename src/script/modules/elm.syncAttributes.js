import clearItems from "./item.clearItems.js";
import disable from './suggest.disable.js';
import enable from './suggest.enable.js';
/**
 * Clear view and autocomplete state
 * @this {JSuggest}
 */
export default function syncAttributes() {
    let val,
    type= this.elms.src.nodeName.toLowerCase(),
    disabled= this.config.disabled= this.elms.src.disabled;

    if(type === 'select'){
        if(this.elms.src.selectedIndex>-1){
            val= this.elms.src[this.elms.src.selectedIndex].value
        }else{
            val = ''
        }
    }else{//type === 'input'
        val = this.elms.src.value
    }

    if(val===''){
        this.elms.falseInput.value = ''
    }

    if (disabled) {
        if (this.vars.isOpen) {
            clearItems.call(this);
        }
        disable.call(this);
    } else {
        enable.call(this);
    }
}