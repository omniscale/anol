anol.control.Control = function(options) {
    if(options === undefined) {
        return;
    }

    this.active = options.active || false;
    this.exclusive = options.exclusive || false;
    this.element = options.element;
    this.interaction = options.interaction;

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
    deactivate: function() {
        this.active = false;
        $(this).triggerHandler('anol.control.deactivate');
    },
    onDeactivate: function(func, context) {
        var targetControl = this;
        $(this).on('anol.control.deactivate', function() {
            func(targetControl, context);
        });
    }
};
