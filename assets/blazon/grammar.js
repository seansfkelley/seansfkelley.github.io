// Generated by Peggy 3.0.2.
//
// https://peggyjs.org/
(function(root) {
  "use strict";

function peg$subclass(child, parent) {
  function C() { this.constructor = child; }
  C.prototype = parent.prototype;
  child.prototype = new C();
}

function peg$SyntaxError(message, expected, found, location) {
  var self = Error.call(this, message);
  // istanbul ignore next Check is a necessary evil to support older environments
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(self, peg$SyntaxError.prototype);
  }
  self.expected = expected;
  self.found = found;
  self.location = location;
  self.name = "SyntaxError";
  return self;
}

peg$subclass(peg$SyntaxError, Error);

function peg$padEnd(str, targetLength, padString) {
  padString = padString || " ";
  if (str.length > targetLength) { return str; }
  targetLength -= str.length;
  padString += padString.repeat(targetLength);
  return str + padString.slice(0, targetLength);
}

peg$SyntaxError.prototype.format = function(sources) {
  var str = "Error: " + this.message;
  if (this.location) {
    var src = null;
    var k;
    for (k = 0; k < sources.length; k++) {
      if (sources[k].source === this.location.source) {
        src = sources[k].text.split(/\r\n|\n|\r/g);
        break;
      }
    }
    var s = this.location.start;
    var offset_s = (this.location.source && (typeof this.location.source.offset === "function"))
      ? this.location.source.offset(s)
      : s;
    var loc = this.location.source + ":" + offset_s.line + ":" + offset_s.column;
    if (src) {
      var e = this.location.end;
      var filler = peg$padEnd("", offset_s.line.toString().length, ' ');
      var line = src[s.line - 1];
      var last = s.line === e.line ? e.column : line.length + 1;
      var hatLen = (last - s.column) || 1;
      str += "\n --> " + loc + "\n"
          + filler + " |\n"
          + offset_s.line + " | " + line + "\n"
          + filler + " | " + peg$padEnd("", s.column - 1, ' ')
          + peg$padEnd("", hatLen, "^");
    } else {
      str += "\n at " + loc;
    }
  }
  return str;
};

peg$SyntaxError.buildMessage = function(expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
    literal: function(expectation) {
      return "\"" + literalEscape(expectation.text) + "\"";
    },

    class: function(expectation) {
      var escapedParts = expectation.parts.map(function(part) {
        return Array.isArray(part)
          ? classEscape(part[0]) + "-" + classEscape(part[1])
          : classEscape(part);
      });

      return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]";
    },

    any: function() {
      return "any character";
    },

    end: function() {
      return "end of input";
    },

    other: function(expectation) {
      return expectation.description;
    }
  };

  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }

  function literalEscape(s) {
    return s
      .replace(/\\/g, "\\\\")
      .replace(/"/g,  "\\\"")
      .replace(/\0/g, "\\0")
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/[\x00-\x0F]/g,          function(ch) { return "\\x0" + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return "\\x"  + hex(ch); });
  }

  function classEscape(s) {
    return s
      .replace(/\\/g, "\\\\")
      .replace(/\]/g, "\\]")
      .replace(/\^/g, "\\^")
      .replace(/-/g,  "\\-")
      .replace(/\0/g, "\\0")
      .replace(/\t/g, "\\t")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/[\x00-\x0F]/g,          function(ch) { return "\\x0" + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return "\\x"  + hex(ch); });
  }

  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }

  function describeExpected(expected) {
    var descriptions = expected.map(describeExpectation);
    var i, j;

    descriptions.sort();

    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }

    switch (descriptions.length) {
      case 1:
        return descriptions[0];

      case 2:
        return descriptions[0] + " or " + descriptions[1];

      default:
        return descriptions.slice(0, -1).join(", ")
          + ", or "
          + descriptions[descriptions.length - 1];
    }
  }

  function describeFound(found) {
    return found ? "\"" + literalEscape(found) + "\"" : "end of input";
  }

  return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};

function peg$parse(input, options) {
  options = options !== undefined ? options : {};

  var peg$FAILED = {};
  var peg$source = options.grammarSource;

  var peg$startRuleFunctions = { Field: peg$parseField };
  var peg$startRuleFunction = peg$parseField;

  var peg$c0 = ".";
  var peg$c1 = "party";
  var peg$c2 = "per";
  var peg$c3 = "and";
  var peg$c4 = "on";
  var peg$c5 = "between";
  var peg$c6 = "a";
  var peg$c7 = "an";
  var peg$c8 = "s";
  var peg$c9 = "two";
  var peg$c10 = "three";
  var peg$c11 = "four";
  var peg$c12 = "five";
  var peg$c13 = "six";
  var peg$c14 = "seven";
  var peg$c15 = "eight";
  var peg$c16 = "nine";
  var peg$c17 = "ten";
  var peg$c18 = "eleven";
  var peg$c19 = "twelve";
  var peg$c20 = "pale";
  var peg$c21 = "fess";
  var peg$c22 = "palewise";
  var peg$c23 = "fesswise";
  var peg$c24 = "azure";
  var peg$c25 = "or";
  var peg$c26 = "argent";
  var peg$c27 = "gules";
  var peg$c28 = "vert";
  var peg$c29 = "sable";
  var peg$c30 = "bend";
  var peg$c31 = "sword";
  var peg$c32 = "rondel";
  var peg$c33 = "mullet";
  var peg$c34 = "ignore this because peggy breaks weirdly on the last rule here";

  var peg$r0 = /^[, \t\n\r]/;

  var peg$e0 = peg$literalExpectation(".", false);
  var peg$e1 = peg$literalExpectation("party", false);
  var peg$e2 = peg$literalExpectation("per", false);
  var peg$e3 = peg$literalExpectation("and", false);
  var peg$e4 = peg$literalExpectation("on", false);
  var peg$e5 = peg$literalExpectation("between", false);
  var peg$e6 = peg$literalExpectation("a", false);
  var peg$e7 = peg$literalExpectation("an", false);
  var peg$e8 = peg$literalExpectation("s", false);
  var peg$e9 = peg$literalExpectation("two", false);
  var peg$e10 = peg$literalExpectation("three", false);
  var peg$e11 = peg$literalExpectation("four", false);
  var peg$e12 = peg$literalExpectation("five", false);
  var peg$e13 = peg$literalExpectation("six", false);
  var peg$e14 = peg$literalExpectation("seven", false);
  var peg$e15 = peg$literalExpectation("eight", false);
  var peg$e16 = peg$literalExpectation("nine", false);
  var peg$e17 = peg$literalExpectation("ten", false);
  var peg$e18 = peg$literalExpectation("eleven", false);
  var peg$e19 = peg$literalExpectation("twelve", false);
  var peg$e20 = peg$literalExpectation("pale", false);
  var peg$e21 = peg$literalExpectation("fess", false);
  var peg$e22 = peg$literalExpectation("palewise", false);
  var peg$e23 = peg$literalExpectation("fesswise", false);
  var peg$e24 = peg$literalExpectation("azure", false);
  var peg$e25 = peg$literalExpectation("or", false);
  var peg$e26 = peg$literalExpectation("argent", false);
  var peg$e27 = peg$literalExpectation("gules", false);
  var peg$e28 = peg$literalExpectation("vert", false);
  var peg$e29 = peg$literalExpectation("sable", false);
  var peg$e30 = peg$literalExpectation("bend", false);
  var peg$e31 = peg$literalExpectation("sword", false);
  var peg$e32 = peg$literalExpectation("rondel", false);
  var peg$e33 = peg$literalExpectation("mullet", false);
  var peg$e34 = peg$literalExpectation("ignore this because peggy breaks weirdly on the last rule here", false);
  var peg$e35 = peg$otherExpectation("whitespace");
  var peg$e36 = peg$classExpectation([",", " ", "\t", "\n", "\r"], false, false);

  var peg$f0 = function(tincture, main) { return ["field", { tincture }, main] };
  var peg$f1 = function(direction, dexter, sinister, main) { return ["partyPerField", { direction, dexter, sinister }, main] };
  var peg$f2 = function(bg, fg) { return ["on", { bg, fg }] };
  var peg$f3 = function(bg, surround, fg) { return ["on", { bg, fg, surround }] };
  var peg$f4 = function(charge, tincture) { return [charge, { tincture, count: 1 }] };
  var peg$f5 = function(count, charge, repetition, tincture) { return [charge, { tincture, repetition, count }] };
  var peg$f6 = function() { return 2 };
  var peg$f7 = function() { return 3 };
  var peg$f8 = function() { return 4 };
  var peg$f9 = function() { return 5 };
  var peg$f10 = function() { return 6 };
  var peg$f11 = function() { return 7 };
  var peg$f12 = function() { return 8 };
  var peg$f13 = function() { return 9 };
  var peg$f14 = function() { return 10 };
  var peg$f15 = function() { return 11 };
  var peg$f16 = function() { return 12 };
  var peg$currPos = 0;
  var peg$savedPos = 0;
  var peg$posDetailsCache = [{ line: 1, column: 1 }];
  var peg$maxFailPos = 0;
  var peg$maxFailExpected = [];
  var peg$silentFails = 0;

  var peg$result;

  if ("startRule" in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
    }

    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }

  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }

  function offset() {
    return peg$savedPos;
  }

  function range() {
    return {
      source: peg$source,
      start: peg$savedPos,
      end: peg$currPos
    };
  }

  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }

  function expected(description, location) {
    location = location !== undefined
      ? location
      : peg$computeLocation(peg$savedPos, peg$currPos);

    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location
    );
  }

  function error(message, location) {
    location = location !== undefined
      ? location
      : peg$computeLocation(peg$savedPos, peg$currPos);

    throw peg$buildSimpleError(message, location);
  }

  function peg$literalExpectation(text, ignoreCase) {
    return { type: "literal", text: text, ignoreCase: ignoreCase };
  }

  function peg$classExpectation(parts, inverted, ignoreCase) {
    return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
  }

  function peg$anyExpectation() {
    return { type: "any" };
  }

  function peg$endExpectation() {
    return { type: "end" };
  }

  function peg$otherExpectation(description) {
    return { type: "other", description: description };
  }

  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos];
    var p;

    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }

      details = peg$posDetailsCache[p];
      details = {
        line: details.line,
        column: details.column
      };

      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }

        p++;
      }

      peg$posDetailsCache[pos] = details;

      return details;
    }
  }

  function peg$computeLocation(startPos, endPos, offset) {
    var startPosDetails = peg$computePosDetails(startPos);
    var endPosDetails = peg$computePosDetails(endPos);

    var res = {
      source: peg$source,
      start: {
        offset: startPos,
        line: startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line: endPosDetails.line,
        column: endPosDetails.column
      }
    };
    if (offset && peg$source && (typeof peg$source.offset === "function")) {
      res.start = peg$source.offset(res.start);
      res.end = peg$source.offset(res.end);
    }
    return res;
  }

  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) { return; }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildSimpleError(message, location) {
    return new peg$SyntaxError(message, null, null, location);
  }

  function peg$buildStructuredError(expected, found, location) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected, found),
      expected,
      found,
      location
    );
  }

  function peg$parseField() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14;

    s0 = peg$currPos;
    s1 = peg$parseTincture();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseMain();
      if (s3 === peg$FAILED) {
        s3 = null;
      }
      s4 = peg$parse_();
      if (input.charCodeAt(peg$currPos) === 46) {
        s5 = peg$c0;
        peg$currPos++;
      } else {
        s5 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e0); }
      }
      if (s5 === peg$FAILED) {
        s5 = null;
      }
      peg$savedPos = s0;
      s0 = peg$f0(s1, s3);
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5) === peg$c1) {
        s1 = peg$c1;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e1); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (input.substr(peg$currPos, 3) === peg$c2) {
          s3 = peg$c2;
          peg$currPos += 3;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e2); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          s5 = peg$parseDirection();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse_();
            s7 = peg$parseTincture();
            if (s7 !== peg$FAILED) {
              s8 = peg$parse_();
              if (input.substr(peg$currPos, 3) === peg$c3) {
                s9 = peg$c3;
                peg$currPos += 3;
              } else {
                s9 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$e3); }
              }
              if (s9 !== peg$FAILED) {
                s10 = peg$parse_();
                s11 = peg$parseTincture();
                if (s11 !== peg$FAILED) {
                  s12 = peg$parse_();
                  s13 = peg$parseMain();
                  if (s13 === peg$FAILED) {
                    s13 = null;
                  }
                  if (input.charCodeAt(peg$currPos) === 46) {
                    s14 = peg$c0;
                    peg$currPos++;
                  } else {
                    s14 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$e0); }
                  }
                  if (s14 === peg$FAILED) {
                    s14 = null;
                  }
                  peg$savedPos = s0;
                  s0 = peg$f1(s5, s7, s11, s13);
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }

    return s0;
  }

  function peg$parseMain() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

    s0 = peg$parseCharge();
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c4) {
        s1 = peg$c4;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e4); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        s3 = peg$parseSingularCharge();
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          s5 = peg$parseCharge();
          if (s5 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f2(s3, s5);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c4) {
          s1 = peg$c4;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e4); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          s3 = peg$parseSingularCharge();
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (input.substr(peg$currPos, 7) === peg$c5) {
              s5 = peg$c5;
              peg$currPos += 7;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$e5); }
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parse_();
              s7 = peg$parsePluralCharge();
              if (s7 !== peg$FAILED) {
                s8 = peg$parse_();
                s9 = peg$parseCharge();
                if (s9 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s0 = peg$f3(s3, s7, s9);
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
    }

    return s0;
  }

  function peg$parseCharge() {
    var s0;

    s0 = peg$parseSingularCharge();
    if (s0 === peg$FAILED) {
      s0 = peg$parsePluralCharge();
    }

    return s0;
  }

  function peg$parseSingularCharge() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$parseSingular();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseChargeName();
      if (s3 !== peg$FAILED) {
        s4 = peg$parse_();
        s5 = peg$parseTincture();
        if (s5 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f4(s3, s5);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseSingular() {
    var s0;

    if (input.charCodeAt(peg$currPos) === 97) {
      s0 = peg$c6;
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e6); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c7) {
        s0 = peg$c7;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e7); }
      }
    }

    return s0;
  }

  function peg$parsePluralCharge() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8;

    s0 = peg$currPos;
    s1 = peg$parsePlural();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      s3 = peg$parseChargeName();
      if (s3 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 115) {
          s4 = peg$c8;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e8); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parse_();
          s6 = peg$parseRepetition();
          if (s6 === peg$FAILED) {
            s6 = null;
          }
          s7 = peg$parse_();
          s8 = peg$parseTincture();
          if (s8 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f5(s1, s3, s6, s8);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsePlural() {
    var s0, s1;

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 3) === peg$c9) {
      s1 = peg$c9;
      peg$currPos += 3;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e9); }
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$f6();
    }
    s0 = s1;
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5) === peg$c10) {
        s1 = peg$c10;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e10); }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$f7();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 4) === peg$c11) {
          s1 = peg$c11;
          peg$currPos += 4;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e11); }
        }
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$f8();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 4) === peg$c12) {
            s1 = peg$c12;
            peg$currPos += 4;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e12); }
          }
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f9();
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 3) === peg$c13) {
              s1 = peg$c13;
              peg$currPos += 3;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$e13); }
            }
            if (s1 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$f10();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.substr(peg$currPos, 5) === peg$c14) {
                s1 = peg$c14;
                peg$currPos += 5;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$e14); }
              }
              if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$f11();
              }
              s0 = s1;
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.substr(peg$currPos, 5) === peg$c15) {
                  s1 = peg$c15;
                  peg$currPos += 5;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$e15); }
                }
                if (s1 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$f12();
                }
                s0 = s1;
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  if (input.substr(peg$currPos, 4) === peg$c16) {
                    s1 = peg$c16;
                    peg$currPos += 4;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$e16); }
                  }
                  if (s1 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$f13();
                  }
                  s0 = s1;
                  if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    if (input.substr(peg$currPos, 3) === peg$c17) {
                      s1 = peg$c17;
                      peg$currPos += 3;
                    } else {
                      s1 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$e17); }
                    }
                    if (s1 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$f14();
                    }
                    s0 = s1;
                    if (s0 === peg$FAILED) {
                      s0 = peg$currPos;
                      if (input.substr(peg$currPos, 6) === peg$c18) {
                        s1 = peg$c18;
                        peg$currPos += 6;
                      } else {
                        s1 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$e18); }
                      }
                      if (s1 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$f15();
                      }
                      s0 = s1;
                      if (s0 === peg$FAILED) {
                        s0 = peg$currPos;
                        if (input.substr(peg$currPos, 6) === peg$c19) {
                          s1 = peg$c19;
                          peg$currPos += 6;
                        } else {
                          s1 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$e19); }
                        }
                        if (s1 !== peg$FAILED) {
                          peg$savedPos = s0;
                          s1 = peg$f16();
                        }
                        s0 = s1;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parseDirection() {
    var s0;

    if (input.substr(peg$currPos, 4) === peg$c20) {
      s0 = peg$c20;
      peg$currPos += 4;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e20); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 4) === peg$c21) {
        s0 = peg$c21;
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e21); }
      }
    }

    return s0;
  }

  function peg$parseRepetition() {
    var s0;

    if (input.substr(peg$currPos, 8) === peg$c22) {
      s0 = peg$c22;
      peg$currPos += 8;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e22); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 8) === peg$c23) {
        s0 = peg$c23;
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e23); }
      }
    }

    return s0;
  }

  function peg$parseTincture() {
    var s0;

    if (input.substr(peg$currPos, 5) === peg$c24) {
      s0 = peg$c24;
      peg$currPos += 5;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e24); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c25) {
        s0 = peg$c25;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e25); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 6) === peg$c26) {
          s0 = peg$c26;
          peg$currPos += 6;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e26); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 5) === peg$c27) {
            s0 = peg$c27;
            peg$currPos += 5;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e27); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 4) === peg$c28) {
              s0 = peg$c28;
              peg$currPos += 4;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$e28); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 5) === peg$c29) {
                s0 = peg$c29;
                peg$currPos += 5;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$e29); }
              }
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parseChargeName() {
    var s0;

    if (input.substr(peg$currPos, 4) === peg$c30) {
      s0 = peg$c30;
      peg$currPos += 4;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e30); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 5) === peg$c31) {
        s0 = peg$c31;
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e31); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c21) {
          s0 = peg$c21;
          peg$currPos += 4;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$e21); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 6) === peg$c32) {
            s0 = peg$c32;
            peg$currPos += 6;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$e32); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 6) === peg$c33) {
              s0 = peg$c33;
              peg$currPos += 6;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$e33); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 62) === peg$c34) {
                s0 = peg$c34;
                peg$currPos += 62;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$e34); }
              }
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parse_() {
    var s0, s1;

    peg$silentFails++;
    s0 = [];
    if (peg$r0.test(input.charAt(peg$currPos))) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$e36); }
    }
    while (s1 !== peg$FAILED) {
      s0.push(s1);
      if (peg$r0.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$e36); }
      }
    }
    peg$silentFails--;
    s1 = peg$FAILED;
    if (peg$silentFails === 0) { peg$fail(peg$e35); }

    return s0;
  }

  peg$result = peg$startRuleFunction();

  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }

    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length
        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
}

  root.parser = {
    SyntaxError: peg$SyntaxError,
    parse: peg$parse
  };
})(this);
