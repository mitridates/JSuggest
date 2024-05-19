
//#####    Singleton     ####
/**
 *  Add && set JsonApiSpec instances
 */
export default (function() {
    let
        cache= this,
        instances = {},
        templates={};

    /**
     * Save JSuggest instance by HTMLFormElement id 
     * @param {string} id HTMLFormElement data-randid
     * @param {JSuggest} ins instance
     */
    function addInstance(id, ins){
        instances[id]= ins
    }

    /**
     * Add JsonApiSpec template to render item toString
     * @param {string} type
     * @param {CallableFunction} callback
     */
    function addTemplate(type, callback){
        templates[type]= callback
        return cache
    }

    /**
     * Get JsonApiSpec template if exists, else, use default toString method
     * @param {JsonApiSpec} spec
     * @return {JSuggestFormatter|null}
     */
    function getTemplate(spec){
        return (templates.hasOwnProperty(spec.type)) ? new templates[spec.type](spec) : null;
    }

    /**
     * Get JSuggest instance from HTMLFormElement (input|select) if exits
     * @param {string|HTMLFormElement} e
     * @return {null|JSuggest}
     */
    function getInstance(e)
    {
        let elm

        if(!e) return null

        if(typeof e === "string")
        {
            return instances.hasOwnProperty(e)? instances[e] : null
        }
        else if(e.nodeType)
        {
            if(e.classList.contains('jsuggest-false-input')){
                elm= e.parentNode.parentNode.querySelector('[data-jsuggest]')
            }else if(e.dataset.jsuggest)
            {
                elm= e
            }
            if(elm){
                return getInstance(elm.dataset.randid)
            }
        }
        return null
    }
    return { // public interface
        addInstance: addInstance,
        getInstance: getInstance,
        addTemplate: addTemplate,
        getTemplate: getTemplate
    };
})();
