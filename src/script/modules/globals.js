
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
 * @var {bool} vars.isOpen suggest is open
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
export const elms= {
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
export const config= {
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
    // maxHeight: 180,
    noResults: "No result found...",
    placeholder: '',
    searchPlaceholder: "minLength caracteres para buscar ...",
    showOnFocus: false,
    /**show empty msg or nothing*/
    //showNoResultMsg: true,//@todo
    /** Enables/ disables the container */
    disabled: false,
};

/**
 * @param {JSON|null} opt 
 * @param {HTMLInputElement|HTMLSelectElement} src 
 */
export function setConfig(opt, src) {
    let key, found; 

    //config in argguments || dataset
    for(key in config){
        if((found = src.getAttribute('data-'+key))){
            config[key]= found
        }
        if(opt && opt.hasOwnProperty(key)) config[key]= opt[key]
    }
    return config;
}

export {vars, env};