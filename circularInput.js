(function (factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = factory();
  } else {
    window.circularInput = factory();
  }

})(function () {
  'use strict';

  var elementsAmount = 0,
      uid = 'circularInput' + new Date().getTime(),
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

  function stringToSvg (string) {
    var div,
        frag;
    div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg">' + string + '</svg>';
    frag = document.createDocumentFragment();
    while (div.firstChild.firstChild) {
      frag.appendChild(div.firstChild.firstChild);
    }
    return frag;
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
    var angleInRadians = (angleInDegrees) * Math.PI / 180.0;

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

  var triggerEvent = (function () {
    if (document.createEvent) {
      return function (target, type) {
        var event = document.createEvent('Event');
        event.initEvent(type, true, true);
        target.dispatchEvent(event);
      }
    } else {
      return function (target, type) {
        var event = document.createEventObject();
        target.fireEvent('on' + type, event);
      }
    }
  })();

  function getDecimalPartLength (number) {
    var numberParts = number.toString().split('.');
    if (numberParts.length === 1) {
      return 0;
    } else if (numberParts.length > 1){
      return numberParts.pop().length;
    }
  }

  function roundTo (value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
  }

  function circularInput (element, options) {
    if (!(this instanceof circularInput)) { // force 'new' keyword
      return new circularInput(element, options);
    }

    if (isNodeList(element)) {
      var elementsArray = [];
      for (var i = 0; i < element.length; i++) {
        elementsArray.push(new circularInput(element[i], options));
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

    this.options = extend({}, circularInput.DEFAULTS);
    this.options = extend(this.options, this.getDomOptions());
    this.options = extend(this.options, options);

    this.value = this.input.value ? Number(this.input.value) : this.options.min;
    this.pxPerStep = this.options.sensivity / ((this.options.max - this.options.min) / this.options.step);
    this.decimalPartLength = getDecimalPartLength(this.options.step);

    this.init();
    return this;
  }

  circularInput.DEFAULTS = {
    min: 0,
    max: 100,
    step: 5,
    sensivity: 100,
    theme: '',
    svgDefs: '',
  };

  circularInput.CLASS_NAMES = {
    meter: 'circ-input__meter',
    circle: 'circ-input__circle',
    basicArc: 'circ-input__basic-arc',
    activeArc: 'circ-input__active-arc',
    indicator: 'circ-input__indicator'
  };

  circularInput.DISPLAY = {
    arcAngle: 300,
    arcRadius: 14,
    boxSize: 36
  };

  circularInput.domStrings = {
    container: '<div class="circ-input"></div>',
    svg : ['<svg class="circ-input__svg" ',
             'viewBox="0 0 ', circularInput.DISPLAY.boxSize, ' ', circularInput.DISPLAY.boxSize , '" ',
             'version="1.1" xmlns="http://www.w3.org/2000/svg">',
               '<defs></defs>',
               '<path class="', circularInput.CLASS_NAMES.meter,'"></path>',
               '<circle ',
                 'cx="', circularInput.DISPLAY.boxSize/2, '" ',
                 'cy="', circularInput.DISPLAY.boxSize/2, '" r="14" ',
                 'class="', circularInput.CLASS_NAMES.circle,'"></circle>',
               '<path class="', circularInput.CLASS_NAMES.basicArc, '"></path>',
               '<path class="', circularInput.CLASS_NAMES.activeArc, '"></path>',
               '<line class="', circularInput.CLASS_NAMES.indicator, '" x1="0" y1="0" x2="0" y2="', circularInput.DISPLAY.arcRadius, '"></line>',
           '</svg>'].join('')
  };

  circularInput.prototype = {
    getDomOptions: function () {
      var domOptions = {},
          optionNames = Object.keys(circularInput.DEFAULTS);

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
      var container = stringToDom(circularInput.domStrings.container)[0],
          circle,
          meter,
          basicArc,
          defs;

      this.input.parentNode.insertBefore(container, this.input);
      container.innerHTML = circularInput.domStrings.svg;
      container.appendChild(this.input);

      this.svgEl = container.firstChild;
      this.indicator = container.getElementsByClassName(circularInput.CLASS_NAMES.indicator)[0];
      this.activeArc = container.getElementsByClassName(circularInput.CLASS_NAMES.activeArc)[0];
      defs = container.getElementsByTagName('defs')[0];

      circle = container.getElementsByClassName(circularInput.CLASS_NAMES.circle)[0];
      circle.setAttribute('d', this.describeArc(359));
      meter = container.getElementsByClassName(circularInput.CLASS_NAMES.basicArc)[0];
      meter.setAttribute('d', this.describeArc(circularInput.DISPLAY.arcAngle));
      basicArc = container.getElementsByClassName(circularInput.CLASS_NAMES.meter)[0];
      basicArc.setAttribute('d', this.describeArc(circularInput.DISPLAY.arcAngle, circularInput.DISPLAY.arcRadius + 2));

      if (this.options.theme) {
        container.className += ' circ-input--' + this.options.theme;
      }

      defs.appendChild(stringToSvg(this.options.svgDefs));
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

      this.svgEl.addEventListener('touchmove', function (e) {
        e.preventDefault();
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
      this.setValue(finalValue);
    },
    keyboardInputValueChange: function () {
      var value = parseFloat(this.input.value);
      this.setValue(value);
    },
    updateView: function () {
      this.updateCricleView();
      this.updateInputView();
    },
    updateCricleView: function () {
      var valueProgress,
          activeAngle,
          rotation,
          translation;

      valueProgress = this.value / (this.options.max - this.options.min);
      activeAngle = valueProgress * circularInput.DISPLAY.arcAngle;
      rotation = this.getIndicatorRotation(activeAngle);
      translation = this.getIndicatorTranslation();

      this.indicator.setAttribute('transform', translation + ' ' + rotation);
      this.activeArc.setAttribute('d', this.describeArc(activeAngle));
    },
    setValue: function (value) {
      this.value = this.validateValue(value);
      this.updateView();
    },
    updateInputView: function () {
      this.input.value = this.value.toFixed(this.decimalPartLength);
      triggerEvent(this.input, 'change');
    },
    getIndicatorRotation: function (angle) {
      var additionalRotation = (360 - circularInput.DISPLAY.arcAngle) / 2;
      return  'rotate(' + (angle + additionalRotation) + ' 0 0)';
    },
    getIndicatorTranslation: function () {
      var translationVal = circularInput.DISPLAY.boxSize / 2;
      return 'translate(' + translationVal + ' ' + translationVal + ')';
    },
    describeArc: function (angle, radius) {
      var additionalRotation = 90 + (360 - circularInput.DISPLAY.arcAngle) / 2,
          x = circularInput.DISPLAY.boxSize / 2,
          y = circularInput.DISPLAY.boxSize / 2,
          radius = typeof radius !== 'undefined' ? radius : circularInput.DISPLAY.arcRadius;
      return describeArc(x, y, radius, additionalRotation, angle + additionalRotation);
    },
    validateValue: function (value) {
      value = this.options.min + Math.round((value - this.options.min) / this.options.step) * this.options.step;

      value = value <= this.options.max ? value : this.options.max;
      value = value >= this.options.min ? value : this.options.min;
      return roundTo(value, this.decimalPartLength);
    }
  };

  return circularInput;
});
