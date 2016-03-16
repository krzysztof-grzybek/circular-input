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

  var elementsAmount = 0,
      uid = 'circularRange' + new Date().getTime(),
      cache = [];

  function isNodeList (object) {
    var stringRepr = Object.prototype.toString.call(object);
    return typeof object === 'object' &&
       /^\[object (HTMLCollection|NodeList|Object)\]$/.test(stringRepr) &&
       (typeof object.length === 'number') &&
       (object.length === 0 || (typeof object[0] === 'object' && object[0].nodeType > 0));
  }

  function stringToDom (string) {
    var div = document.createElement('div');
    div.innerHTML = string;
    return div.childNodes;
  }

  function extend (rootObj, extendingObj) {
    for (var i in extendingObj) {
      if (extendingObj.hasOwnProperty(i)) {
        rootObj[i] = extendingObj[i];
      }
    }
    return rootObj;
  }

  function circularRange (element, options) {
    if (!(this instanceof circularRange)) { // force 'new' keyword
      return new circularRange(element, options);
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

    this.input = element;
    this.svgEl = null;
    this.value = this.input.value ? Number(this.input.value) : circularRange.DEFAULTS.min;

    this.options = extend({}, circularRange.DEFAULTS);
    this.options = extend(this.options, this.getDomOptions());
    this.options = extend(this.options, options);
    console.log(this.options)

    this.init();
    return this;
  }

  circularRange.DEFAULTS = {
    min: 0,
    max: 100,
    step: 1,
    sensivity: 100
  };

  circularRange.domStrings = {
    container: '<div class="circ-range"></div>',
    svg : ['<svg class="circ-range__svg" viewBox="0 0 36 36" version="1.1" xmlns="http://www.w3.org/2000/svg">',
             '<path class="circ-range__whole-arc" id="basic-arc"></path>',
             '<path class="circ-range__active-arc" id="meter-arc"></path>',
             '<line class="circ-range__indicator" x1="18" y1="18" x2="18" y2="32">',
           '</svg>'].join('')
  };

  circularRange.prototype = {
    getDomOptions: function () {
      var domOptions = {},
          optionNames = Object.keys(circularRange.DEFAULTS);

      for (var i = 0; i < optionNames.length; i++) {
        var optionName = optionNames[i],
            optionValue = this.input.getAttribute('data-' + optionName);

        if (optionValue !== null) {
          domOptions[optionName] = Number(optionValue);
        }
      }
      return domOptions;
    },
    init: function () {
      this.createDOM();
      this.addEventHandlers();
    },
    createDOM: function () {
      var container = stringToDom(circularRange.domStrings.container)[0];
      this.input.parentNode.insertBefore(container, this.input);
      container.innerHTML = circularRange.domStrings.svg;
      this.svgEl = container.firstChild;
      container.appendChild(this.input);
    },
    addEventHandlers: function () {
      var self = this;

      this.svgEl.addEventListener('mousedown', function (e) {
        e.preventDefault(); // http://stackoverflow.com/questions/9506041/javascript-events-mouseup-not-firing-after-mousemove
        var initalMouseY = e.pageY,
            unbindListeners = function () {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', unbindListeners);
            },
            handleMouseMove = function (e) {
              self.mouseMoveValueChange(e, initalMouseY);
            }

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', unbindListeners);
      });
    },
    mouseMoveValueChange: function (e, initalMouseY) {
      e.preventDefault();
      console.log(initalMouseY)
      //this.updateView();
    },
    keyboardInputValueChange: function (e) {

    },
    mouseUpHandle: function () {

    },
    updateView: function () {

    }
  };

  return circularRange;
});
