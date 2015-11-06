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
        if(this.options.method === 'post') {
            $.post(self.url, self.getData(searchString))
                .success(function(response) {
                    var results = self.handleResponse(response);
                    deferred.resolve(results);
                });
        } else {
            $.get(self.getUrl(searchString))
                .success(function(response) {
                    var results = self.handleResponse(response);
                    deferred.resolve(results);
                });
        }
        return deferred.promise();
    },
    extractDisplayText: function() {
        throw 'Not implemented';
    },
    extractCoordinate: function() {
        throw 'Not implemented';
    },
    getUrl: function() {
        throw 'Not implemented';
    },
    getData: function(searchString) {
        return {
            search: searchString
        };
    }
};
