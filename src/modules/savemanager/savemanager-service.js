angular.module('anol.savemanager')

.provider('SaveManagerService', [function() {
    // handles layer source change events and store listener keys for removing
    // listeners nicely
    var LayerListener = function(layer, saveManager) {
        this.layer = layer;
        this.saveManager = saveManager;
        this.source = layer.olLayer.getSource();

        this.addListenerKey = undefined;
        this.changeListenerKey = undefined;
        this.removeListenerKey = undefined;
    };
    LayerListener.prototype.register = function(addHandler, changeHandler, removeHandler) {
        var self = this;

        var _register = function(type, handler, key) {
            if(handler === undefined) {
                return;
            }
            if(key !== undefined) {
                self.source.unByKey(key);
            }
            return self.source.on(
                type,
                function(evt) {
                    handler.apply(self.saveManager, [evt, self.layer]);
                }
            );
        };

        self.addListenerKey = _register(
            ol.source.VectorEventType.ADDFEATURE,
            addHandler,
            self.addListenerKey
        );
        self.changeListenerKey = _register(
            ol.source.VectorEventType.CHANGEFEATURE,
            changeHandler,
            self.changeListenerKey
        );
        self.removeListenerKey = _register(
            ol.source.VectorEventType.REMOVEFEATURE,
            removeHandler,
            self.removeListenerKey
        );
    };
    LayerListener.prototype.unregister = function() {
        var self = this;
        if(self.addListenerKey !== undefined) {
            self.source.unByKey(self.addListenerKey);
            self.addListenerKey = undefined;
        }
        if(self.changeListenerKey !== undefined) {
            self.source.unByKey(self.changeListenerKey);
            self.changeListenerKey = undefined;
        }
        if(self.removeListenerKey !== undefined) {
            self.source.unByKey(self.removeListenerKey);
            self.removeListenerKey = undefined;
        }
    };

    // stores features depending on their edit state
    // and converts stored features to geojson objects
    var FeatureStore = function(format) {
        this.format = format || new ol.format.GeoJSON();
        this.added = [];
        this.changed = [];
        this.removed = [];
    };
    FeatureStore.prototype.add = function(feature, action) {
        var addIdx = -1;
        var changeIdx = -1;
        switch(action) {
            case this.CHANGED:
                if(this.added.indexOf(feature) !== -1) {
                    return;
                }
            break;
            case this.REMOVED:
                changeIdx = this.changed.indexOf(feature);
                addIdx = this.added.indexOf(feature);
            break;
        }
        if(addIdx !== -1) {
            this.added.splice(addIdx, 1);
            return;
        }
        if(changeIdx !== -1) {
            this.changed.splice(changeIdx, 1);
        }

        var list;
        switch(action) {
            case this.ADDED:
                list = this.added;
            break;
            case this.CHANGED:
                list = this.changed;
            break;
            case this.REMOVED:
                list = this.removed;
            break;
        }
        if(list.indexOf(feature) === -1) {
            list.push(feature);
        }
    };
    FeatureStore.prototype.append = function(featureStore) {
        this.added = this.added.concat(featureStore.added);
        this.changed = this.changed.concat(featureStore.changed);
        this.removed = this.removed.concat(featureStore.removed);
    };
    FeatureStore.prototype.hasAddedFeatures = function() {
        return this.added.length > 0;
    };
    FeatureStore.prototype.hasChangedFeatures = function() {
        return this.changed.length > 0;
    };
    FeatureStore.prototype.hasRemovedFeatures = function() {
        return this.removed.length > 0;
    };
    FeatureStore.prototype.addedFeatures = function() {
        return this.format.writeFeaturesObject(this.added);
    };
    FeatureStore.prototype.changedFeatures = function() {
        return this.format.writeFeaturesObject(this.changed);
    };
    FeatureStore.prototype.removedFeatures = function() {
        var ids = [];
        angular.forEach(this.removed, function(feature) {
            ids.push(feature.get('_id'));
        });
        return ids;
    };
    FeatureStore.prototype.ADDED = 1;
    FeatureStore.prototype.CHANGED = 2;
    FeatureStore.prototype.REMOVED = 3;


    var _saveUrl;
    this.setSaveUrl = function(saveUrl) {
        _saveUrl = saveUrl;
    };

    this.$get = ['$rootScope', '$q', '$http', '$timeout', function($rootScope, $q, $http, $timeout) {
        var SaveManager = function(saveUrl) {
            this.saveUrl = saveUrl;
            this.changedLayers = {};
            this.changedFeatures = {};
        };
        SaveManager.prototype.addLayer = function(layer) {
            var self = this;
            var layerListener = new LayerListener(layer, self);
            $rootScope.$watch(function() {
                return layer.loaded;
            }, function(loaded) {
                if(loaded === true) {
                    layerListener.register(
                        self.featureAddedHandler,
                        self.featureChangedHandler,
                        self.featureRemovedHandler
                    );
                } else {
                    layerListener.unregister();
                }
            });
        };
        SaveManager.prototype.featureAddedHandler = function(evt, layer) {
            var self = this;
            var feature = evt.feature;
            var featureStore = self.featureStoreByLayer(layer);
            featureStore.add(feature, featureStore.ADDED);
            self.addChangedLayer(layer);
        };
        SaveManager.prototype.featureChangedHandler = function(evt, layer) {
            var self = this;
            var feature = evt.feature;
            var featureStore = self.featureStoreByLayer(layer);
            featureStore.add(feature, featureStore.CHANGED);
            self.addChangedLayer(layer);
        };
        SaveManager.prototype.featureRemovedHandler = function(evt, layer) {
            var self = this;
            var feature = evt.feature;
            var featureStore = self.featureStoreByLayer(layer);
            featureStore.add(feature, featureStore.REMOVED);
            self.addChangedLayer(layer);
        };
        SaveManager.prototype.featureStoreByLayer = function(layer) {
            var self = this;
            if(self.changedFeatures[layer.name] === undefined) {
                self.changedFeatures[layer.name] = new FeatureStore();
            }
            return self.changedFeatures[layer.name];
        };
        SaveManager.prototype.addChangedLayer = function(layer) {
            var self = this;
            if(!(layer.name in self.changedLayers)) {
                // TODO find out why $apply already in progress
                $timeout(function() {
                    $rootScope.$apply(function() {
                        self.changedLayers[layer.name] = layer;
                    });
                });
            }
        };
        SaveManager.prototype.commitFeatures = function(featureStore, layerName, targetUrl) {
            var promises = [];
            if(featureStore.hasAddedFeatures()) {
                var data = featureStore.addedFeatures();
                data.layername = layerName;
                promises.push($http.put(targetUrl, data));            }
            if(featureStore.hasChangedFeatures()) {
                promises.push($http.post(targetUrl, featureStore.changedFeatures()));
            }
            if(featureStore.hasRemovedFeatures()) {
                promises.push($http.delete(targetUrl, {params: {'ids': featureStore.removedFeatures()}}));
            }
            return $q.all(promises);
        };
        SaveManager.prototype.commit = function(layer) {
            var self = this;
            var deferred = $q.defer();

            if(layer.name in self.changedLayers) {
                var featureStore = self.featureStoreByLayer(layer);
                var promise = self.commitFeatures(featureStore, layer.name, layer.saveUrl || self.saveUrl);
                promise.then(function() {
                    deferred.resolve();
                }, function(reason) {
                    deferred.reject(reason);
                });
            } else {
                deferred.reject('No changes for layer ' + layer.name + ' present');
            }

            return deferred.promise;
        };

        return new SaveManager(_saveUrl);
    }];
}]);