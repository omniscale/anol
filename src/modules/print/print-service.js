angular.module('anol.print')
/**
 * @ngdoc object
 * @name anol.print.PrintServiceProvider
 */
.provider('PrintService', [function() {
    var _downloadReady, _printUrl, _checkUrlAttribute;
    var _preparePrintArgs = function(rawPrintArgs) {
        return rawPrintArgs;
    };
    var _mode = 'direct';
    /**
     * @ngdoc method
     * @name setPreparePrintArgs
     * @methodOf anol.print.PrintServiceProvider
     *
     * @param {function} preparePrintArgs Function returning argument dict send to print endpoint via post request
     * Function is called with the following parameters:
     * - **rawPrintArgs** - {Object} - Print args provided by anol.print.PrintDirective
     * - **rawPrintArgs.bbox** - {Array.<number>} - Bounding box to print
     * - **rawPrintArgs.layers** - {Array.<anol.layer>} - Layers to print
     * - **rawPrintArgs.projection** {string} - Projection code
     * - **rawPrintArgs.templateValues** {Object} - All values added to *printAttributes*. @see anol.print.PrintDirective
     *
     */
    this.setPreparePrintArgs = function(preparePrintArgs) {
        _preparePrintArgs = preparePrintArgs;
    };
    /**
     * @ngdoc method
     * @name setMode
     * @methodOf anol.print.PrintServiceProvider
     *
     * @param {string} mode Mode of print backend. Valid values are 'direct' and 'queque'. If using queue, *preparePrintArgs* and *downloadReady* functions must be defined.
     */
    this.setMode = function(mode) {
        _mode = mode;
    };
    /**
     * @ngdoc method
     * @name setCheckUrlAttribute
     * @methodOf anol.print.PrintServiceProvider

     * @param {string} checkUrlAttribute Attribute of print endpoint response containing the url for checking download ready when use queque mode.
     */
    this.setCheckUrlAttribute = function(checkUrlAttribute) {
        _checkUrlAttribute = checkUrlAttribute;
    };
    /**
     * @ngdoc method
     * @name downloadReady
     * @methodOf anol.print.PrintServiceProvider
     *
     * @param {function} downloadReady Function returning true if download is ready.
     * Function is called with the following parameters:
     * - **response** - {Object} - Response from check download request
     * Function must return valid download url or false
     */
    this.setDownloadReady = function(downloadReady) {
        _downloadReady = downloadReady;
    };
    /**
     * @ngdoc method
     * @name setPrintUrl
     * @methodOf anol.print.PrintServiceProvider
     *
     * @param {string} printUrl Url to print endpoint
     */
    this.setPrintUrl = function(printUrl) {
        _printUrl = printUrl;
    };

    this.$get = ['$q', '$http', '$timeout', function($q, $http, $timeout) {
        /**
         * @ngdoc service
         * @name anol.print.PrintService
         * @requires $q
         * @requires $http
         * @requires $timeout
         *
         * @description
         * Service for comunication with print backend
         */
        var Print = function(printUrl, mode, checkUrlAttribute, preparePrintArgs, downloadReady) {
            this.printUrl = printUrl;
            this.mode = mode;
            this.checkUrlAttribute = checkUrlAttribute;
            this.preparePrintArgs = preparePrintArgs;
            this.downloadReady = downloadReady;
        };
        /**
         * @ngdoc method
         * @name startPrint
         * @methodOf anol.print.PrintService
         *
         * @param {Object} rawPrintArgs Arguments provided by print directive
         * @param {Array.<number>} rawPrintArgs.bbox Print bounding box
         * @param {Array.<anol.layer>} rawPrintArgs.layers Anol layers to print
         * @param {string} rawPrintArgs.projection Output projection code
         *
         * @returns {Object} promise
         * @description
         * Requests the print endpoint and returns promise when resolved with downloadUrl
         */
        Print.prototype.startPrint = function(rawPrintArgs) {
            var printArgs = this.preparePrintArgs(rawPrintArgs);
            switch(this.mode) {
                case 'queque':
                    return this.printQueque(printArgs);
                // includes case 'direct'
                default:
                    return this.printDirect(printArgs);
            }
        };

        Print.prototype.printQueque = function(printArgs) {
            var self = this;
            var deferred = $q.defer();
            $http.post(this.printUrl, printArgs, {
                responseType: 'json'
            }).then(
                function(response) {
                    var checkUrl = response.data[self.checkUrlAttribute];
                    var checkPromise = self.checkDownload(checkUrl);
                    checkPromise.then(
                        function(downloadUrl) {
                            deferred.resolve(downloadUrl);
                        },
                        function() {
                            deferred.reject();
                    });
                }
            );
            return deferred.promise;
        };

        Print.prototype.checkDownload = function(url) {
            var self = this;
            var deferred = $q.defer();
            var checker = function() {
                $http.get(url).then(
                    function(response) {
                        var downloadReady = self.downloadReady(response);
                        if(!downloadReady) {
                            $timeout(checker, 1000);
                            return;
                        }
                        deferred.resolve(downloadReady);
                    },
                    function() {
                        deferred.reject();
                    }
                );
            };
            checker();
            return deferred.promise;
        };

        Print.prototype.printDirect = function(printArgs) {
            var deferred = $q.defer();
            var filePromise = $http.post(this.printUrl, printArgs, {
                responseType: 'arraybuffer'
            });
            filePromise.then(
                function(response) {
                    var file = new Blob([response.data], {type: printArgs.mimetype});
                    var fileUrl = URL.createObjectURL(file);
                    deferred.resolve(fileUrl);
                },
                function() {
                    deferred.reject();
                }
            );
            return deferred.promise;
        };

        return new Print(_printUrl, _mode, _checkUrlAttribute, _preparePrintArgs, _downloadReady);
    }];
}]);