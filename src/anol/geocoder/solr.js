import BaseGeocoder from './base.js';

class Solr extends BaseGeocoder {

    constructor(_options) {
        if(angular.isUndefined(_options)) {
            super();
            return;
        }
        var defaults = {};
        var options = $.extend({},
            defaults,
            _options
        );        
        super(options);
        this.options = options;
        this.CLASS_NAME = 'anol.geocoder.Solr';
        this.RESULT_PROJECTION = 'EPSG:25832';
    }

    extractDisplayText(result) {
        return result.label;
    }
    
    getData(searchString) {
        var data = {
            term: searchString
        };
        return data;
    }
}

export default Solr;
