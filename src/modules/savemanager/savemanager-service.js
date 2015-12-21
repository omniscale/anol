angular.module('anol.savemanager')

/**
 * @ngdoc object
 * @name anol.savemanager.SaveManagerServiceProvider
 */
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
    FeatureStore.prototype.pushInto = function(list, feature) {
        if(list.indexOf(feature) === -1) {
            list.push(feature);
        }
    };
    FeatureStore.prototype.pushAdded = function(feature) {
        this.pushInto(this.added, feature);
    };
    FeatureStore.prototype.pushChanged = function(feature) {
        if(this.added.indexOf(feature) !== -1) {
            return;
        }
        this.pushInto(this.changed, feature);
    };
    FeatureStore.prototype.pushRemoved = function(feature) {
        var addIdx = this.added.indexOf(feature);
        if(addIdx !== -1) {
            this.added.splice(addIdx, 1);
            return;
        }
        var changedIdx = this.changed.indexOf(feature);
        if(changedIdx !== -1) {
            this.changed.splice(changedIdx, 1);
        }
        this.pushInto(this.removed, feature);
    };
    FeatureStore.prototype.clearAdded = function() {
        this.added.length = 0;
    };
    FeatureStore.prototype.clearChanged = function() {
        this.changed.length = 0;
    };
    FeatureStore.prototype.clearRemoved = function() {
        this.removed.length = 0;
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

    var _saveUrl;
    /**
     * @ngdoc method
     * @name setSaveUrl
     * @methodOf anol.savemanager.SaveManagerServiceProvider
     * @param {String} saveUrl url to save changes to. Might be overwritten by layer.saveUrl
     */
    this.setSaveUrl = function(saveUrl) {
        _saveUrl = saveUrl;
    };

    this.$get = ['$rootScope', '$q', '$http', '$timeout', function($rootScope, $q, $http, $timeout) {
        /**
         * @ngdoc service
         * @name anol.savemanager.SaveManagerService
         *
         * @description
         * Collects changes in saveable layers and send them to given saveUrl
         */
        var SaveManager = function(saveUrl) {
            this.saveUrl = saveUrl;
            this.changedLayers = {};
            this.changedFeatures = {};
        };
        /**
         * @ngdoc method
         * @name addLayer
         * @methodOd anol.savemanager.SaveManagerService
         * @param {anol.layer.Feature} layer layer to watch for changes
         */
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
        /**
         * private function
         *
         * handler for ol3 feature added event
         */
        SaveManager.prototype.featureAddedHandler = function(evt, layer) {
            var self = this;
            var feature = evt.feature;
            var featureStore = self.featureStoreByLayer(layer);
            featureStore.pushAdded(feature);
            self.addChangedLayer(layer);
        };
        /**
         * private function
         *
         * handler for ol3 feature changed event
         */
        SaveManager.prototype.featureChangedHandler = function(evt, layer) {
            var self = this;
            var feature = evt.feature;
            var featureStore = self.featureStoreByLayer(layer);
            featureStore.pushChanged(feature);
            self.addChangedLayer(layer);
        };
        /**
         * private function
         *
         * handler for ol3 feature removed event
         */
        SaveManager.prototype.featureRemovedHandler = function(evt, layer) {
            var self = this;
            var feature = evt.feature;
            var featureStore = self.featureStoreByLayer(layer);
            featureStore.pushRemoved(feature);
            self.addChangedLayer(layer);
        };
        /**
         * private function
         *
         * returns corresponding feature store for given layer
         */
        SaveManager.prototype.featureStoreByLayer = function(layer) {
            var self = this;
            if(self.changedFeatures[layer.name] === undefined) {
                self.changedFeatures[layer.name] = new FeatureStore();
            }
            return self.changedFeatures[layer.name];
        };
        /**
         * private function
         *
         * adds a layer to list of layers with changes
         */
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
        /**
         * private function
         *
         * cleans up after changes done
         */
        SaveManager.prototype.changesDone = function(layerName) {
            delete this.changedLayers[layerName];
            delete this.changedFeatures[layerName];
        };
        /**
         * private function
         *
         * sends changes to saveUrl or layer.saveUrl
         */
        SaveManager.prototype.commitFeatures = function(featureStore, layerName, targetUrl) {
            var promises = [];
            if(featureStore.hasAddedFeatures()) {
                var addDeferred = $q.defer();
                promises.push(addDeferred.promise);

                var addData = featureStore.addedFeatures();
                addData.name = layerName;

                $http.put(targetUrl, addData).then(function() {
                    featureStore.clearAdded();
                    addDeferred.resolve();
                }, function(reason) {
                    addDeferred.reject(reason);
                });
            }
            if(featureStore.hasChangedFeatures()) {
                var changeDeferred = $q.defer();
                promises.push(changeDeferred.promise);

                var changeData = featureStore.addedFeatures();
                changeData.name = layerName;

                $http.post(targetUrl, changeData).then(function() {
                    featureStore.clearChanged();
                    changeDeferred.resolve();
                }, function(reason) {
                    changeDeferred.reject(reason);
                });
            }
            if(featureStore.hasRemovedFeatures()) {
                var removeDeferred = $q.defer();
                promises.push(removeDeferred.promise);
                $http.delete(targetUrl, {
                    params: {
                        'ids': featureStore.removedFeatures().join(',')
                    }
                }).then(function() {
                    featureStore.clearRemoved();
                    removeDeferred.resolve();
                }, function(reason) {
                    removeDeferred.reject(reason);
                });
            }
            return $q.all(promises);
        };
        /**
         * @ngdoc method
         * @name commit
         * @methodOd anol.savemanager.SaveManagerService
         * @param {anol.layer.Feature} layer
         * @description
         * Commits changes for given layer
         */
        SaveManager.prototype.commit = function(layer) {
            var self = this;
            var deferred = $q.defer();

            if(layer.name in self.changedLayers) {
                var featureStore = self.featureStoreByLayer(layer);
                var promise = self.commitFeatures(featureStore, layer.name, layer.saveUrl || self.saveUrl);
                promise.then(function() {
                    self.changesDone(layer.name);
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