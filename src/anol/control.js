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
anol.control.Control = function(options) {
    if(options === undefined) {
        return;
    }

    this.active = options.active || false;
    this.exclusive = options.exclusive || false;
    this.subordinate = options.subordinate || false;
    this.element = options.element;
    this.interactions = options.interactions;

    if(options.olControl === undefined) {
        var controlElement;
        if(this.element !== undefined) {
            controlElement = this.element[0];
        }
        var target;
        if(options.target !== undefined) {
            target = options.target[0];
        }

        this.olControl = new ol.control.Control({
            element: controlElement,
            target: target
        });
    } else {
        this.olControl = options.olControl;
    }
};

anol.control.Control.prototype = {
    CLASS_NAME: 'anol.control.Control',
    DEFAULT_OPTIONS: {},
    activate: function() {
        this.active = true;
        $(this).triggerHandler('anol.control.activate');
    },
    onActivate: function(func, context) {
        var targetControl = this;
        $(this).on('anol.control.activate', function() {
            func(targetControl, context);
        });
    },
    oneActivate: function(func, context) {
        var targetControl = this;
        $(this).one('anol.control.activate', function() {
            func(targetControl, context);
        });
    },
    deactivate: function() {
        this.active = false;
        $(this).triggerHandler('anol.control.deactivate');
    },
    onDeactivate: function(func, context) {
        var targetControl = this;
        $(this).on('anol.control.deactivate', function() {
            func(targetControl, context);
        });
    },
    oneDeactivate: function(func, context) {
        var targetControl = this;
        $(this).one('anol.control.deactivate', function() {
            func(targetControl, context);
        });
    }
};
