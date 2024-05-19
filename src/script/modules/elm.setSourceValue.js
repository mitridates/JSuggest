/**
*
* @param {Object} data
* @this {JSuggest} 
*/
export default function setSourceValue(data){
   let src= this.elms.src,
   type = src.nodeName.toLowerCase()

   if(type === 'select'){
    src.length = 0
    src.appendChild(createElement('option', {
           value: data.id,
           text: data.value,
           selected: 'selected'
       }))
   }else if(type === 'input'){
       createElement(src, {
           value: data.id,
           title: data.value + '. ' + data.id
       })
   }
}
