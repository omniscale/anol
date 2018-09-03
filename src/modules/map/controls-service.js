import { defaults } from './module.js'
import { ClusterSelectService } from './cluster-select-service.js'

import { defaults as controlDefaults, Control } from 'ol/control'

angular.module('anol.map')

/**
 * @ngdoc object
 * @name anol.map.ControlsServiceProvider
 */
.provider('ControlsService', [function() {
    var _controls;

    /**
     * @ngdoc method
     * @name setControls
     * @methodOf anol.map.ControlsServiceProvider
     * @param {Array.<Object>} controls ol3 controls
     */
    this.setControls = function(controls) {
        _controls = controls;
    };

    this.$get = ['ClusterSelectService', 'MapService', function(ClusterSelectService) {
        /**
         * @ngdoc service
         * @name anol.map.ControlsService
         *
         * @description
         * Stores ol3 controls and add them to map, if map present
         */
        var Controls = function(controls) {
            var self = this;
            self.olControls = [];
            self.controls = [];
            self.exclusiveControls = [];
            self.subordinateControls = [];
            self.map = undefined;
            if(controls === undefined) {
                // Zoom-, Rotate and AttributionControls provided by corresponding directives
                var defaultControls = controlDefaults({
                    attribution: false,
                    zoom: false,
                    rotate: false
                });
                angular.forEach(defaultControls, function(olControl) {
                    self.olControls.push(olControl);
                    self.controls.push(new anol.control.Control({
                        olControl: olControl,
                        active: true
                    }));
                });
            }
            self.addControls(controls);
        };
        /**
         * @ngdoc method
         * @name registerMap
         * @methodOf anol.map.ControlsService
         * @param {Object} map ol3 map
         * @description
         * Register an ol3 map in `ControlsService`
         */
        Controls.prototype.registerMap = function(map) {
            var self = this;
            self.map = map;
            // get cluster select control from service. undefined when no clustered layer present
            var selectClusterControl = ClusterSelectService.getControl();
            if(selectClusterControl !== undefined) {
                self.addControl(selectClusterControl);
            }

            angular.forEach(self.olControls, function(control) {
                self.map.addControl(control);
            });
        };
        /**
         * @ngdoc method
         * @name addControl
         * @methodOf anol.map.ControlsService
         * @param {Object} control ol3 control
         * @description
         * Adds a single control
         */
        Controls.prototype.addControl = function(control) {
            if(this.map !== undefined && control.olControl instanceof Control) {
                this.map.addControl(control.olControl);
            }
            this.controls.push(control);
            if(control.olControl instanceof Control) {
                this.olControls.push(control.olControl);
            }
            if(control.exclusive === true) {
                control.onActivate(Controls.prototype.handleExclusiveControlActivate, this);
                this.exclusiveControls.push(control);
            }
            if(control.subordinate === true) {
                this.subordinateControls.push(control);
            }
        };
        /**
         * @ngdoc method
         * @name addControls
         * @methodOf anol.map.ControlsService
         * @param {Array.<Object>} controls ol3 controls
         * @description
         * Adds an array of controls
         */
        Controls.prototype.addControls = function(controls) {
            var self = this;
            angular.forEach(controls, function(control) {
                self.addControl(control);
            });
        };
        /**
         * @ngdoc method
         * @name removeControl
         * @methodOf anol.map.ControlsService
         * @param {Object} control ol3 control
         * @description
         * Remove a single control
         */
        Controls.prototype.removeControl = function(control) {
            var controlIdx = $.inArray(this.controls, control);
            var exclusiveIdx = $.inArray(this.exclusiveControls, control);
            var subordinateIdx = $.inArray(this.subordinateControls, control);
            if(controlIdx > -1) {
                this.controls.splice(controlIdx, 1);
            }
            if(exclusiveIdx > -1) {
                this.exclusiveControls.splice(exclusiveIdx, 1);
            }
            if(subordinateIdx > -1) {
                this.subordinateControls.splice(subordinateIdx, 1);
            }
            if(this.map !== undefined && control.olControl instanceof Control) {
                this.map.removeControl(control.olControl);
            }
        };
        /**
         * private function
         *
         * handler called on exclusiv control activate
         */
        Controls.prototype.handleExclusiveControlActivate = function(targetControl, context) {
            var self = context;
            angular.forEach(self.exclusiveControls, function(control) {
                if(control.active === true) {
                    if(control !== targetControl) {
                        control.deactivate();
                    }
                }
            });
            angular.forEach(self.subordinateControls, function(control) {
                if(control.active === true) {
                    control.deactivate();
                }
            });
            targetControl.oneDeactivate(Controls.prototype.handleExclusiveControlDeactivate, self);
        };
        /**
         * private function
         *
         * handler called on exclusiv control deactivate
         */
        Controls.prototype.handleExclusiveControlDeactivate = function(targetControl, context) {
            var self = context;
            angular.forEach(self.subordinateControls, function(control) {
                control.activate();
            });
        };
        return new Controls(_controls);
    }];
}]);
