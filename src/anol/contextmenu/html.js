import { createFragment, find } from './helpers/dom';
import { getUniqueId } from './helpers/mix';

export const CLASSNAME = {
  container       : 'ol-ctx-menu-container',
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

    this.container.firstChild.innerHTML = '';
    // create entries
    items.forEach(this.addMenuEntry, this);
  }

  addMenuEntry(item) {
    this.generateHtmlAndPublish(this.container, item);
  }

  generateHtmlAndPublish(parent, item) {
    let html,
        frag,
        element,
        url,
        separator = false;

    const index = getUniqueId();
    item.classname = item.classname || '';
    if (item.link) {
      if (typeof item.callback === 'function') {
        const obj = this.ContextMenu.Internal.generateResponseObj();
        url = item.callback(obj)
      } else {
        url = item.callback;
      }
      html = '<a href="'+ url +'" title="'+item.title +'" target=_blank">' + item.text + '</a>';
    } else {
      html = '<span>' + item.text + '</span>';
    }

    frag = createFragment(html);
    element = document.createElement('li');
    element.id = index;
    element.className = item.classname;
    element.appendChild(frag);
    parent.firstChild.appendChild(element);

    this.ContextMenu.Internal.items[index] = {
      id: index,
      link: item.link || false,
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
