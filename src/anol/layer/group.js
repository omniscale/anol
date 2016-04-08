/**
 * @ngdoc object
 * @name anol.layer.Group
 *
 * @param {Object} options AnOl group options
 * @param {string} options.name Unique group name
 * @param {string} options.title Title for group
 * @param {Array<anol.layer.Layer>} options.layers AnOl layers to group
 *
 * @description
 * Groups {@link anol.layer.Layer anol.layer.Layer}.
 */
 // TODO think about rebasing into anol.Group
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
