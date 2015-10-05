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

    this.$get = [function() {
        /**
         * @ngdoc service
         * @name anol.map.ControlsService
         *
         * @description
         * Stores ol3 controls and add them to map, if map present
         */
        var Controls = function(controls) {
            var self = this;
            self.controls = [];
            self.exclusiveControls = [];
            self.map = undefined;
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
            this.map = map;
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
            if(this.map !== undefined) {
                this.map.addControl(control.olControl);
            }
            this.controls.push(control);
            if(control.exclusive === true) {
                control.onActivate(Controls.prototype.handleExclusiveControlActivate, this);
                this.exclusiveControls.push(control);
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
            if(this.map !== undefined) {
                angular.forEach(controls, function(control) {
                    self.addControl(control);
                });
            }
        };
        /**
         * private function
         *
         * disable other active discrete controls when discrete control is activeted
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
        };
        return new Controls(_controls);
    }];
}]);
