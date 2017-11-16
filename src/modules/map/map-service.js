angular.module('anol.map')

 /**
 * @ngdoc object
 * @name anol.map.MapServiceProvider
 *
 * @description
 * MapService handles ol3 map creation including adding interactions, controls and layers to it.
 *
 * The ol.View is added with the provider method addView
 * It will only create one instance of an ol map
 */
.provider('MapService', [function() {
    var _view, _bbox;
    var _cursorPointerConditions = [];
    var _twoFingersPinchDrag = false;
    var _twoFingersPinchDragText = 'Use two fingers to move the map';
    /**
     * @ngdoc method
     * @name addView
     * @methodOf anol.map.MapServiceProvider
     *
     * @param {ol.View} view ol3 view object
     *
     * @description
     * Set the map view
     */
    this.addView = function(view) {
        _view = view;
    };

    /**
     * @ngdoc method
     * @name setInitialBBox
     * @methodOf anol.map.MapServiceProvider
     *
     * @param {ol.Extent} bbox Initial bbox
     *
     * @description
     * Set initial bbox
     */
    this.setInitialBBox = function(bbox) {
        _bbox = bbox;
    };

    /**
     * @ngdoc method
     * @name addCursorPointerCondition
     * @methodOf anol.map.MapServiceProvider
     *
     * @param {function} conditionFunc Function called on ol3 map pointermove event
     *
     * @description
     * Adds function to list of called functions on ol3 map pointermove event.
     * Function must return boolean. When true, cursor is changed to pointer
     */
    this.addCursorPointerCondition = function(conditionFunc) {
        _cursorPointerConditions.push(conditionFunc);
    };

    this.setTwoFingersPinchDrag = function(enabled) {
        _twoFingersPinchDrag = enabled;
    };

    this.setTwoFingersPinchDragText = function(text) {
        _twoFingersPinchDragText = text;
    }

    this.$get = [function() {
        /**
         * @ngdoc service
         * @name anol.map.MapService
         *
         * @requires anol.map.LayersService
         * @requires anol.map.ControlsService
         * @requires anol.map.InteractionsService
         *
         * @description
         * MapService handles ol3 map creation including adding interactions, controls and layers to it.
         *
         * The ol.View is added with the provider method addView
         * It will only create one instance of an ol map
         */
        var MapService = function(view, cursorPointerConditions, twoFingersPinchDrag, twoFingersPinchDragText) {
            this.view = view;
            this.map = undefined;
            this.hasTouch = ol.has.TOUCH;
            this.cursorPointerConditions = cursorPointerConditions;
            this.twoFingersPinchDrag = twoFingersPinchDrag;
            this.twoFingersPinchDragText = twoFingersPinchDragText;
        };
        /**
         * @ngdoc method
         * @name getMap
         * @methodOf anol.map.MapService
         *
         * @returns {Object} ol.Map
         *
         * @description
         * Get the current ol map. If not previosly requested, a new map
         * is created.
         */
        MapService.prototype.getMap = function() {
            if(angular.isUndefined(this.map)) {
                this.map = new ol.Map(angular.extend({}, {
                    logo: false,
                    controls: [],
                    interactions: [],
                    layers: []
                }));
                this.map.setView(this.view);
                if(angular.isDefined(_bbox)) {
                    this.map.once('change:target', function() {
                        this.map.getView().fit(_bbox, this.map.getSize());
                    });
                }
                if(this.cursorPointerConditions.length > 0) {
                    this.map.on('pointermove', this._changeCursorToPointer, this);
                }
            }
            return this.map;
        };
        /**
         * @private
         *
         * ol3 map pointermove event callback
         */
        MapService.prototype._changeCursorToPointer = function(evt) {
            var self = this;
            var pixel = self.map.getEventPixel(evt.originalEvent);
            var hit = false;
            angular.forEach(self.cursorPointerConditions, function(conditionFunc) {
                if(hit === true) {
                    return;
                }
                hit = conditionFunc(pixel);
            });
            self.map.getTarget().style.cursor = hit ? 'pointer' : '';
        };
        /**
         * @ngdoc method
         * @name addCursorPointerCondition
         * @methodOf anol.map.MapService
         *
         * @param {function} conditionFunc Function called on ol3 map pointermove event
         *
         * @description
         * Adds function to list of called functions on ol3 map pointermove event.
         * Function must return boolean. When true, cursor is changed to pointer
         */
        MapService.prototype.addCursorPointerCondition = function(conditionFunc) {
            var idx = this.cursorPointerConditions.indexOf(conditionFunc);
            if(idx !== -1) {
                return;
            }
            this.cursorPointerConditions.push(conditionFunc);
            if(this.cursorPointerConditions.length === 1) {
                this.map.on('pointermove', this._changeCursorToPointer, this);
            }
        };
        /**
         * @ngdoc method
         * @name removeCursorPointerCondition
         * @methodOf anol.map.MapService
         *
         * @param {function} conditionFunc Function to remove
         *
         * @description
         * Removes given function from list of called functions on ol3 map pointermove event
         */
        MapService.prototype.removeCursorPointerCondition = function(conditionFunc) {
            var idx = this.cursorPointerConditions.indexOf(conditionFunc);
            if(idx === -1) {
                return;
            }
            this.cursorPointerConditions.splice(idx, 1);
            if(this.cursorPointerConditions.length === 0) {
                this.map.un('pointermove', this._changeCursorToPointer, this);
            }
        };
        return new MapService(_view, _cursorPointerConditions, _twoFingersPinchDrag, _twoFingersPinchDragText);
    }];
}]);
