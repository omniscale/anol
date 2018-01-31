anol.geocoder.Base = function(_options) {
    if(_options === undefined) {
        return;
    }
    this.url = _options.url;
    this.options = _options;
};

anol.geocoder.Base.prototype = {
    CLASS_NAME: 'anol.geocoder.Base',
    handleResponse: function(response) {
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
    },
    request: function(searchString) {
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
    },
    extractDisplayText: function() {
        throw 'Not implemented';
    },
    extractCoordinate: function() {
        throw 'Not implemented';
    },
    getData: function() {
        throw 'Not implemented';
    }
};
