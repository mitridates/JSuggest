/**
 * Filter static [JsonApiSpec] defined in options argument.
 * @param {string} text
 * @return {JsonApiManager}
  */
export function filter(config, text)
{
    let data,i,spec, 
    defaults={
        /**
         * @param {JsonApiSpec} a
         * @param {string} b
         */        
        filterCb: (spec, txt)=>{//true if found
        return spec.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,"").indexOf(txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,""))!==-1;
        },
        /**
        * @param {JsonApiSpec} a
        * @param {JsonApiSpec} b
        */
        sortCb: function(a, b) {
        return a.toString().localeCompare(b.toString());//ASC
        }
    };

    data= (function (f,d) {
            return {
                parsed: Array.isArray(f) ? [...f] : [...f.data],
                filterCb: f.hasOwnProperty('filterCb') ? f.filterCb:d.filterCb,
                sortCb: f.hasOwnProperty('sortCb') ? f.sortCb:d.sortCb
            };
      })(config.fetch, defaults)

      i=data.parsed.length;

    while (i--) {
        spec= data.parsed[i];
        if(!data.filterCb(data.parsed[i], text)) data.parsed.splice(i, 1);
    }

    data.parsed.sort(fetch.sortCb);   

    return data.parsed;
}