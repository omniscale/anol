import BaseGeocoder from './base.js';

class Catalog extends BaseGeocoder {

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
        this.step = 0;
        this.isCatalog = true;
        this.CLASS_NAME = 'anol.geocoder.Catalog';
        this.RESULT_PROJECTION = 'EPSG:25832';
    }

    handleResponse(response) {
        var self = this;
        var results = [];
        $.each(response, function(idx, result) {
            results.push({
                displayText: self.extractDisplayText(result),
                wkt: result.geom,
                projectionCode: self.RESULT_PROJECTION,
                sml: result.sml,
                key: result.key,
            });
        });
        return results;
    }

    request(searchString) {
        var self = this;
        var deferred = $.Deferred();

        $.ajax({
            url: self.url,
            data: self.getData(searchString),
            method: self.options.method
        })
            .done(function(response) {
                var results = self.handleResponse(response);
                deferred.resolve(results);
                if (results.length !== 0 && self.step < self.options.steps.length) {
                    self.step++;
                }
            })
            .fail(function() {
                deferred.resolve([]);
            });
        return deferred.promise();
    }

    extractDisplayText(result) {
        return result.label;
    }

    getStep() {
        return this.options.steps[this.step];
    }

    hasNextStep() {
        if (this.step >= this.options.steps.length) {
            return false
        }
        return true;
    }
    
    getData(searchString) {
        var catalog = this.getStep(); 
        var data = {
            catalog: catalog,
            term: searchString
        };
        return data;
    }
}

export default Catalog;
