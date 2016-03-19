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

  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees) * Math.PI / 180.0; // + 90 + 30 - half of 'hole' part in arc

    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  function describeArc(x, y, radius, startAngle, endAngle){
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);

    var arcSweep = endAngle - startAngle <= 180 ? '0' : '1';

    var d = [
        'M', start.x, start.y,
        'A', radius, radius, 0, arcSweep, 0, end.x, end.y
    ].join(' ');

    return d;
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
    this.indicator = null;
    this.activeArc = null;

    this.options = extend({}, circularRange.DEFAULTS);
    this.options = extend(this.options, this.getDomOptions());
    this.options = extend(this.options, options);

    this.value = this.input.value ? Number(this.input.value) : this.options.min;
    this.pxPerStep = this.options.sensivity / ((this.options.max - this.options.min) / this.options.step);

    this.init();
    return this;
  }

  circularRange.DEFAULTS = {
    min: 0,
    max: 100,
    step: 5,
    sensivity: 100,
    theme: ''
  };

  circularRange.CLASS_NAMES = {
    basicArc: 'circ-range__basic-arc',
    activeArc: 'circ-range__active-arc',
    indicator: 'circ-range__indicator'
  };

  circularRange.DISPLAY = {
    arcAngle: 300,
    arcRadius: 14,
    boxSize: 36
  };

  circularRange.domStrings = {
    container: '<div class="circ-range"></div>',
    svg : ['<svg class="circ-range__svg" ',
             'viewBox="0 0 ', circularRange.DISPLAY.boxSize, ' ', circularRange.DISPLAY.boxSize , '" ',
             'version="1.1" xmlns="http://www.w3.org/2000/svg">',
               '<path class="', circularRange.CLASS_NAMES.basicArc, '"></path>',
               '<path class="', circularRange.CLASS_NAMES.activeArc, '"></path>',
               '<line class="', circularRange.CLASS_NAMES.indicator, '" ',
                 'x1="', circularRange.DISPLAY.boxSize / 2, '" ',
                 'y1="', circularRange.DISPLAY.boxSize / 2, '" ',
                 'x2="', circularRange.DISPLAY.boxSize / 2, '" ',
                 'y2="', circularRange.DISPLAY.boxSize / 2 + circularRange.DISPLAY.arcRadius, '">',
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
      this.updateView();
    },
    createDOM: function () {
      var container = stringToDom(circularRange.domStrings.container)[0],
          basicArc;

      this.input.parentNode.insertBefore(container, this.input);
      container.innerHTML = circularRange.domStrings.svg;
      container.appendChild(this.input);

      basicArc = container.getElementsByClassName(circularRange.CLASS_NAMES.basicArc)[0];
      basicArc.setAttribute('d', this.describeArc(circularRange.DISPLAY.arcAngle));

      if (this.options.theme) {
        container.className += ' circ-range--' + this.options.theme;
      }

      this.svgEl = container.firstChild;
      this.indicator = container.getElementsByClassName(circularRange.CLASS_NAMES.indicator)[0];
      this.activeArc = container.getElementsByClassName(circularRange.CLASS_NAMES.activeArc)[0];
    },
    addEventHandlers: function () {
      var self = this;

      this.svgEl.addEventListener('mousedown', function (e) {
        e.preventDefault(); // http://stackoverflow.com/questions/9506041/javascript-events-mouseup-not-firing-after-mousemove

        var initalMouseY = e.pageY,
            initalValue = self.value,
            unbindListeners = function () {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', unbindListeners);
            },
            handleMouseMove = function (e) {
              self.mouseMoveValueChange(e, initalValue, initalMouseY);
            }

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', unbindListeners);
      });

      this.input.addEventListener('blur', function () {
        self.keyboardInputValueChange();
      });
    },
    mouseMoveValueChange: function (e, initalValue, initalMouseY) {
      var mouseMoveDiff,
          valueDiffAfterMove,
          finalValue;

      e.preventDefault();
      mouseMoveDiff = -(e.pageY - initalMouseY); // if mouse goes up, value increases
      valueDiffAfterMove = Math.round(mouseMoveDiff / this.pxPerStep) * this.options.step;
      finalValue = initalValue + valueDiffAfterMove;

      this.value = finalValue;
      this.validateValue();

      this.updateView();
    },
    keyboardInputValueChange: function () {
      this.value = parseFloat(this.input.value);
      this.validateValue();
      this.updateView();
    },
    updateView: function () {
      this.updateCricleView();
      this.updateInputView();
    },
    updateCricleView: function () {
      var valueProgress,
          activeAngle;

      valueProgress = this.value / (this.options.max - this.options.min);
      activeAngle = valueProgress * circularRange.DISPLAY.arcAngle;

      this.indicator.style.transform = this.getRotateStyle(activeAngle);
      this.activeArc.setAttribute('d', this.describeArc(activeAngle));
    },
    updateInputView: function () {
      this.input.value = this.value;
    },
    getRotateStyle: function (angle) {
      var additionalRotation = (360 - circularRange.DISPLAY.arcAngle) / 2;
      return  'rotate(' + (angle + additionalRotation) + 'deg)';
    },
    describeArc: function (angle) {
      var additionalRotation = 90 + (360 - circularRange.DISPLAY.arcAngle) / 2,
          x = circularRange.DISPLAY.boxSize / 2,
          y = circularRange.DISPLAY.boxSize / 2;
      return describeArc(x, y, circularRange.DISPLAY.arcRadius, additionalRotation, angle + additionalRotation);
    },
    validateValue: function () {
      this.value = this.options.min + Math.round((this.value - this.options.min) / this.options.step) * this.options.step;

      this.value = this.value <= this.options.max ? this.value : this.options.max;
      this.value = this.value >= this.options.min ? this.value : this.options.min;
    }
  };

  return circularRange;
});
