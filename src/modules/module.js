/**
 * @ngdoc overview
 * @name anol
 * @description
 * Base anol module
 */
angular.module('anol', ['ui.bootstrap', 'pascalprecht.translate'])
/**
 * @ngdoc object
 * @name anol.constant:DefaultMapName
 * @description
 * Id and class added to ol.Map DOM-element
 */
.constant('DefaultMapName', 'anol-map')
// found at http://stackoverflow.com/a/21098541
.filter('html',['$sce', function($sce) {
    return function(input){
        return $sce.trustAsHtml(input);
    };
}])
.config(['$translateProvider', function($translateProvider) {
    $translateProvider.useSanitizeValueStrategy('escape');
    // define default language
    // see https://angular-translate.github.io/docs/#/guide/12_asynchronous-loading 'FOUC - Flash of untranslated content'
    $translateProvider.translations('en_US', {
        'anol': {
            'attribution': {
                'TOOLTIP': 'Attributions'
            },
            'draw': {
                'TOOLTIP_POINT': 'Draw point',
                'TOOLTIP_LINE': 'Draw line',
                'TOOLTIP_POLYGON': 'Draw polygon',
                'LAYER_TITLE': 'Draw layer'
            },
            'featurepropertieseditor': {
                'NEW': 'New property'
            },
            'featurestyleeditor': {
                'RADIUS': 'Radius',
                'LINE_COLOR': 'Line color',
                'LINE_WIDTH': 'Line width',
                'LINE_OPACITY': 'Line opacity',
                'LINE_DASHSTYLE': 'Line dashstyle',
                'FILL_COLOR': 'Fill color',
                'FILL_OPACITY': 'Fill opacity',
                'SOLID': 'Solid',
                'DOT': 'Dotted',
                'DASH': 'Dashed',
                'DASHDOT': 'Dashed & dotted',
                'LONGDASH': 'Long dashed',
                'LONGDASHDOT': 'Long dashed & dotted'
            },
            'geocoder': {
                'PLACEHOLDER': 'Street, City',
                'NO_RESULTS': 'No results found'
            },
            'geolocation': {
                'TOOLTIP': 'Start geolocation'
            },
            'layerswitcher': {
                'TOOLTIP': 'Toggle layerswitcher',
                'BACKGROUNDS': 'Background layers',
                'OVERLAYS': 'Overlay layers'
            },
            'legend': {
                'TOOLTIP': 'Toggle legend',
                'SHOW': 'Show legend'
            },
            'measure': {
                'TOOLTIP_MEASURE_LINE': 'Measure line',
                'TOOLTIP_MEASURE_AREA': 'Measure area'
            },
            'overviewmap': {
                'TOOLTIP': 'Toggle overview map'
            },
            'print': {
                'PAGE_SIZES': 'Page sizes',
                'SCALE': 'Scale',
                'OUTPUT_FORMAT': 'Output format',
                'REMOVE_PRINT_AREA': 'Remove print area',
                'START_PRINT': 'Start printing',
                'OUTPUT_PREPARED': 'Printing in progress.\nThis may take a moment.',
                'DOWNLOAD_READY': 'Printing finished',
                'DOWNLOAD': 'Download it',
                'ERROR': 'Sorry! An error occured.\nPleace try again later.'
            },
            'savemanager': {
                'SERVICE_UNAVAILABLE': 'Service unavailable'
            },
            'zoom': {
                'TOOLTIP_ZOOM_IN': 'Zoom in',
                'TOOLTIP_ZOOM_OUT': 'Zoom out'
            },
            'validationErrors': {
                'min': 'Value must be greater than {{ min }}',
                'max': 'Value must be lower than {{ max }}',
                'color': 'Invalid color format',
                'number': 'Value is not a number'
            }
        }
    });
    $translateProvider.preferredLanguage('en_US');
}]);
