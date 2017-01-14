'use strict';

var Circular = function(selector) {
    this.element = document.querySelector(selector);
    this.displays = {};
}
Circular.prototype.redraw = function() {
    this._clear();
    for (var name in this.displays) {
        for (var i = 0; i < this.displays[name].length; i++) {
            this._drawSegment(this.displays[name][i]);
        }
    }
}
Circular.prototype.updateDisplay = function(name, segments) {
    this.displays[name] = segments;
    this.redraw();
}

Circular.prototype._clear = function() {
    var el = this.element;
    this.element = el.cloneNode(false);
    var parentElement = el.parentElement;
    parentElement.removeChild(el);
    parentElement.appendChild(this.element);
}
Circular.prototype._drawSegment = function(segment) {
    var scale = segment.scale || 1;
    var width = segment.width || .03;
    var start = segment.start || 0;
    var end = segment.end === undefined ? 2 * Math.pi : segment.end;
    var colour = segment.colour || 'white';
    var toEucl = function(rad, scale) {
        if (scale === undefined) scale = 1;
        return (scale * Math.sin(rad)) + ' ' + (scale * -Math.cos(rad));
    };
    var lineSeg = 'M ' + toEucl(start, scale); 
    for (var i = start; i < end; i += .05)
        lineSeg += ' L ' + toEucl(i, scale);
    lineSeg += ' L ' + toEucl(end, scale);
    this._appendSVGPath({
        d: lineSeg,
        stroke: colour,
        fill: 'none',
        'stroke-width': width
    });
    if (segment.startTick) {
        this._appendSVGPath({
            d: 'M ' + toEucl(start, scale * .95) + ' L ' + toEucl(start, scale * 1.1),
            stroke: colour,
            fill: 'none',
            'stroke-width': '.02'
        });
    }
}
Circular.prototype._appendSVGPath = function(attrs) {
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    for (var key in attrs) {
        path.setAttributeNS(null, key, attrs[key]);
    }
    this.element.appendChild(path);
}


