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

class Group {

    constructor(options) {
        var self = this;
        this.CLASS_NAME = 'anol.layer.Group';    
        this.name = options.name;
        this.title = options.title;
        this.layers = options.layers;
        this.options = options;
        
        this.combinable = undefined;

        if (this.layers === undefined) {
            this.layers = [];
        }
        angular.forEach(this.layers, function(layer) {
            layer.anolGroup = self;
        });
    }
    getVisible() {
        var self = this;
        var visible = false;
        $.each(self.layers, function(idx, layer) {
            if(layer.getVisible()) {
                visible = true;
                return false;
            }
        });
        return visible;
    }
    setVisible(visible) {
        var self = this;
        $.each(self.layers, function(idx, layer) {
            if(layer.getVisible() !== visible) {
                layer.setVisible(visible);
            }
        });
    }
    isCombinable() {
        // check if check was alredy done for group
        if (combinable !== undefined) {
            return combinable;
        }
        var lastClass = undefined;
        var lastUrl = undefined;
        var combinable = true;
        var self = this;
        $.each(self.layers, function(idx, layer) {
            if(lastClass !== undefined && layer.CLASS_NAME !== lastClass) {
                combinable = false;
                return;
            }
            lastClass = layer.CLASS_NAME;
            if(lastUrl !== undefined  && layer.olSourceOptions.url !== lastUrl) {
                combinable = false;
                return;
            }
            lastUrl = layer.olSourceOptions.url;
        });
        this.combinable = combinable;
        return combinable;
    }
}

export default Group;
