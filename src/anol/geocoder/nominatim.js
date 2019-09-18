/**
 * @ngdoc object
 * @name anol.geocoder.Nominatim
 *
 * @param {Object} options Options
 * @param {string} options.url Url of nominatim geocoder. Default 'http://nominatim.openstreetmap.org/search?'
 * @param {Array} options.viewbox Box to restrict search to
 *
 * @description
 * Nominatim geocoder. See http://wiki.openstreetmap.org/wiki/Nominatim
 */

import BaseGeocoder from './base.js';

class Nominatim extends BaseGeocoder {

    constructor(_options) {
        if(angular.isUndefined(_options)) {
            super();
            return;
        }
        _options.url = 'http://nominatim.openstreetmap.org/search?';
        super(_options);
        this.options = _options;
        this.CLASS_NAME = 'anol.geocoder.Nominatim';
        this.RESULT_PROJECTION = 'EPSG:4326';
    }

    extractDisplayText(result) {
        return result.display_name;
    }

    getData(searchString) {
        var data = {
            q: searchString,
            format: 'json',
            limit: angular.isDefined(this.options.limit) ? this.options.limit : 10
        };
        if(angular.isDefined(this.options.key)) {
            data.key = this.options.key;
        }
        if(angular.isDefined(this.options.viewbox)) {
            data.bounded = 1;
            data.viewbox = this.options.viewbox.join(',');
        }
        return data;
    }
}

export default Nominatim;
