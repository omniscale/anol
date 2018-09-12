import BaseGeocoder from './base.js';

class Solr extends BaseGeocoder {

    constructor(_options) {
        if(_options === undefined) {
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
    
    extractCoordinate(result) {
        var coordRegex = /POINT\((\d*\.?\d*) (\d*\.?\d*)\)/g;
        var match = coordRegex.exec(result.geom);
        var coordinate = [
            parseFloat(match[1]),
            parseFloat(match[2])
        ];
        return coordinate;
    }

    getData(searchString) {
        var data = {
            term: searchString
        };
        return data;
    }
}

export default Solr;
