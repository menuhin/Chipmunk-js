/* Copyright (c) 2007 Scott Lembcke
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

Object.create = Object.create || function(o) {
	function F() {}
	F.prototype = o;
	return new F();
};
 
//var VERSION = CP_VERSION_MAJOR + "." + CP_VERSION_MINOR + "." + CP_VERSION_RELEASE;

var assert = function(value, message)
{
	if (!value) {
		throw new Error('Assertion failed: ' + message);
	}
};

var assertSoft = function(value, message)
{
	if(!value && console && console.warn) {
		console.warn("ASSERTION FAILED: " + message);
	}
};

var hashPair = function(a, b)
{
	return a + ' ' + b;
};

var Contact = function(p, n, dist, hash)
{
	this.p = p;
	this.n = n;
	this.dist = dist;
	
	this.r1 = this.r2 = vzero;
	this.nMass = this.tMass = this.bounce = this.bias = 0;

	this.jnAcc = this.jtAcc = this.jBias = 0;
	
	this.hash = hash;
};

var deleteObjFromList = function(arr, obj)
{
	for(var i=0; i<arr.length; i++){
		if(arr[i] === obj){
			arr[i] = arr[arr.length - 1];
			arr.length--;
			
			return;
		}
	}
};

exports.momentForCircle = function(m, r1, r2, offset)
{
	return m*(0.5*(r1*r1 + r2*r2) + vlengthsq(offset));
};

exports.areaForCircle = function(r1, r2)
{
	return Math.PI*Math.abs(r1*r1 - r2*r2);
};

exports.momentForSegment = function(m, a, b)
{
	var length = vlength(vsub(b, a));
	var offset = vmult(vadd(a, b), 1/2);
	
	return m*(length*length/12 + vlengthsq(offset));
};

exports.areaForSegment = function(a, b, r)
{
	return r*(Math.PI*r + 2*vdist(a, b));
};

exports.momentForPoly = function(m, verts, offset)
{
	var sum1 = 0;
	var sum2 = 0;
	for(var i=0, len=verts.length; i<len; i++){
		var v1 = vadd(verts[i], offset);
		var v2 = vadd(verts[(i+1)%len], offset);
		
		var a = vcross(v2, v1);
		var b = vdot(v1, v1) + vdot(v1, v2) + vdot(v2, v2);
		
		sum1 += a*b;
		sum2 += a;
	}
	
	return (m*sum1)/(6*sum2);
};

exports.areaForPoly = function(verts)
{
	var area = 0;
	for(var i=0, len=verts.length; i<len; i++){
		area += vcross(verts[i], verts[(i+1)%len]);
	}
	
	return -area/2;
};

exports.centroidForPoly = function(verts)
{
	var sum = 0;
	var vsum = [0,0];
	
	for(var i=0, len=verts.length; i<len; i++){
		var v1 = verts[i];
		var v2 = verts[(i+1)%len];
		var cross = vcross(v1, v2);
		
		sum += cross;
		vsum = vadd(vsum, vmult(vadd(v1, v2), cross));
	}
	
	return vmult(vsum, 1/(3*sum));
};

exports.recenterPoly = function(verts)
{
	var centroid = centroidForPoly(verts);
	
	for(var i=0; i<verts.length; i++){
		verts[i] = vsub(verts[i], centroid);
	}
};

exports.momentForBox = function(m, width, height)
{
	return m*(width*width + height*height)/12;
};

exports.momentForBox2 = function(m, box)
{
	width = box.r - box.l;
	height = box.t - box.b;
	offset = vmult([box.l + box.r, box.b + box.t], 0.5);
	
	return momentForBox(m, width, height) + m*vlengthsq(offset);
};

/// Clamp @c f to be between @c min and @c max.
var clamp = function(f, min, max)
{
	return Math.min(Math.max(f, min), max);
};

/// Clamp @c f to be between 0 and 1.
var clamp01 = function(f)
{
	return Math.max(0, Math.min(f, 1));
};

/// Linearly interpolate (or extrapolate) between @c f1 and @c f2 by @c t percent.
var lerp = function(f1, f2, t)
{
	return f1*(1 - t) + f2*t;
};

/// Linearly interpolate from @c f1 to @c f2 by no more than @c d.
var lerpconst = function(f1, f2, d)
{
	return f1 + clamp(f2 - f1, -d, d);
};
