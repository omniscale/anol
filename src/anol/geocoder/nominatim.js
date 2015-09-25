anol.geocoder.Nominatim = function(_options) {
    var defaults = {
        url: 'http://nominatim.openstreetmap.org/search?format=json&q='
    };
    var options = $.extend({},
        defaults,
        _options
    );
    anol.geocoder.Base.call(this, options);
};
anol.geocoder.Nominatim.prototype = new anol.geocoder.Base();
$.extend(anol.geocoder.Nominatim.prototype, {
    CLASS_NAME: 'anol.geocoder.Nominatim',
    RESULT_PROJECTION: 'EPSG:4326',
    extractDisplayText: function(result) {
        return result.display_name;
    },
    extractCoordinate: function(result) {
        return [
            parseFloat(result.lon),
            parseFloat(result.lat)
        ];
    },
    getUrl: function(searchString) {
        return this.url + searchString;
    }
});
