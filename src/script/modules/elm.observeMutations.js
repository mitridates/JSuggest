import disable from "./suggest.disable.js";
import enable from "./suggest.enable.js";
import { clearValues } from "./suggest.clear.js";
/**
 * Observe hidden field to enable/disable false input if required
 */
export default function observeMutations()
{
    let el= this.elms.src,
        that= this,
        nodeobserver= new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === "disabled") {
                    if(el.disabled){
                        disable.call(that);
                        clearValues.call(that);
                    }else{
                        enable.call(that);
                    }
                }
            });
        });
        
    nodeobserver.observe(el, {
        attributes: true
    });
}