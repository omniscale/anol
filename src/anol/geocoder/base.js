
class BaseGeocoder {

    constructor(_options) {
        if(_options === undefined) {
            return;
        }
        this.url = _options.url;
        this.options = _options;
        this.CLASS_NAME = 'anol.geocoder.Base';
    }

    handleResponse(response) {
        var self = this;
        var results = [];
        $.each(response, function(idx, result) {
            results.push({
                displayText: self.extractDisplayText(result),
                coordinate: self.extractCoordinate(result),
                projectionCode: self.RESULT_PROJECTION
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
