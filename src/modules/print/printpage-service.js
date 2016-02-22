angular.module('anol.print')

/**
 * @ngdoc object
 * @name anol.print.PrintPageServiceProvider
 */
.provider('PrintPageService', [function() {
    // Better move directive configuration in directive so
    // direcitve can be replaced by custom one?
    var _pageLayouts, _outputFormats, _defaultScale, _style, _availableScales;
    var _allowPageResize = true;

    /**
     * @ngdoc method
     * @name setPageSizes
     * @methodOf anol.print.PrintPageServiceProvider
     * @param {Array.<Object>} pageLayouts List of page sizes.
     * Each page size is an object, containing the following elements
     * - **id** - {string} - Unique page size id
     * - **label** - {string} - Label of defined page size. Will be displayed in html
     * - **icon** - {string} - Icon of defined page size
     * - **value** - {Array.<number>} - Height, width of defined page size
     */
    this.setPageLayouts = function(pageLayouts) {
        _pageLayouts = pageLayouts;
    };
    /**
     * @ngdoc method
     * @name setOutputFormats
     * @methodOf anol.print.PrintPageServiceProvider
     * @param {Array.<Object>} outputFormats List of available output formats
     * Each output format is an object, containing the following elements
     * - **label** - {string} - Label of defined output format. Will be displayed in html
     * - **value** - {string} - File format ending
     */
    this.setOutputFormats = function(outputFormats) {
        _outputFormats = outputFormats;
    };
    /**
     * @ngdoc method
     * @name setDefaultScale
     * @methodOf anol.print.PrintPageServiceProvider
     * @param {number} scale Initial scale
     */
    this.setDefaultScale = function(scale) {
        _defaultScale = scale;
    };
    /**
     * @ngdoc method
     * @name setAvailableScales
     * @methodOf anol.print.PrintPageServiceProvider
     * @param {Array.<number>} scales Available scales
     */
    this.setAvailableScales = function(scales) {
        _availableScales = scales;
    };
    /**
     * @ngdoc method
     * @name setStyle
     * @methodOf anol.print.PrintPageServiceProvider
     * @param {Object} ol3 style object
     * @description
     * Define styling of print page feature displayed in map
     */
    this.setStyle = function(style) {
        _style = style;
    };
    /**
     * @ngdoc method
     * @name setPageResize
     * @methodOf anol.print.PrintPageServiceProvider
     * @param {boolean} allowed Allow / disallow page resize in map
     * @description
     * Allow / disallow page resize in map
     */
     this.setPageResize = function(allowed) {
        _allowPageResize = allowed;
     };

    this.$get = ['$rootScope', 'MapService', 'LayersService', 'InteractionsService', function($rootScope, MapService, LayersService, InteractionsService) {
        /**
         * @ngdoc service
         * @name anol.print.PrintPageService
         * @requires $rootScope
         * @requires anol.map.MapService
         * @requires anol.map.LayersService
         * @requires anol.map.InteractionsService
         *
         * @description
         * Service for showing/hiding print area in map. It provides also the bbox of print area.
         */
        // var _modify;
        var _drag;
        var _printArea;
        var _cursorPointer;
        var _dragFeatures = {
            top: undefined,
            lefttop: undefined,
            left: undefined,
            leftbottom: undefined,
            bottom: undefined,
            rightbottom: undefined,
            right: undefined,
            righttop: undefined,
            center: undefined
        };
        var _modifyFeatures = new ol.Collection();

        var _printSource = new ol.source.Vector();
        // TODO use anol.layer.Feature
        var _printLayer = new ol.layer.Vector({
            source: _printSource
        });

        // TODO replace ol3 styling by anol.layerFeature styling
        if(_style) {
            _printLayer.setStyle(_style);
        }

        var layerOptions = {
            title: 'PrintLayer',
            displayInLayerswitcher: false,
            olLayer: _printLayer
        };

        LayersService.addLayer(new anol.layer.Layer(layerOptions));

        var CursorPointerInteraction = function(options) {
            ol.interaction.Pointer.call(this, {
                handleMoveEvent: CursorPointerInteraction.prototype.handleMoveEvent
            });
            this.cursor_ = 'pointer';
            this.previousCursor_ = undefined;

            this.features = options.features;
            this.layer = options.layer;
        };
        ol.inherits(CursorPointerInteraction, ol.interaction.Pointer);
        CursorPointerInteraction.prototype.handleMoveEvent = function(evt) {
            var self = this;
            if (self.cursor_) {
                var map = evt.map;
                var feature = map.forEachFeatureAtPixel(evt.pixel,
                    function(feature, layer) {
                        if(layer == self.layer && $.inArray(feature, self.faetures)) {
                            return feature;
                        }
                    });
                var element = evt.map.getTargetElement();
                if (feature) {
                  if (element.style.cursor != self.cursor_) {
                    self.previousCursor_ = element.style.cursor;
                    element.style.cursor = self.cursor_;
                  }
                } else if (self.previousCursor_ !== undefined) {
                  element.style.cursor = self.previousCursor_;
                  self.previousCursor_ = undefined;
                }
            }
        };

        var DragPrintPageInteraction = function(options) {
            ol.interaction.Pointer.call(this, {
                handleDownEvent: DragPrintPageInteraction.prototype.handleDownEvent,
                handleDragEvent: DragPrintPageInteraction.prototype.handleDragEvent,
                handleUpEvent: DragPrintPageInteraction.prototype.handleUpEvent
            });

            this.coordinate_ = null;
            this.feature_ = null;

            this.dragCallback = options.dragCallback;
            this.pageFeature = options.pageFeature;
            this.pageLayer = options.pageLayer;
        };
        ol.inherits(DragPrintPageInteraction, ol.interaction.Pointer);
        DragPrintPageInteraction.prototype.handleDownEvent = function(evt) {
            var self = this;
            var map = evt.map;
            var features = [];
            map.forEachFeatureAtPixel(evt.pixel,
                function(feature, layer) {
                    if(layer !== self.pageLayer) {
                        return;
                    }
                    features.push(feature);
                });

            if (features.length === 1 && features[0] === self.pageFeature) {
                this.coordinate_ = evt.coordinate;
                this.feature_ = self.pageFeature;
                return true;
            }

            return false;
        };
        DragPrintPageInteraction.prototype.handleDragEvent = function(evt) {
            var deltaX = evt.coordinate[0] - this.coordinate_[0];
            var deltaY = evt.coordinate[1] - this.coordinate_[1];
            var geometry = this.feature_.getGeometry();
            geometry.translate(deltaX, deltaY);
            this.coordinate_[0] = evt.coordinate[0];
            this.coordinate_[1] = evt.coordinate[1];
            if(this.dragCallback !== undefined) {
                this.dragCallback();
            }
        };
        DragPrintPageInteraction.prototype.handleUpEvent = function(evt) {
            this.coordinate_ = null;
            this.feature_ = null;
            return false;
        };

        /**
         * @ngdoc service
         * @name anol.print.PrintPageService
         *
         * @requires $rootScope
         * @requires MapService
         * @requires LayersService
         * @requires InteractionsService
         *
         * @description
         * Provides a rectabgular ol geometry representing a paper size.
         * Geometry can be moved or resized. With a given scale, the needed
         * paper size for selected area is calculated.
         *
         */
        var PrintPage = function(pageLayouts, outputFormats, defaultScale, availableScales, allowPageResize) {
            this.pageLayouts = pageLayouts;
            this.outputFormats = outputFormats;
            this.defaultScale = defaultScale;
            this.availableScales = availableScales;
            this.allowPageResize = allowPageResize;
            this.currentPageSize = undefined;
            this.currentScale = undefined;
        };
        /**
         * @ngdoc method
         * @name createPrintArea
         * @methodOf anol.print.PrintPageService
         *
         * @param {Array.<number>} pageSize Width, height of page in mm
         * @param {number} scale Map scale in printed output
         * @param {Array.<number>} center Center of print page. optional
         *
         * @description
         * Creates the print area geometry visible in map
         */
        PrintPage.prototype.createPrintArea = function(pageSize, scale) {
            this.currentPageSize = pageSize;
            this.currentScale = scale;
            this.mapWidth = this.currentPageSize[0] / 1000 * this.currentScale;
            this.mapHeight = this.currentPageSize[1] / 1000 * this.currentScale;

            var view = MapService.getMap().getView();
            var center = view.getCenter();
            var top = center[1] + (this.mapHeight / 2);
            var bottom = center[1] - (this.mapHeight / 2);
            var left = center[0] - (this.mapWidth / 2);
            var right = center[0] + (this.mapWidth / 2);

            _printSource.clear();
            _printArea = undefined;
            this.updatePrintArea(left, top, right, bottom);
            if(this.allowPageResize) {
                this.createDragFeatures(left, top, right, bottom, center);
            }
            this.createInteractions();
        };
        /**
         * @ngdoc method
         * @name removePrintArea
         * @methodOf anol.print.PrintPageService
         *
         * @description
         * Removes print area and all resize geometries
         */
        PrintPage.prototype.removePrintArea = function() {
            _printSource.clear();
            _printArea = undefined;
        };
        /**
         * @private
         * @name createDragFeatures
         * @methodOf anol.print.PrintPageService
         *
         * @param {number} left left coordinate
         * @prarm {number} top top coordinate
         * @param {number} right right coordinate
         * @param {number} bottom bottom coordinate
         * @param {Array.<number>} center center coordinates
         *
         * @description
         * Creates draggable points to modify print area
         */
        PrintPage.prototype.createDragFeatures = function(left, top, right, bottom, center) {
            var self = this;
            _modifyFeatures.clear();

            _dragFeatures.left = new ol.Feature(new ol.geom.Point([left, center[1]]));
            _dragFeatures.left.set('position', 'left');
            _dragFeatures.left.on('change', self.dragFeatureNormalChangeHandler, self);
            _modifyFeatures.push(_dragFeatures.left);

            _dragFeatures.right = new ol.Feature(new ol.geom.Point([right, center[1]]));
            _dragFeatures.right.set('position', 'right');
            _dragFeatures.right.on('change', self.dragFeatureNormalChangeHandler, self);
            _modifyFeatures.push(_dragFeatures.right);

            _dragFeatures.top = new ol.Feature(new ol.geom.Point([center[0], top]));
            _dragFeatures.top.set('position', 'top');
            _dragFeatures.top.on('change', self.dragFeatureNormalChangeHandler, self);
            _modifyFeatures.push(_dragFeatures.top);

            _dragFeatures.bottom = new ol.Feature(new ol.geom.Point([center[0], bottom]));
            _dragFeatures.bottom.set('position', 'bottom');
            _dragFeatures.bottom.on('change', self.dragFeatureNormalChangeHandler, self);
            _modifyFeatures.push(_dragFeatures.bottom);

            _dragFeatures.leftbottom = new ol.Feature(new ol.geom.Point([left, bottom]));
            _dragFeatures.leftbottom.set('position', 'leftbottom');
            _dragFeatures.leftbottom.on('change', self.dragFeatureDiagonalChangeHandler, self);
            _modifyFeatures.push(_dragFeatures.leftbottom);

            _dragFeatures.lefttop = new ol.Feature(new ol.geom.Point([left, top]));
            _dragFeatures.lefttop.set('position', 'lefttop');
            _dragFeatures.lefttop.on('change', self.dragFeatureDiagonalChangeHandler, self);
            _modifyFeatures.push(_dragFeatures.lefttop);

            _dragFeatures.rightbottom = new ol.Feature(new ol.geom.Point([right, bottom]));
            _dragFeatures.rightbottom.set('position', 'rightbottom');
            _dragFeatures.rightbottom.on('change', self.dragFeatureDiagonalChangeHandler, self);
            _modifyFeatures.push(_dragFeatures.rightbottom);

            _dragFeatures.righttop = new ol.Feature(new ol.geom.Point([right, top]));
            _dragFeatures.righttop.set('position', 'righttop');
            _dragFeatures.righttop.on('change', self.dragFeatureDiagonalChangeHandler, self);
            _modifyFeatures.push(_dragFeatures.righttop);

            _printSource.addFeatures(_modifyFeatures.getArray());
        };

        PrintPage.prototype.createInteractions = function() {
            var self = this;
            // if(_modify !== undefined) {
            //     InteractionsService.removeInteraction(_modify);
            // }
            if(_drag !== undefined) {
                InteractionsService.removeInteraction(_drag);
            }
            if(_cursorPointer !== undefined) {
                InteractionsService.removeInteraction(_cursorPointer);
            }
            // var modifyFeatures = new ol.Collection();
            // modifyFeatures.extend(_modifyFeatures);
            // modifyFeatures.push(_printArea);
            // var modifyOptions = {
            //     features: modifyFeatures,
            //     deleteCondition: function() {
            //         return false;
            //     }
            // };

            // if(_style !== undefined) {
            //     modifyOptions.style = _style;
            // }
            // _modify = new ol.interaction.Modify(modifyOptions);
            // _modify.on('modifyend', function() {
            //     self.updateDragFeatures();
            // });

            _drag = new DragPrintPageInteraction({
                dragCallback: function() {
                    self.updateDragFeatures();
                },
                pageFeature: _printArea,
                pageLayer: _printLayer
            });
            _cursorPointer = new CursorPointerInteraction({
                features: _modifyFeatures.getArray().concat(_printArea),
                layer: _printLayer
            });

            // InteractionsService.addInteraction(_modify);
            InteractionsService.addInteraction(_drag);
            InteractionsService.addInteraction(_cursorPointer);
        };
        /**
         * @private
         * @name updateDragFeatures
         * @methodOf anol.print.PrintPageService
         *
         * @param {Object} currentFeature dragged feature
         *
         * @description
         * Update draggable points after one points (currentFeature) was dragged
         */
        PrintPage.prototype.updateDragFeatures = function(currentFeature) {
            var self = this;
            // no need for update drag features if page cannot be resized in map
            if(!self.allowPageResize) {
                return;
            }
            var edgePoints = _printArea.getGeometry().getCoordinates()[0];
            var left = edgePoints[0][0];
            var right = edgePoints[1][0];
            var top = edgePoints[0][1];
            var bottom = edgePoints[2][1];
            var center = _printArea.getGeometry().getInteriorPoint().getCoordinates();

            var updateFeature = function(dragFeature, currentFeature, coords, handler) {
                // TODO remove modify when we can
                dragFeature.un('change', handler, self);
                if(dragFeature !== currentFeature) {
                    _modifyFeatures.remove(dragFeature);
                    dragFeature.getGeometry().setCoordinates(coords);
                    _modifyFeatures.push(dragFeature);
                }

                dragFeature.on('change', handler, self);
            };

            updateFeature(_dragFeatures.left, currentFeature, [left, center[1]], self.dragFeatureNormalChangeHandler);
            updateFeature(_dragFeatures.bottom, currentFeature, [center[0], bottom], self.dragFeatureNormalChangeHandler);
            updateFeature(_dragFeatures.right, currentFeature, [right, center[1]], self.dragFeatureNormalChangeHandler);
            updateFeature(_dragFeatures.top, currentFeature, [center[0], top], self.dragFeatureNormalChangeHandler);

            updateFeature(_dragFeatures.leftbottom, currentFeature, [left, bottom], self.dragFeatureDiagonalChangeHandler);
            updateFeature(_dragFeatures.rightbottom, currentFeature, [right, bottom], self.dragFeatureDiagonalChangeHandler);
            updateFeature(_dragFeatures.righttop, currentFeature, [right, top], self.dragFeatureDiagonalChangeHandler);
            updateFeature(_dragFeatures.lefttop, currentFeature, [left, top], self.dragFeatureDiagonalChangeHandler);
        };

        /**
         * @private
         * @name dragFeatureNormalChangeHandler
         * @methodOf anol.print.PrintPageService
         *
         * @param {Object} evt ol3 event
         *
         * @description
         * Perfroms actions for horizontal or vertical dragging
         */
        PrintPage.prototype.dragFeatureNormalChangeHandler = function(evt) {
            var currentFeature = evt.target;
            this.updatePrintAreaNormal();
            this.updateDragFeatures(currentFeature);
            this.updatePrintSize();
        };

        /**
         * @private
         * @name dragFeatureDiagonalChangeHandler
         * @methodOf anol.print.PrintPageService
         *
         * @param {Object} evt ol3 event
         *
         * @description
         * Perfroms actions for diagonal dragging
         */
        PrintPage.prototype.dragFeatureDiagonalChangeHandler = function(evt) {
            var currentFeature = evt.target;
            this.updatePrintAreaDiagonal(currentFeature);
            this.updateDragFeatures(currentFeature);
            this.updatePrintSize();
        };
        /**
         * @private
         * @name updatePrintAreaDiagonal
         * @methodOf anol.print.PrintPageService
         *
         * @param {Object} currentFeature dragged feature
         *
         * @description
         * Calculates print area bbox after diagonal dragging
         */
        PrintPage.prototype.updatePrintAreaDiagonal = function(currentFeature) {
            var lefttop, righttop, leftbottom, rightbottom;
            if(_dragFeatures.lefttop === currentFeature || _dragFeatures.rightbottom === currentFeature) {
                lefttop = _dragFeatures.lefttop.getGeometry().getCoordinates();
                rightbottom = _dragFeatures.rightbottom.getGeometry().getCoordinates();
                this.updatePrintArea(lefttop[0], lefttop[1], rightbottom[0], rightbottom[1]);
            } else {
                righttop = _dragFeatures.righttop.getGeometry().getCoordinates();
                leftbottom = _dragFeatures.leftbottom.getGeometry().getCoordinates();
                this.updatePrintArea(leftbottom[0], righttop[1], righttop[0], leftbottom[1]);
            }
        };
        /**
         * @private
         * @name updatePrintAreaNormal
         * @methodOf anol.print.PrintPageService
         *
         * @param {Object} currentFeature dragged feature
         *
         * @description
         * Calculates print area bbox after horizontal or vertical dragging
         */
        PrintPage.prototype.updatePrintAreaNormal = function() {
            var left = _dragFeatures.left.getGeometry().getCoordinates()[0];
            var right = _dragFeatures.right.getGeometry().getCoordinates()[0];
            var top = _dragFeatures.top.getGeometry().getCoordinates()[1];
            var bottom = _dragFeatures.bottom.getGeometry().getCoordinates()[1];

            this.updatePrintArea(left, top, right, bottom);
        };
        /**
         * @private
         * @name updatePrintAreaCenter
         * @methodOf anol.print.PrintPageService
         *
         * @param {Object} currentFeature dragged feature
         *
         * @description
         * Calculates print area bbox after center point was dragged
         */
        PrintPage.prototype.updatePrintAreaCenter = function(currentFeature) {
            var center = currentFeature.getGeometry().getCoordinates();
            var top = center[1] + (this.mapHeight / 2);
            var bottom = center[1] - (this.mapHeight / 2);
            var left = center[0] - (this.mapWidth / 2);
            var right = center[0] + (this.mapWidth / 2);
            this.updatePrintArea(left, top, right, bottom);
        };
        /**
         * @private
         * @name updatePrintArea
         * @methodOf anol.print.PrintPageService
         *
         * @param {number} left left coordinate
         * @param {number} top top coordinate
         * @param {number} right right coordinate
         * @param {number} bottom bottom coordinate
         *
         * @description
         * Updates print area geometry
         */
        PrintPage.prototype.updatePrintArea = function(left, top, right, bottom) {
            var coords = [[
                [left, top],
                [right, top],
                [right, bottom],
                [left, bottom],
                [left, top]
            ]];

            if(_printArea !== undefined) {
                _printArea.getGeometry().setCoordinates(coords);
            } else {
                _printArea = new ol.Feature(new ol.geom.Polygon(coords));
                _printSource.addFeatures([_printArea]);
            }
        };
        /**
         * @private
         * @name updatePrintSize
         * @methodOf anol.print.PrintPageService
         *
         * @description
         * Recalculate page size in mm
         */
        PrintPage.prototype.updatePrintSize = function() {
            var self = this;
            $rootScope.$apply(function() {
                self.mapWidth = _dragFeatures.right.getGeometry().getCoordinates()[0] - _dragFeatures.left.getGeometry().getCoordinates()[0];
                self.mapHeight = _dragFeatures.top.getGeometry().getCoordinates()[1] - _dragFeatures.bottom.getGeometry().getCoordinates()[1];
                self.currentPageSize = [
                    self.mapWidth * 1000 / self.currentScale,
                    self.mapHeight * 1000 / self.currentScale
                ];
            });
        };
        /**
         * @ngdoc method
         * @name addFeatureFromPageSize
         * @methodOf anol.print.PrintPageService
         *
         * @param {Array.<number>} pageSize Width, height of page in mm
         * @param {number} scale Map scale in printed output
         *
         * @description
         * Create or update print page geometry by given pageSize and scale
         */
        PrintPage.prototype.addFeatureFromPageSize = function(pageSize, scale) {
            if(pageSize === undefined || pageSize.length === 0 || scale === undefined) {
                return;
            }
            this.createPrintArea(pageSize, scale);
        };
        /**
         * @ngdoc method
         * @name getBounds
         * @methodOf anol.print.PrintPageService
         *
         * @returns {Array.<number>} Current bounds of area to print in map units
         *
         * @description
         * Returns the current print area bounds in map units
         */
        PrintPage.prototype.getBounds = function() {
            var bounds = [];
            bounds = _printArea.getGeometry().getExtent();
            return bounds;
        };
        /**
         * @ngdoc method
         * @name visible
         * @methodOf anol.print.PrintPageService
         *
         * @param {boolean} visibility Set page geometry visibility
         *
         * @description
         * Set visibility of print page geometry
         */
        PrintPage.prototype.visible = function(visibility) {
            _printLayer.setVisible(visibility);
        };

        return new PrintPage(_pageLayouts, _outputFormats, _defaultScale, _availableScales, _allowPageResize);
    }];
}]);
