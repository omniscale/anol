/**
 * @ngdoc overview
 * @name anol
 * @description
 * Base anol module
 */

require('angular-ui-bootstrap');
require('angular-translate');
require('angular-sanitize');

angular.module('anol', ['ui.bootstrap', 'pascalprecht.translate', 'ngSanitize'])
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
                    'TOOLTIP_REMOVE': 'Remove selected geometry',
                    'LAYER_TITLE': 'Draw layer'
                },
                'featureexchange': {
                    'NO_JSON_FORMAT': 'No json format',
                    'INVALID_GEOJSON': 'No valid geojson given',
                    'EMPTY_GEOJSON': 'Empty geojson given',
                    'COULD_NOT_READ_FILE': 'Could not read file'
                },
                'featureform': {
                    'PLEASE_CHOOSE': 'Please choose ...',
                    'IS_REQUIRED': 'This field is required',
                    'INPUT_NOT_SUPPORTED': 'The following configured input type is not supported: '
                },
                'featurepropertieseditor': {
                    'NEW_PROPERTY': 'New property'
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
                    'NO_RESULTS': 'No results found',
                    'SEARCH_IN_PROGRESS': 'Search in progress'
                },
                'geolocation': {
                    'TOOLTIP': 'Start geolocation',
                    'POSITION_OUT_OF_MAX_EXTENT': 'Your position is not in map extent'
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
                    'PAGE_LAYOUTS': 'Page sizes',
                    'SCALE': 'Scale',
                    'OUTPUT_FORMAT': 'Output format',
                    'REMOVE_PRINT_AREA': 'Remove print area',
                    'START_PRINT': 'Start printing',
                    'OUTPUT_PREPARED': 'Printing in progress.\nThis may take a moment.',
                    'DOWNLOAD_READY': 'Printing finished',
                    'DOWNLOAD': 'Download it',
                    'ERROR': 'Sorry! An error occured.\nPleace try again later.',
                    'INVALID_SCALE': 'No valid scale',
                    'PAGE_WIDTH': 'Width',
                    'PAGE_HEIGHT': 'Height',
                    'INVALID_WIDTH': 'Invalid width',
                    'INVALID_HEIGHT': 'Invalid height',
                    'WIDTH_REQUIRED': 'Width required',
                    'HEIGHT_REQUIRED': 'Height required',
                    'WIDTH_TOO_SMALL': 'Width too small. Min width: ',
                    'HEIGHT_TOO_SMALL': 'Height too small. Min height: ',
                    'WIDTH_TOO_BIG': 'Width too big. Max width: ',
                    'HEIGHT_TOO_BIG': 'Height too big. Max height: '
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
        $translateProvider.translations('de_DE', {
            'anol': {
                'draw': {
                    'TOOLTIP_DRAW_POINT': 'Punkt zeichnen',
                    'TOOLTIP_DRAW_LINE': 'Linie zeichnen',
                    'TOOLTIP_DRAW_POLYGON': 'Polygon zeichnen',
                    'TOOLTIP_REMOVE': 'Ausgewählte Geometrie entfernen',
                    'DRAW_LAYER_TITLE': 'Zeichenlayer'
                },
                'featureform': {
                    'PLEASE_CHOOSE': 'Bitte auswählen ...',
                    'IS_REQUIRED': 'Dies ist ein Pflichtfeld',
                    'INPUT_NOT_SUPPORTED': 'Der folgende konfigurierte Inputtyp ist nicht unterstützt: '
                },
                'featurestyleeditor': {
                    'EDIT_FEATURE_STYLE': 'Feature Style bearbeiten',
                    'OK': 'OK',
                    'CANCEL': 'Abbrechen',
                    'RADIUS': 'Radius',
                    'LINE_COLOR': 'Linienfarbe',
                    'LINE_WIDTH': 'Linienstärke',
                    'LINE_OPACITY': 'Liniendeckkraft',
                    'LINE_DASHSTYLE': 'Linendarstellung',
                    'FILL_COLOR': 'Füllfarbe',
                    'FILL_OPACITY': 'Fülldeckkraft',
                    'SOLID': 'Durchgezogen',
                    'DOT': 'Gepunktet',
                    'DASH': 'Gestrichelt',
                    'DASHDOT': 'Gestrichelt und gepunktet',
                    'LONGDASH': 'Lang gestrichelt',
                    'LONGDASHDOT': 'Lang gestrichelt und gepunktet'
                },
                'zoom': {
                    'TOOLTIP_ZOOM_IN': 'Hineinzoomen',
                    'TOOLTIP_ZOOM_OUT': 'Herauszoomen'
                }
            },
            'CHANGE_LANGUAGE': 'Sprache wechseln',
            'ENGLISH': 'Englisch',
            'GERMAN': 'Deutsch'
        });
        $translateProvider.preferredLanguage('en_US');
    }]);
