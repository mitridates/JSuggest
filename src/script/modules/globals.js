
let env=(function(ua){
    let isMobileDevice=  /Android|webOS|iPhone|iPad|BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile/i.test(ua),
    isMobileFirefox=  isMobileDevice &&  ua.indexOf("Firefox"),
    keyUpEventName = isMobileFirefox ? "input" : "keyup";
    return {
        ua:ua,
        isMobileDevice:isMobileDevice,
        isMobileFirefox:isMobileFirefox,
        keyUpEventName:keyUpEventName,   
    }
})(navigator.userAgent);

/**
 * @todo jsdoc
 * @var {JSON} vars
 * @var {JSuggest} vars.instance Current instance
 * @var {XMLHttpRequest|null} vars.req Current request if any
 * @var {boolean} vars.isOpen suggest is open
 * @var {int} vars.selected selected item
 * @var {int} vars.keypressCounter control redrawing autocomplete multiple times after the last key press
 * @var {function|undefined} vars.debounceTimer timeout
 * @var {array} vars.items timeout
 */
let vars={
    req:null,
    isOpen:null,
    selected:null,
    keypressCounter:0,
    debounceTimer:undefined, 
    items:[]
};

/**
 * @constant {Object} elms
 */
export let elms= {
    /** @prop {HTMLElement} */source:null,
    /** @prop {HTMLElement} */copy: null,
    /** @prop {HTMLElement} */parentNode: null,
    /** @prop {HTMLElement} */dropdown: null,
    /** @prop {HTMLElement} */falseInput: null,
    /** @prop {HTMLElement} */dropdowncontent: null,
    /** @prop {HTMLElement} */container: null,
    /** @prop {HTMLElement} */realInput: null,
    /** @prop {HTMLElement} */falseClear: null,
};

/**
 * @constant {Object} config
 */
export let config= {
    /**  Sets the width of the container */
    width: null,
    /**
     * Fetch static file, inline JSON Api array Object:  JSuggest(selector, {fetch: ...})<br>
     * @prop {JsonApiManager|JSON} fetch As JSON value: {data: JsonApiManager, filter:filterCallback|null, sortFn:sortFnCallback|}
     */
    fetch:null,
    /**
    * Fetch from url:
    * JSuggest.(selector, urlToFetchData)
    * JSuggest.(selector, {path: urlToFetchData, method: 'post'})
    */
    path: null,
    method: 'POST',
    debounceWaitMs: 300,
    minLen: 3,
    noResults: "No result found...",
    placeholder: '',
    searchPlaceholder: "minLength caracteres para buscar ...",
    showOnFocus: false,
    disabled: false,/**container is Enabled/disabled*/
};

/**
 * @param {JSON|null} opt 
 * @param {HTMLInputElement|HTMLSelectElement} src 
 */
export function setConfig(opt, src) {
    let key, found, ret={};

    for(key in config){//config in argguments || dataset
        ret[key]= config[key];
        if((found = src.getAttribute('data-'+key))){
            ret[key]= found;
        }
        if(opt && opt.hasOwnProperty(key)) ret[key]= opt[key];
    }
    return ret;
}

export {vars, env};