(function (factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = factory();
  } else {
    window['circularRange'] = factory();
  }

})(function () {
  'use strict';

  var elementsAmount = 0;
  var uid = 'circularRange' + new Date().getTime();
  var cache = [];

  function isNodeList (object) {
    var stringRepr = Object.prototype.toString.call(object);
    return typeof object === 'object' &&
       /^\[object (HTMLCollection|NodeList|Object)\]$/.test(stringRepr) &&
       (typeof object.length === 'number') &&
       (object.length === 0 || (typeof object[0] === 'object' && object[0].nodeType > 0));
  }

  function circularRange (element, options) {
    if (!(this instanceof circularRange)) { // force 'new' keyword
      return new circularRange(element);
    }

    if (isNodeList(element)) {
      var elementsArray = [];
      for (var i = 0; i < element.length; i++) {
        elementsArray.push(new circularRange(element[i]));
      }
      return elementsArray;
    }

    if (typeof element[uid] !== 'undefined') {
      return cache[element[uid]]; // return existing object
    } else {
      element[uid] = elementsAmount;
      cache[elementsAmount] = this;
      elementsAmount++;
    }

    options = extend({}, circularRange.DEFAULTS, options);

    this.input = element;
    this.container = null;

    this.init();
    return this;
  }

  circularRange.DEFAULTS = {

  };

  circularRange.prototype = {
    init: function () {
      //console.log('init');
    },
    createDOM: function () {

    },
    updateValue: function () {

    },
    handleMouseMove: function () {

    },
    handleInput: function () {

    }
  };

  return circularRange;
});
