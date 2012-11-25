/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/Vector.js
 */

/**
 * Class: OpenLayers.Layer.PointTrack
 * Vector layer to display ordered point features as a line, creating one
 * LineString feature for each pair of two points.
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Vector> 
 */
OpenLayers.Layer.PointTrack = OpenLayers.Class(OpenLayers.Layer.Vector, {
  
    /**
     * APIProperty: dataFrom
     *     {<OpenLayers.Layer.PointTrack.TARGET_NODE>} or
     *     {<OpenLayers.Layer.PointTrack.SOURCE_NODE>} optional. If the lines
     *     should get the data/attributes from one of the two points it is
     *     composed of, which one should it be?
     */
    dataFrom: null,
    
    /**
     * APIProperty: styleFrom
     *     {<OpenLayers.Layer.PointTrack.TARGET_NODE>} or
     *     {<OpenLayers.Layer.PointTrack.SOURCE_NODE>} optional. If the lines
     *     should get the style from one of the two points it is composed of,
     *     which one should it be?
     */
    styleFrom: null,
    
    /**
     * http://gaganb.wordpress.com/2010/09/30/draw-line-direction-on-openlayers-feature/
     * http://geometricnet.sourceforge.net/examples/directions.html
     * http://geometricnet.sourceforge.net/examples/Direction.js
     * 
     * APIMethod: createDirection
     * Create direction symbol point {<openLayers.Feature.Vector>} of the line 
     * with attribute as angle (degree) for given position(s) on line 
     * Parameter:
     * line - {<OpenLayers.Geometry.LineString>} or {<OpenLayers.Geometry.MultiLineString>}
     * postion - {string} 
     *		"start" - start of the geometry / segment
     *		"end" - end of geometry / segment
     *		"middle" - middle of geometry /segment
     * forEachSegment - {boolean}
     *	if true create points on each segments of line for given position
     */
    createDirection: function(line,position,forEachSegment) {
    	if (line instanceof OpenLayers.Geometry.MultiLineString) {
    		//TODO
    	} else if (line instanceof OpenLayers.Geometry.LineString) {
    		return this.createLineStringDirection(line,position,forEachSegment);
    	} else {
    		return [];
    	}
    },
    
    createLineStringDirection: function(line,position, forEachSegment){
    	if (position == undefined ){ position ="end"}
    	if (forEachSegment == undefined ) {forEachSegment = false;}
    	var points =[];
    	//var allSegs = line.getSortedSegments();
    	var allSegs = this.getSegments(line);
    	var segs = [];

    	if (forEachSegment)	{		
    		segs = allSegs;
    	} else {
    		if  (position == "start") {
    			segs.push(allSegs[0]);
    		} else if (position == "end") {
    			segs.push(allSegs[allSegs.length-1]);
    		} else if (position == "middle"){
    			return [this.getPointOnLine(line,.5)];
    		} else {
    			return [];
    		}
    	}
    	for (var i=0;i<segs.length ;i++ )	{
    		points = points.concat(this.createSegDirection(segs[i],position) );
    	}
    	return points;
    },

    createSegDirection: function(seg,position) {
    	var segBearing = this.bearing(seg);
    	var positions = [];
    	var points = [];
    	if  (position == "start") {
    		positions.push([seg.x1,seg.y1]);
    	} else if (position == "end") {
    		positions.push([seg.x2,seg.y2]);
    	} else if (position == "middle") {
    		positions.push([(seg.x1+seg.x2)/2,(seg.y1+seg.y2)/2]);
    	} else {
    		return null;
    	}
    	for (var i=0;i<positions.length;i++ ){
    		var pt = new OpenLayers.Geometry.Point(positions[i][0],positions[i][1]);//.transform(this.projLatLon,this.projMap);
    		var ptFeature = new OpenLayers.Feature.Vector(pt,{angle:segBearing}); 
    		points.push(ptFeature);
    	}
    	return points;	
    },

    bearing: function(seg) {
    	b_x = 0;
    	b_y = 1;
    	a_x = seg.x2 - seg.x1;
    	a_y = seg.y2 - seg.y1;
    	angle_rad = Math.acos((a_x*b_x+a_y*b_y)/Math.sqrt(a_x*a_x+a_y*a_y)) ;
    	angle = 360/(2*Math.PI)*angle_rad;
    	if (a_x < 0) {
    	    return 360 - angle;
    	} else {
    	    return angle;
    	}
    },

    getPointOnLine: function (line,measure) {
        var segs = this.getSegments(line);
        var lineLength = line.getLength();
        var measureLength = lineLength*measure;
        var length = 0;
    	var partLength=0;
        for (var i=0;i<segs.length ;i++ ) {
            var segLength = this.getSegmentLength(segs[i]);        
            if (measureLength < length + segLength) {
    			partLength = measureLength - length;
    			var x = segs[i].x1 + (segs[i].x2 - segs[i].x1) * partLength/segLength;
    			var y = segs[i].y1 + (segs[i].y2 - segs[i].y1) * partLength/segLength;
    			var segBearing = this.bearing(segs[i]);
    			console.log("x: " + x+", y: " + y + ", this.bearing: " + segBearing);
    			var pt = new OpenLayers.Geometry.Point(x,y);
    			var ptFeature = new OpenLayers.Feature.Vector(pt,{angle:segBearing}); 
    			return ptFeature;
            } 
    		length = length + segLength;
        }
    	return false;
    },

    getSegmentLength: function(seg) {
        return Math.sqrt( Math.pow((seg.x2 -seg.x1),2) + Math.pow((seg.y2 -seg.y1),2) );
    },

    getSegments: function(line) {	
    	var numSeg = line.components.length - 1;
    	var segments = new Array(numSeg), point1, point2;
    	for(var i=0; i<numSeg; ++i) {
    	    point1 = line.components[i];
    	    point2 = line.components[i + 1];
    	    segments[i] = {
    	        x1: point1.x,
    	        y1: point1.y,
    	        x2: point2.x,
    	        y2: point2.y
    	    };
    	}
    	return segments;
    },
    
    /**
     * Constructor: OpenLayers.PointTrack
     * Constructor for a new OpenLayers.PointTrack instance.
     *
     * Parameters:
     * name     - {String} name of the layer
     * options  - {Object} Optional object with properties to tag onto the
     *            instance.
     */    
        
    /**
     * APIMethod: addNodes
     * Adds point features that will be used to create lines from, using point
     * pairs. The first point of a pair will be the source node, the second
     * will be the target node.
     * 
     * Parameters:
     * pointFeatures - {Array(<OpenLayers.Feature>)}
     * options - {Object}
     * 
     * Supported options:
     * silent - {Boolean} true to suppress (before)feature(s)added events
     */
    addNodes: function(pointFeatures, options) {
        if (pointFeatures.length < 2) {
            throw new Error("At least two point features have to be added to " +
                            "create a line from");
        }
        
        var lines = new Array(pointFeatures.length-1);
        var points = [];
        
        var pointFeature, startPoint, endPoint;
//        for(var i=0, len=pointFeatures.length; i<len; i++) { //original code
        for(var i=pointFeatures.length-1; i>=0; i--) {
            pointFeature = pointFeatures[i];
            endPoint = pointFeature.geometry;
            
            if (!endPoint) {
              var lonlat = pointFeature.lonlat;
              endPoint = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
            } else if(endPoint.CLASS_NAME != "OpenLayers.Geometry.Point") {
                throw new TypeError("Only features with point geometries are supported.");
            }
            
            if(i > 0) {
                var attributes = (this.dataFrom != null) ?
                        (pointFeatures[i+this.dataFrom].data ||
                                pointFeatures[i+this.dataFrom].attributes) :
                        null;
                var style = (this.styleFrom != null) ?
                        (pointFeatures[i+this.styleFrom].style) :
                        null;
                var line = new OpenLayers.Geometry.LineString([startPoint,
                        endPoint]);

                var linePoints = this.createLineStringDirection(line, "end", true );
                points = points.concat(linePoints);
                	
                lines[i-1] = new OpenLayers.Feature.Vector(line, attributes,
                    style);
            }
            
            startPoint = endPoint;
        }

        lines = lines.concat(points);
        
        this.addFeatures(lines, options);
    },
    
    CLASS_NAME: "OpenLayers.Layer.PointTrack"
});

/**
 * Constant: OpenLayers.Layer.PointTrack.SOURCE_NODE
 * {Number} value for <OpenLayers.Layer.PointTrack.dataFrom> and
 * <OpenLayers.Layer.PointTrack.styleFrom>
 */
OpenLayers.Layer.PointTrack.SOURCE_NODE = -1;

/**
 * Constant: OpenLayers.Layer.PointTrack.TARGET_NODE
 * {Number} value for <OpenLayers.Layer.PointTrack.dataFrom> and
 * <OpenLayers.Layer.PointTrack.styleFrom>
 */
OpenLayers.Layer.PointTrack.TARGET_NODE = 0;

/**
 * Constant: OpenLayers.Layer.PointTrack.dataFrom
 * {Object} with the following keys - *deprecated*
 * - SOURCE_NODE: take data/attributes from the source node of the line
 * - TARGET_NODE: take data/attributes from the target node of the line
 */
OpenLayers.Layer.PointTrack.dataFrom = {'SOURCE_NODE': -1, 'TARGET_NODE': 0};
