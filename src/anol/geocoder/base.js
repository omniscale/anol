
class BaseGeocoder {

    constructor(_options) {
        if(angular.isUndefined(_options)) {
            return;
        }
        this.url = _options.url;
        this.options = _options;
        this.isCatalog = false;
        this.CLASS_NAME = 'anol.geocoder.Base';
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
            })
            .fail(function() {
                deferred.resolve([]);
            });
        return deferred.promise();
    }

    extractDisplayText() {
        throw 'Not implemented';
    }

    extractCoordinate() {
        throw 'Not implemented';
    }

    getData() {
        throw 'Not implemented';
    }
}

export default BaseGeocoder;
