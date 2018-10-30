import { createFragment, find } from './helpers/dom';
import { getUniqueId } from './helpers/mix';

export const CLASSNAME = {
  container       : 'ol-ctx-menu-container',
  // separator       : 'ol-ctx-menu' + VARS.separator_class,
  // submenu         : 'ol-ctx-menu' + VARS.submenu_class,
  hidden          : 'ol-ctx-menu-hidden',
  OL_unselectable : 'ol-unselectable'
};

/**
 * @class Html
 */
export class Html {
  /**
   * @constructor
   * @param {Function} base Base class.
   */
  constructor(contextmenu) {
    this.ContextMenu = contextmenu;
    this.ContextMenu.container = this.container = this.createContainer();
    return this;
  }

  createContainer(hidden) {
    const container = document.createElement('div');
    const ul = document.createElement('ul');
    const classes = [CLASSNAME.container, CLASSNAME.OL_unselectable];

    hidden && classes.push(CLASSNAME.hidden);
    container.className = classes.join(' ');
    container.style.width = parseInt(this.ContextMenu.options.width, 10) + 'px';
    container.appendChild(ul);
    return container;
  }

  createMenu() {
    let items = [];

    if ('items' in this.ContextMenu.options) {
      items = this.ContextMenu.options.items;
    } 
    // no item
    if (items.length === 0) return false;
    // create entries
    items.forEach(this.addMenuEntry, this);
  }

  addMenuEntry(item) {
    this.generateHtmlAndPublish(this.container, item);
  }

  generateHtmlAndPublish(parent, item, submenu) {
    let html,
        frag,
        element,
        separator = false;
    const index = getUniqueId();
    item.classname = item.classname || '';
    html = '<span>' + item.text + '</span>';
    frag = createFragment(html);
    element = document.createElement('li');
    element.id = index;
    element.className = item.classname;
    element.appendChild(frag);
    parent.firstChild.appendChild(element);

    this.ContextMenu.Internal.items[index] = {
      id: index,
      submenu: submenu || 0,
      separator: separator,
      callback: item.callback,
      data: item.data || null,
    };
    this.ContextMenu.Internal.setItemListener(element, index);
    return element;
  }

  removeMenuEntry(index) {
    const element = find('#' + index, this.container.firstChild);
    element && this.container.firstChild.removeChild(element);
    delete this.ContextMenu.Internal.items[index];
  }
 
}
