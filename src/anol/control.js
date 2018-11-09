/**
 * @ngdoc object
 * @name anol.Control.Control
 *
 * @param {Object} options AnOl Control options
 * @param {boolean} options.active Controls initial active state. Default false
 * @param {boolean} options.exclusive Flag control as exclusive. Only one exclusive control can be active at one time
 * @param {boolean} options.subordinate Flag control as subordinate. Subordinate controls are permanently active as long as no exclusive control is active.
 * @param {Object} options.element DOM-Element control belongs to
 * @param {Object} options.target DOM-Element control should be placed in
 * @param {ol.interaction.Interaction} options.interaction Openlayers interaction used by control
 * @param {ol.control.Control} options.olControl OpenLayers control if this control.
 * - If olControl is undefined, a new ol.control.Control with given options.element and options.target is created
 * - If olControl is null, anol.control.Control don't have an ol.control.Control
 *
 * @description
 * anol.control.Control is designed to work with anol.map.ControlsService.
 */

import { Control as OlControl} from 'ol/control';

class Control {
    
    constructor(options) {
        if(angular.isUndefined(options)) {
            return;
        }

        this.active = options.active || false;
        this.disabled = options.disabled || false;
        this.visible = options.visible || true;
        this.keepMenuOpen = options.keepMenuOpen || false;
        this.exclusive = options.exclusive || false;
        this.menu = options.menu || false;
        this.subordinate = options.subordinate || false;
        this.element = options.element;
        this.interactions = options.interactions || [];

        if(angular.isUndefined(options.olControl)) {
            var controlElement;
            if(angular.isDefined(this.element)) {
                controlElement = this.element[0];
            }
            var target;
            if(angular.isDefined(options.target)) {
                target = options.target[0];
            }
            this.olControl = new OlControl({
                element: controlElement,
                target: target
            });
        } else {
            this.olControl = options.olControl;
        }

        if(this.disabled) {
            this.addClass('disabled');
        }
        if(this.menu && this.active !== true) {
            this.addClass('hide');
        }        
        this.CLASS_NAME = 'anol.control.Control';
        this.DEFAULT_OPTIONS = {};

    }
    activate() {
        if(this.active === true) {
            return;
        }
        this.active = true;
        this.addClass('active');
        angular.element(this).triggerHandler('anol.control.activate');

        if(this.menu) {
            this.removeClass('hide');
        }    
    }
    onActivate(func, context) {
        var targetControl = this;
        var handler = function() {
            func(targetControl, context);
        };
        angular.element(this).on('anol.control.activate', handler);
        return handler;
    }
    oneActivate(func, context) {
        var targetControl = this;
        var handler = function() {
            func(targetControl, context);
        };
        angular.element(this).one('anol.control.activate', handler);
        return handler;
    }
    unActivate(handler) {
        angular.element(this).off('anol.control.activate', handler);
    }
    deactivate() {
        if(this.active === false) {
            return;
        }
        this.active = false;
        this.removeClass('active');
        angular.element(this).triggerHandler('anol.control.deactivate');
        if(this.menu) {
            this.addClass('hide');
        }    
    }
    onDeactivate(func, context) {
        var targetControl = this;
        var handler = function() {
            func(targetControl, context);
        };
        angular.element(this).on('anol.control.deactivate', handler);
        return handler;
    }
    oneDeactivate(func, context) {
        var targetControl = this;
        var handler = function() {
            func(targetControl, context);
        };
        angular.element(this).one('anol.control.deactivate', handler);
        return handler;
    }
    unDeactivate(handler) {
        angular.element(this).off('anol.control.deactivate', handler);
    }
    disable() {
        this.deactivate();
        this.disabled = true;
        this.addClass('disabled');
    }
    enable() {
        this.disabled = false;
        this.removeClass('disabled');
    }
    addClass(className) {
        if(angular.isDefined(this.element)) {
            this.element.addClass(className);
        }
    }
    removeClass(className) {
        if(angular.isDefined(this.element)) {
            this.element.removeClass(className);
        }
    }
}

export default Control;

