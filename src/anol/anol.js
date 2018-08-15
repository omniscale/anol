/**
 * @ngdoc overview
 * @name anol
 * @description
 * Wrapper namespace
 */

import Helper from "./helper.js"
import Nominatim from "./geocoder/nominatim.js"
import Solr from "./geocoder/Solr.js"

import AnolBaseLayer from "./layer.js"
import BaseWMS from "./layer/basewms.js"
import SingleTileWMS from "./layer/singletilewms.js"
import TiledWMS from "./layer/tiledwms.js"
import TMS from "./layer/tms.js"
import WMTS from "./layer/wmts.js"
import FeatureLayer from "./layer/feature.js"
import Group from "./layer/group.js"

import StaticGeoJSON from "./layer/staticgeojson.js"
import DynamicGeoJSON from "./layer/dynamicgeojson.js"
import BBOXGeoJSON from "./layer/bboxgeojson.js"

import Control from "./control.js"

export var helper = new Helper() || {};
export var geocoder = {
	Nominatim: Nominatim,
	Solr: Solr
}
export var layer = {
	BaseWMS: BaseWMS,
	SingleTileWMS: SingleTileWMS,
	TiledWMS: TiledWMS,
	TMS: TMS,
	WMTS: WMTS,
	Group: Group,
	Feature: FeatureLayer,
	StaticGeoJSON: StaticGeoJSON,
	DynamicGeoJSON: DynamicGeoJSON,
	BBOXGeoJSON: BBOXGeoJSON,
	Layer: AnolBaseLayer
};

export var control = {
	Control: Control
};
window.anol = {
	'layer': layer,
	'control': control,
	'helper': helper,
	'geocoder': geocoder
}
import { defaults } from '../modules/module.js'

import Attribution from '../modules/attribution/attribution-directive.js'
import Catalog from '../modules/catalog/catalog-directive.js'
import CatalogService from '../modules/catalog/catalog-service.js'

import DragPopup from '../modules/featurepopup/dragpopup-directive.js'
import Draw from '../modules/draw/draw-directive.js'
import DrawService from '../modules/draw/draw-service.js'
import FeatureExchange from '../modules/featureexchange/featureexchange-directive.js'

import FeaturePopup from '../modules/featurepopup/featurepopup-directive.js'
import FeaturePopupService from '../modules/featurepopup/featurepopup-service.js'

import FeaturePropertiesEditor from '../modules/featurepropertieseditor/featurepropertieseditor-directive.js'
import FeatureProperties from '../modules/featureproperties/featureproperties-directive.js'
import FeatureStyleEditor from '../modules/featurestyleeditor/featurestyleeditor-directive.js'

import GeoCoder from '../modules/geocoder/geocoder-directive.js'
import GeoLocation from '../modules/geolocation/geolocation-directive.js'
import GetFeatureInfo from '../modules/getfeatureinfo/getfeatureinfo-directive.js'
import LayerSwitcher from '../modules/layerswitcher/layerswitcher-directive.js'
import Legend from '../modules/legend/legend-directive.js'
import MapDiretive from '../modules/map/map-directive.js'
import MapService from '../modules/map/map-service.js'
import Measure from '../modules/measure/measure-directive.js'
import MousePosition from '../modules/mouseposition/mouseposition-directive.js'
import OverviewMap from '../modules/overviewmap/overviewmap-directive.js'
import PermalinkService from '../modules/permalink/permalink-service.js'
import Print from '../modules/print/print-directive.js'
import PrintService from '../modules/print/print-service.js'
import PrintPageService from '../modules/print/printpage-service.js'
import Rotate from '../modules/rotate/rotate-directive.js'
import SaveManager from '../modules/savemanager/savemanager-directive.js'
import SaveManagerService from '../modules/savemanager/savemanager-service.js'
import ScaleLine from '../modules/scale/scaleline-directive.js'
import ScaleText from '../modules/scale/scaletext-directive.js'

import URLMarkers from '../modules/urlmarkers/urlmarker-directive.js'
import URLMarkersService from '../modules/urlmarkers/urlmarker-service.js'
import URLMarkersBBCode from '../modules/urlmarkers/urlmerker-bbcode-directive.js'

import Zoom from '../modules/zoom/zoom-directive.js'
