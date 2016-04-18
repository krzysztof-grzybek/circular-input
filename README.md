# circular-input
Highly customizable circular input.

__<a href="http://krzysztof-grzybek.github.io/circular-input" target="_blank">Demo Page</a>__

Usage
-------

Include circularInput.min.js from dist folder in your html page.
~~~~ html
<script src="circularInput.min.js"></script>
~~~~

Add one of the css file from dist folder, or create your own.

~~~~ html
<link href="circularInput.css" type="text/css" rel="stylesheet" />
~~~~

~~~~ javascript
var circulatInputObject = circularInput(domEl, options);
~~~~

__Arguments:__
* domEl: HTMLElement or HTMLCollection
* options: Object (optional)

__Options:__
* min: min input value
* max: max input value
* step: input value step
* sensivity: 'mousemove to value' sensivity
* theme: name of theme will be added to html/svg classes in BEM standard
* svgDefs: additional svg defs that you want to use

Library supports AMD module loaders.

Example:

~~~~ javascript
  var myInput = document.getElementsByClassName('my-input');
  circularInput(myInput, {
    min: 0,
    max: 10,
    step: 1,
    sensivity: 100,
    theme: 'my-theme',
    svgDefs: ''
  });
~~~~

Default options:

~~~~ javascript
var defaults = {
    min: 0,
    max: 100,
    step: 5,
    sensivity: 100,
    theme: '',
    svgDefs: '',
};
~~~~
