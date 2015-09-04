anol.layer.Group = function(options) {
    this.name = options.name;
    this.title = options.title;
    this.layers = options.layers;
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
