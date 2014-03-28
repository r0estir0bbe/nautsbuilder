/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
_.mixin({
	//https://github.com/epeli/underscore.string
	//pass "a_string_like_this" and get "A String Like This"
	capitalized: function(string) {
		if (!_.isString(string)) return false;
		return string.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, function(c){ return c.toUpperCase(); });
	},
	//pass "A String like this" and get "A_String_like_this"
	underscored: function(string) {
		if (!_.isString(string)) return false;
		return string.replace(/[\s]+/g, '_');
	},

	//pass "A_string_Like_this" and get "A string Like this"
	ununderscored: function(string) {
		if (!_.isString(string)) return false;
		return string.replace(/_/g, ' ');
	},

	//http://stackoverflow.com/questions/3000649/trim-spaces-from-start-and-end-of-string
	trim: function(string, characters) {
		if (!string) return '';
		characters = characters || null;
		if (typeof String.prototype.trim != 'function' || characters) {
			var pattern = characters ? characters : '\\s';
			return String(string).replace(new RegExp('^' + pattern + '+|' + pattern + '+$', 'g'), '');
		} else {
			return string.trim();
		}
	},

	//kinda markdown style: pass *this* and get <em>this</em>
	italics: function(string) {
		if (!string) return '';
		return string.replace(/\n/g, "<br>").replace(/\*(.*)\*/, '<em>$1</em>');
	}
});

//http://ianstormtaylor.com/rendering-views-in-backbonejs-isnt-always-simple/
Backbone.View.prototype.assign = function(view, selector) {
	view.setElement(this.$(selector)).render();
};

Backbone.Model.prototype.toJSON = function(options) {
	return _.extend({}, _.clone(this.attributes), { cid: this.cid });
};

window.leiminauts = window.leiminauts || {};

leiminauts.utils = {
	//takes a string like "damage: +2; crit chance: +15%" and returns an array like [{damage: "+2"}, {"crit chance": "+15%"}]
	treatEffects: function(effectsString) {
		var effects = [];
		if (!_(effectsString).isString()) return effectsString;
		var attributes = effectsString.toLowerCase().split(';');
		_(attributes).each(function(attr, i) {
			attribute = _(attr).trim().split(':');
			// [0] is the attribute (ex: "damage"), [1] is the value (ex: "+9")
			// we gently assume there is only one ":" in the string, otherwise EVERYTHING IS BORKENNNNNN
			attribute[0] = _(attribute[0]).trim();
			attribute[1] = _(attribute[1]).trim();
			if (!attribute[0] && !attribute[1]) {
				attributes.splice(i, 1);
			} else {
				effects.push({key: attribute[0], value: attribute[1]});
			}
		}, this);
		return effects;
	},

	number: function(number, decimals) {
		number = number*1;
		if (_(number).isNaN()) return number;
		decimals = decimals || 2;
		return number % 1 !== 0 ? number.toFixed(decimals) : number;
	},

	dps: function(damage, speed) {
		return leiminauts.utils.number( (parseFloat(speed)/60*parseFloat(damage)).toFixed(2) );
	},
	
	intToString: function(number, base) {
		if (!number && (typeof number !== "number" || typeof number !== "object")) {
			return "";
		}
		
		base = (typeof base !== "undefined" ? base : 10);
		if (base <= 36) {
			return number.toString(base).toLowerCase();
		}

		if (base > 62) {
			throw new RangeError("radix out of range");
		}
		
		var str = [];
		
		var isBigInt = typeof number !== "number";
		if (isBigInt) {
			var u = number.abs();
			do {
				var newu = u.divide(base);
				var index = u.subtract(newu.multiply(base)).toJSValue();
				str.push("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(index));
				u = newu;
			} while (!u.isZero());
		}
		else {
			var u = Math.abs(number);
			do {
				var newu = Math.floor(u / base);
				var index = u - newu * base;
				str.push("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(index));
				u = newu;
			} while (u != 0);
		}

		var isNegative = isBigInt ? number.isNegative() : number < 0;
		if (isNegative) {
			str.push('-');
		}
	
		return str.reverse().join('');
	},
	
	stringToInt: function(string, base, useBigInt) {
		base = (typeof base !== "undefined" ? base : 10);
	
		if (base <= 36) {
			return useBigInt ? BigInteger.parse(string, base) : parseInt(string, base);
		}
		
		if (base > 62) {
			throw new RangeError("radix out of range");
		}	
		
		var first = string.charAt('0');
		var negative = string.charAt('0') == '-';
		if (negative || string.charAt('0') == '+') {
			string = string.substr(1);
		}
	
		var result = (useBigInt ? BigInteger(0) : 0);				
		for (i = 0; i < string.length; i++) {
			var digit;
			var c = string.charAt(i);
			var code = string.charCodeAt(i);
			if ('0' <= c && c <= '9')
				digit = code - '0'.charCodeAt();
			else if ('a' <= c && c <= 'z')
				digit = code - 'a'.charCodeAt() + 10;
			else if ('A' <= c && c <= 'Z')
				digit = code - 'A'.charCodeAt() + 10 + 26;
			else
				break;
				
			if (digit >= base) //FIXME: why is this check here?
				break;
			
			if (useBigInt) {
				result = result.multiply(base).add(digit);
			}
			else {
				result = result * base + digit;
			}
		}
		
		if (negative) {
			return (useBigInt ? result.negate() : -result);
		}
		else {
			return result;
		};
	}
};
