import { EVENT_TYPE } from './base';
import { CLASSNAME } from './html';
import { transform, transformExtent } from 'ol/proj';

import {
  addClass,
  removeClass,
} from './helpers/dom';

/**
 * @class Internal
 */
export class Internal {
  /**
   * @constructor
   * @param {Function} base Base class.
   */
  constructor(contextmenu) {
    /**
     * @type {ol.control.Control}
     */
    this.ContextMenu = contextmenu;
    /**
     * @type {ol.Map}
     */
    this.map = undefined;
    /**
     * @type {Element}
     */
    this.viewport = undefined;
    /**
     * @type {ol.Coordinate}
     */
    this.coordinateClicked = undefined;
    /**
     * @type {ol.Pixel}
     */
    this.pixelClicked = undefined;
    /**
     * @type {Number}
     */
    this.lineHeight = 0;
    /**
     * @type {Object}
     */
    this.items = {};
    /**
     * @type {Boolean}
     */
    this.opened = false;
    /**
     * @type {Object}
     */
    this.submenu = {
      left: contextmenu.options.width - 15 + 'px',
      lastLeft: '', // string + px
    };
    /**
     * @type {Function}
     */
    this.eventHandler = this.handleEvent.bind(this);
    return this;
  }

  init(map) {
    this.map = map;
    this.viewport = map.getViewport();
    // this.ContextMenu.Html.createMenu();
    this.setListeners();
    this.lineHeight = this.ContextMenu.container.offsetHeight / this.getItemsLength()
  }

  getItemsLength() {
    let count = 0;
    Object.keys(this.items).forEach(k => {
      if (this.items[k].submenu || this.items[k].separator) return;
      count++;
    });
    return count;
  }

  getPixelClicked() {
    return this.pixelClicked;
  }

  getCoordinateClicked() {
    return this.coordinateClicked;
  }

  positionContainer(pixel) {
    const container = this.ContextMenu.container;
    const mapSize = this.map.getSize();
    // how much (width) space left over
    const space_left_h = mapSize[1] - pixel[1];
    // how much (height) space left over
    const space_left_w = mapSize[0] - pixel[0];

    const menuSize = {
      w: container.offsetWidth,
      // a cheap way to recalculate container height
      // since offsetHeight is like cached
      h: Math.round(this.ContextMenu.container.offsetHeight / this.getItemsLength() * this.getItemsLength()),
    };
    if (space_left_w >= menuSize.w) {
      container.style.right = 'auto';
      container.style.left = `${pixel[0] + 5}px`;
    } else {
      container.style.left = 'auto';
      container.style.right = '15px';
    }

    // set top or bottom
    if (space_left_h >= menuSize.h) {
      container.style.bottom = 'auto';
      container.style.top = `${pixel[1] - 10}px`;
    } else {
      container.style.top = 'auto';
      container.style.bottom = 0;
    }

    removeClass(container, CLASSNAME.hidden);
  }

  openMenu(pixel, coordinate) {
    this.ContextMenu.Html.createMenu();
    this.ContextMenu.dispatchEvent({
      type: EVENT_TYPE.OPEN,
      pixel: pixel,
      coordinate: coordinate,
    });
    this.opened = true;
    this.positionContainer(pixel);
  }

  closeMenu() {
    this.opened = false;
    addClass(this.ContextMenu.container, CLASSNAME.hidden);
    this.ContextMenu.dispatchEvent({
      type: EVENT_TYPE.CLOSE,
    });
    this.ContextMenu.container.firstChild.innerHTML = '';
  }

  setListeners() {
    this.viewport.addEventListener(
      this.ContextMenu.options.eventType,
      this.eventHandler,
      false,
    );
  }

  removeListeners() {
    this.viewport.removeEventListener(
      this.ContextMenu.options.eventType,
      this.eventHandler,
      false,
    );
  }

  handleEvent(evt) {
    const this_ = this;

    this.coordinateClicked = this.map.getEventCoordinate(evt);
    this.pixelClicked = this.map.getEventPixel(evt);

    this.ContextMenu.dispatchEvent({
      type: EVENT_TYPE.BEFOREOPEN,
      pixel: this.pixelClicked,
      coordinate: this.coordinateClicked,
    });

    if (this.ContextMenu.disabled) return;

    if (this.ContextMenu.options.eventType === EVENT_TYPE.CONTEXTMENU) {
      // don't be intrusive with other event types
      evt.stopPropagation();
      evt.preventDefault();
    }

    this.openMenu(this.pixelClicked, this.coordinateClicked);

    //one-time fire
    evt.target.addEventListener(
      'click',
      {
        handleEvent: function (e) {
          this_.closeMenu();
          evt.target.removeEventListener(e.type, this, false);
        },
      },
      false,
    );
  }

  generateResponseObj() {
    const view = this.map.getView();

    const coordinate = this.getCoordinateClicked()
    const coordinate4326 = transform(coordinate, view.getProjection().getCode(), 'EPSG:4326');

    const extent = view.calculateExtent(this.map.getSize())
    const extent4326 = transformExtent(extent, view.getProjection().getCode(), 'EPSG:4326');

    var bboxDict = {}
    bboxDict[view.getProjection().getCode()] = extent;
    bboxDict['EPSG:4326'] = extent4326;

    var coordDict = {}
    coordDict[view.getProjection().getCode()] = coordinate;
    coordDict['EPSG:4326'] = coordinate4326;

    const obj = {
      coordinates: coordDict,
      bbox: bboxDict,
      zoom: view.getZoom(),
      resolution: view.getResolution()
    };

    return obj;
  }

  setItemListener(li, index) {
    const this_ = this;
    if (li && typeof this.items[index].callback === 'function' && this.items[index].link !== true) {
      (function (callback) {
        li.addEventListener(
          'click',
          function (evt) {
            evt.preventDefault();
            const obj = this_.generateResponseObj()
            this_.closeMenu();
            callback(obj, this_.map);
          },
          false,
        );
      })(this.items[index].callback);
    }
  }
}
