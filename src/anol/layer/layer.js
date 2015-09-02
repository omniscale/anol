anol.layer.Layer = function(options) {
    var self = this;
    self.name = options.name;
    self.title = options.title;
    self.displayInLayerswitcher = options.displayInLayerswitcher || true;
    self.isBackground = options.isBackground || false;
    self.featureinfo = options.featureinfo || false;
    self.olLayer = options.olLayer;
    self.olLayer.set('anolLayer', self);
};
anol.layer.Layer.prototype = {
    CLASS_NAME: 'anol.layer.Layer',
    getVisible: function() {
        var self = this;
        return self.olLayer.getVisible();
    },
    setVisible: function(visible)  {
        var self = this;
        self.olLayer.setVisible(visible);
    }
};

anol.layer.Group = function(options) {
    var self = this;
    self.name = options.name;
    self.title = options.title;
    self.layers = options.layers;
};
anol.layer.Group.prototype = {
    CLASS_NAME: 'anol.layer.Group',
    getVisible: function() {
        var self = this;
        var visible = false;
        $.each(self.layers, function(idx, layer) {
            if(layer.getVisible()) {
                visible = true;
                return false;
            }
        });
        return visible;
    },
    setVisible: function(visible) {
        var self = this;
        $.each(self.layers, function(idx, layer) {
            if(layer.getVisible !== visible) {
                layer.setVisible(visible);
            }
        });
    }
};