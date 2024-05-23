import JSuggest from "../src/script/main.js";
import response from './organisations.json' assert { type: 'json' };

const testElm= document.querySelector('.testElement')
const testElm2= document.querySelector('.testElement2')
const orgsElm = document.querySelector('.orgsElement')

/**
* Fetch from local file
* JSuggest.(selector, {fetch:[JsonApiSpec])})
* JSuggest.(selector, {fetch:{data:[JsonApiSpec], filter:filterCallback, sortFn:sortFnCallback}})
*/
let jam = new JsonApiManager(response.data, response.included||null);
new JSuggest(testElm, {fetch:jam.getParsed()});
new JSuggest(testElm2, {fetch:jam.getParsed()});

jam.getParsed().forEach((spec)=>{
    let d= document.createElement('div');
    d.appendChild(document.createTextNode(spec.toString()));
    orgsElm.appendChild(d);
});
/**
* Fetch from file with fetch function
* JSuggest.(selector, {path:string)})
*
* fetch("./organisations.json")
* .then(response => response.json())
* .then(json => {
    let jam = new JsonApiManager(json.data, json.included||null);
    const testElm= document.querySelector('.testElement')
    let test= new JSuggest(testElm, {fetch:jam.getParsed()});

});
 */


/**
* Fetch from url
* JSuggest.(selector, {path:string)})
*/
//let test= new JSuggest(testElm, {path: '/cavern/public/index.php/api/json/autocomplete/organisation'});
//console.log(test.copy());
//console.log(test.focus());
//console.log(test);
//console.log(JSuggest.cache.get(testElm).focus());