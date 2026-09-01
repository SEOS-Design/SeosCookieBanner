/*!
 * SEOS Cookiebanner - BYGGD FIL. Redigera inte har, andringar skrivs over.
 *
 * Kalla:  banner-src/script.js + banner-src/style.css
 * Bygg:   npm run build
 * Ingar:  DOMPurify 3.4.14 (https://github.com/cure53/DOMPurify)
 */
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/dompurify/dist/purify.min.js
  var require_purify_min = __commonJS({
    "node_modules/dompurify/dist/purify.min.js"(exports, module) {
      /*! @license DOMPurify 3.4.14 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.14/LICENSE */
      !(function(t, e) {
        "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (t = "undefined" != typeof globalThis ? globalThis : t || self).DOMPurify = e();
      })(exports, function() {
        "use strict";
        function t(t2, e2) {
          (null == e2 || e2 > t2.length) && (e2 = t2.length);
          for (var n2 = 0, o2 = Array(e2); n2 < e2; n2++) o2[n2] = t2[n2];
          return o2;
        }
        function e(e2, n2) {
          return (function(t2) {
            if (Array.isArray(t2)) return t2;
          })(e2) || (function(t2, e3) {
            var n3 = null == t2 ? null : "undefined" != typeof Symbol && t2[Symbol.iterator] || t2["@@iterator"];
            if (null != n3) {
              var o2, r2, i2, a2, l2 = [], c2 = true, s2 = false;
              try {
                if (i2 = (n3 = n3.call(t2)).next, 0 === e3) ;
                else for (; !(c2 = (o2 = i2.call(n3)).done) && (l2.push(o2.value), l2.length !== e3); c2 = true) ;
              } catch (t3) {
                s2 = true, r2 = t3;
              } finally {
                try {
                  if (!c2 && null != n3.return && (a2 = n3.return(), Object(a2) !== a2)) return;
                } finally {
                  if (s2) throw r2;
                }
              }
              return l2;
            }
          })(e2, n2) || (function(e3, n3) {
            if (e3) {
              if ("string" == typeof e3) return t(e3, n3);
              var o2 = {}.toString.call(e3).slice(8, -1);
              return "Object" === o2 && e3.constructor && (o2 = e3.constructor.name), "Map" === o2 || "Set" === o2 ? Array.from(e3) : "Arguments" === o2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(o2) ? t(e3, n3) : void 0;
            }
          })(e2, n2) || (function() {
            throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
          })();
        }
        const n = Object.entries, o = Object.setPrototypeOf, r = Object.isFrozen, i = Object.getPrototypeOf, a = Object.getOwnPropertyDescriptor;
        let l = Object.freeze, c = Object.seal, s = Object.create, u = "undefined" != typeof Reflect && Reflect, f = u.apply, p = u.construct;
        l || (l = function(t2) {
          return t2;
        }), c || (c = function(t2) {
          return t2;
        }), f || (f = function(t2, e2) {
          for (var n2 = arguments.length, o2 = new Array(n2 > 2 ? n2 - 2 : 0), r2 = 2; r2 < n2; r2++) o2[r2 - 2] = arguments[r2];
          return t2.apply(e2, o2);
        }), p || (p = function(t2) {
          for (var e2 = arguments.length, n2 = new Array(e2 > 1 ? e2 - 1 : 0), o2 = 1; o2 < e2; o2++) n2[o2 - 1] = arguments[o2];
          return new t2(...n2);
        });
        const m = L(Array.prototype.forEach), d = L(Array.prototype.lastIndexOf), h = L(Array.prototype.pop), y = L(Array.prototype.push), g = L(Array.prototype.splice), b = Array.isArray, S = L(String.prototype.toLowerCase), T = L(String.prototype.toString), A = L(String.prototype.match), E = L(String.prototype.replace), w = L(String.prototype.indexOf), v = L(String.prototype.trim), O = L(Number.prototype.toString), x = L(Boolean.prototype.toString), N = "undefined" == typeof BigInt ? null : L(BigInt.prototype.toString), _ = "undefined" == typeof Symbol ? null : L(Symbol.prototype.toString), D = L(Object.prototype.hasOwnProperty), R = L(Object.prototype.toString), k = L(RegExp.prototype.test), C = (I = TypeError, function() {
          for (var t2 = arguments.length, e2 = new Array(t2), n2 = 0; n2 < t2; n2++) e2[n2] = arguments[n2];
          return p(I, e2);
        });
        var I;
        function L(t2) {
          return function(e2) {
            e2 instanceof RegExp && (e2.lastIndex = 0);
            for (var n2 = arguments.length, o2 = new Array(n2 > 1 ? n2 - 1 : 0), r2 = 1; r2 < n2; r2++) o2[r2 - 1] = arguments[r2];
            return f(t2, e2, o2);
          };
        }
        function z(t2, e2) {
          let n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : S;
          if (o && o(t2, null), !b(e2)) return t2;
          let i2 = e2.length;
          for (; i2--; ) {
            let o2 = e2[i2];
            if ("string" == typeof o2) {
              const t3 = n2(o2);
              t3 !== o2 && (r(e2) || (e2[i2] = t3), o2 = t3);
            }
            t2[o2] = true;
          }
          return t2;
        }
        function M(t2) {
          for (let e2 = 0; e2 < t2.length; e2++) {
            D(t2, e2) || (t2[e2] = null);
          }
          return t2;
        }
        function P(t2) {
          const o2 = s(null);
          for (const i2 of n(t2)) {
            var r2 = e(i2, 2);
            const n2 = r2[0], a2 = r2[1];
            D(t2, n2) && (b(a2) ? o2[n2] = M(a2) : a2 && "object" == typeof a2 && a2.constructor === Object ? o2[n2] = P(a2) : o2[n2] = a2);
          }
          return o2;
        }
        function U(t2, e2) {
          for (; null !== t2; ) {
            const n2 = a(t2, e2);
            if (n2) {
              if (n2.get) return L(n2.get);
              if ("function" == typeof n2.value) return L(n2.value);
            }
            t2 = i(t2);
          }
          return function() {
            return null;
          };
        }
        const F = l(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]), H = l(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]), j = l(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]), B = l(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]), W = l(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]), Y = l(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]), G = l(["#text"]), q = l(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "command", "commandfor", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns"]), $ = l(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dominant-baseline", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "pointer-events", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-orientation", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "vector-effect", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]), X = l(["accent", "accentunder", "align", "bevelled", "close", "columnalign", "columnlines", "columnspacing", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lquote", "lspace", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]), K = l(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]), V = c(/{{[\w\W]*|^[\w\W]*}}/g), Z = c(/<%[\w\W]*|^[\w\W]*%>/g), J = c(/\${[\w\W]*/g), Q = c(/^data-[\-\w.\u00B7-\uFFFF]+$/), tt = c(/^aria-[\-\w]+$/), et = c(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i), nt = c(/^(?:\w+script|data):/i), ot = c(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g), rt = c(/^html$/i), it = c(/^[a-z][.\w]*(-[.\w]+)+$/i), at = c(/<[/\w!]/g), lt = c(/<[/\w]/g), ct = c(/<\/no(script|embed|frames)/i), st = c(/\/>/i), ut = 1, ft = 3, pt = 7, mt = 8, dt = 9, ht = 11, yt = ["style", "script", "xmp", "iframe", "noembed", "noframes", "plaintext", "noscript"], gt = l(z({}, yt)), bt = (function() {
          const t2 = {};
          return m(yt, (e2) => {
            t2[e2] = c(new RegExp("</" + e2 + "(?=[\\t\\n\\f\\r />])", "i"));
          }), l(t2);
        })(), St = function() {
          return "undefined" == typeof window ? null : window;
        }, Tt = function(t2, e2, n2, o2) {
          return D(t2, e2) && b(t2[e2]) ? z(o2.base ? P(o2.base) : {}, t2[e2], o2.transform) : n2;
        }, At = function(t2, e2, n2) {
          const o2 = D(t2, e2) ? t2[e2] : void 0;
          return o2 && "object" == typeof o2 ? P(o2) : n2();
        };
        var Et = (function t2() {
          let e2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : St();
          const o2 = (e3) => t2(e3);
          if (o2.version = "3.4.14", o2.removed = [], !e2 || !e2.document || e2.document.nodeType !== dt || !e2.Element) return o2.isSupported = false, o2;
          let r2 = e2.document;
          const i2 = r2, a2 = i2.currentScript;
          e2.DocumentFragment;
          const u2 = e2.HTMLTemplateElement, f2 = e2.Node, p2 = e2.Element, I2 = e2.NodeFilter, L2 = e2.NamedNodeMap;
          void 0 === L2 && (e2.NamedNodeMap || e2.MozNamedAttrMap), e2.HTMLFormElement;
          const M2 = e2.DOMParser, yt2 = e2.trustedTypes, Et2 = p2.prototype, wt = U(Et2, "cloneNode"), vt = U(Et2, "remove"), Ot = U(Et2, "nextSibling"), xt = U(Et2, "childNodes"), Nt = U(Et2, "parentNode"), _t = U(Et2, "shadowRoot"), Dt = U(Et2, "attributes"), Rt = f2 && f2.prototype ? U(f2.prototype, "nodeType") : null, kt = f2 && f2.prototype ? U(f2.prototype, "nodeName") : null, Ct = f2 && f2.prototype ? U(f2.prototype, "ownerDocument") : null, It = function(t3) {
            return Rt ? Rt(t3) : t3.nodeType;
          }, Lt = function(t3) {
            return kt ? kt(t3) : t3.nodeName;
          };
          if ("function" == typeof u2) {
            const t3 = r2.createElement("template");
            t3.content && t3.content.ownerDocument && (r2 = t3.content.ownerDocument);
          }
          let zt, Mt, Pt = "", Ut = false, Ft = 0;
          const Ht = function() {
            if (Ft > 0) throw C('A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.');
          }, jt = function(t3) {
            Ht(), Ft++;
            try {
              return zt.createHTML(t3);
            } finally {
              Ft--;
            }
          }, Bt = function() {
            return Ut || (Mt = (function(t3, e3) {
              if ("object" != typeof t3 || "function" != typeof t3.createPolicy) return null;
              let n2 = null;
              const o3 = "data-tt-policy-suffix";
              e3 && e3.hasAttribute(o3) && (n2 = e3.getAttribute(o3));
              const r3 = "dompurify" + (n2 ? "#" + n2 : "");
              try {
                return t3.createPolicy(r3, { createHTML: (t4) => t4, createScriptURL: (t4) => t4 });
              } catch (t4) {
                return console.warn("TrustedTypes policy " + r3 + " could not be created."), null;
              }
            })(yt2, a2), Ut = true), Mt;
          }, Wt = r2, Yt = Wt.implementation, Gt = Wt.createNodeIterator, qt = Wt.createDocumentFragment, $t = Wt.getElementsByTagName, Xt = i2.importNode;
          let Kt = { afterSanitizeAttributes: [], afterSanitizeElements: [], afterSanitizeShadowDOM: [], beforeSanitizeAttributes: [], beforeSanitizeElements: [], beforeSanitizeShadowDOM: [], uponSanitizeAttribute: [], uponSanitizeElement: [], uponSanitizeShadowNode: [] };
          o2.isSupported = "function" == typeof n && "function" == typeof Nt && Yt && void 0 !== Yt.createHTMLDocument;
          const Vt = V, Zt = Z, Jt = J, Qt = Q, te = tt, ee = nt, ne = ot, oe = it;
          let re = et, ie = null;
          const ae = z({}, [...F, ...H, ...j, ...W, ...G]);
          let le = null;
          const ce = z({}, [...q, ...$, ...X, ...K]);
          let se = Object.seal(s(null, { tagNameCheck: { writable: true, configurable: false, enumerable: true, value: null }, attributeNameCheck: { writable: true, configurable: false, enumerable: true, value: null }, allowCustomizedBuiltInElements: { writable: true, configurable: false, enumerable: true, value: false } })), ue = null, fe = null;
          const pe = Object.seal(s(null, { tagCheck: { writable: true, configurable: false, enumerable: true, value: null }, attributeCheck: { writable: true, configurable: false, enumerable: true, value: null } }));
          let me = true, de = true, he = false, ye = true, ge = false, be = true, Se = false, Te = false, Ae = null, Ee = null, we = false, ve = false, Oe = false, xe = false, Ne = true, _e = false;
          const De = "user-content-";
          let Re = true, ke = false, Ce = {}, Ie = null;
          const Le = z({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "selectedcontent", "style", "svg", "template", "thead", "title", "video", "xmp"]);
          let ze = null;
          const Me = z({}, ["audio", "video", "img", "source", "image", "track"]);
          let Pe = null;
          const Ue = z({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]), Fe = "http://www.w3.org/1998/Math/MathML", He = "http://www.w3.org/2000/svg", je = "http://www.w3.org/1999/xhtml";
          let Be = je, We = false, Ye = null;
          const Ge = z({}, [Fe, He, je], T), qe = l(["mi", "mo", "mn", "ms", "mtext"]);
          let $e = z({}, qe);
          const Xe = l(["annotation-xml"]);
          let Ke = z({}, Xe);
          const Ve = z({}, ["title", "style", "font", "a", "script"]);
          let Ze = null;
          const Je = ["application/xhtml+xml", "text/html"];
          let Qe = null, tn = null;
          const en = r2.createElement("form"), nn = function(t3) {
            return t3 instanceof RegExp || t3 instanceof Function;
          }, on = function() {
            let t3 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
            if (tn && tn === t3) return;
            t3 && "object" == typeof t3 || (t3 = {}), t3 = P(t3), Ze = -1 === Je.indexOf(t3.PARSER_MEDIA_TYPE) ? "text/html" : t3.PARSER_MEDIA_TYPE, Qe = "application/xhtml+xml" === Ze ? T : S, ie = Tt(t3, "ALLOWED_TAGS", ae, { transform: Qe }), le = Tt(t3, "ALLOWED_ATTR", ce, { transform: Qe }), Ye = Tt(t3, "ALLOWED_NAMESPACES", Ge, { transform: T }), Pe = Tt(t3, "ADD_URI_SAFE_ATTR", Ue, { transform: Qe, base: Ue }), ze = Tt(t3, "ADD_DATA_URI_TAGS", Me, { transform: Qe, base: Me }), Ie = Tt(t3, "FORBID_CONTENTS", Le, { transform: Qe }), ue = Tt(t3, "FORBID_TAGS", P({}), { transform: Qe }), fe = Tt(t3, "FORBID_ATTR", P({}), { transform: Qe }), Ce = !!D(t3, "USE_PROFILES") && (t3.USE_PROFILES && "object" == typeof t3.USE_PROFILES ? P(t3.USE_PROFILES) : t3.USE_PROFILES), me = false !== t3.ALLOW_ARIA_ATTR, de = false !== t3.ALLOW_DATA_ATTR, he = t3.ALLOW_UNKNOWN_PROTOCOLS || false, ye = false !== t3.ALLOW_SELF_CLOSE_IN_ATTR, ge = t3.SAFE_FOR_TEMPLATES || false, be = false !== t3.SAFE_FOR_XML, Se = t3.WHOLE_DOCUMENT || false, ve = t3.RETURN_DOM || false, Oe = t3.RETURN_DOM_FRAGMENT || false, xe = t3.RETURN_TRUSTED_TYPE || false, we = t3.FORCE_BODY || false, Ne = false !== t3.SANITIZE_DOM, _e = t3.SANITIZE_NAMED_PROPS || false, Re = false !== t3.KEEP_CONTENT, ke = t3.IN_PLACE || false, re = (function(t4) {
              try {
                return k(t4, ""), true;
              } catch (t5) {
                return false;
              }
            })(t3.ALLOWED_URI_REGEXP) ? t3.ALLOWED_URI_REGEXP : et, Be = "string" == typeof t3.NAMESPACE ? t3.NAMESPACE : je, $e = At(t3, "MATHML_TEXT_INTEGRATION_POINTS", () => z({}, qe)), Ke = At(t3, "HTML_INTEGRATION_POINTS", () => z({}, Xe));
            const e3 = At(t3, "CUSTOM_ELEMENT_HANDLING", () => s(null));
            if (se = s(null), D(e3, "tagNameCheck") && nn(e3.tagNameCheck) && (se.tagNameCheck = e3.tagNameCheck), D(e3, "attributeNameCheck") && nn(e3.attributeNameCheck) && (se.attributeNameCheck = e3.attributeNameCheck), D(e3, "allowCustomizedBuiltInElements") && "boolean" == typeof e3.allowCustomizedBuiltInElements && (se.allowCustomizedBuiltInElements = e3.allowCustomizedBuiltInElements), c(se), ge && (de = false), Oe && (ve = true), Ce && (ie = z({}, G), le = s(null), true === Ce.html && (z(ie, F), z(le, q)), true === Ce.svg && (z(ie, H), z(le, $), z(le, K)), true === Ce.svgFilters && (z(ie, j), z(le, $), z(le, K)), true === Ce.mathMl && (z(ie, W), z(le, X), z(le, K))), pe.tagCheck = null, pe.attributeCheck = null, D(t3, "ADD_TAGS") && ("function" == typeof t3.ADD_TAGS ? pe.tagCheck = t3.ADD_TAGS : b(t3.ADD_TAGS) && (ie === ae && (ie = P(ie)), z(ie, t3.ADD_TAGS, Qe))), D(t3, "ADD_ATTR") && ("function" == typeof t3.ADD_ATTR ? pe.attributeCheck = t3.ADD_ATTR : b(t3.ADD_ATTR) && (le === ce && (le = P(le)), z(le, t3.ADD_ATTR, Qe))), D(t3, "ADD_FORBID_CONTENTS") && b(t3.ADD_FORBID_CONTENTS) && (Ie === Le && (Ie = P(Ie)), z(Ie, t3.ADD_FORBID_CONTENTS, Qe)), Re && (ie["#text"] = true), Se && z(ie, ["html", "head", "body"]), ie.table && (z(ie, ["tbody"]), delete ue.tbody), t3.TRUSTED_TYPES_POLICY) {
              if ("function" != typeof t3.TRUSTED_TYPES_POLICY.createHTML) throw C('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
              if ("function" != typeof t3.TRUSTED_TYPES_POLICY.createScriptURL) throw C('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
              const e4 = zt;
              zt = t3.TRUSTED_TYPES_POLICY;
              try {
                Pt = jt("");
              } catch (t4) {
                throw zt = e4, t4;
              }
            } else null === t3.TRUSTED_TYPES_POLICY ? (zt = void 0, Pt = "") : (void 0 === zt && (zt = Bt()), zt && "string" == typeof Pt && (Pt = jt("")));
            l && l(t3), tn = t3;
          }, rn = z({}, [...H, ...j, ...B]), an = z({}, [...W, ...Y]), ln = function(t3) {
            let e3 = Nt(t3);
            e3 && e3.tagName || (e3 = { namespaceURI: Be, tagName: "template" });
            const n2 = S(t3.tagName), o3 = S(e3.tagName);
            return !!Ye[t3.namespaceURI] && (t3.namespaceURI === He ? (function(t4, e4, n3) {
              return e4.namespaceURI === je ? "svg" === t4 : e4.namespaceURI === Fe ? "svg" === t4 && ("annotation-xml" === n3 || $e[n3]) : Boolean(rn[t4]);
            })(n2, e3, o3) : t3.namespaceURI === Fe ? (function(t4, e4, n3) {
              return e4.namespaceURI === je ? "math" === t4 : e4.namespaceURI === He ? "math" === t4 && Ke[n3] : Boolean(an[t4]);
            })(n2, e3, o3) : t3.namespaceURI === je ? (function(t4, e4, n3) {
              return !(e4.namespaceURI === He && !Ke[n3]) && !(e4.namespaceURI === Fe && !$e[n3]) && !an[t4] && (Ve[t4] || !rn[t4]);
            })(n2, e3, o3) : !("application/xhtml+xml" !== Ze || !Ye[t3.namespaceURI]));
          }, cn = function(t3) {
            y(o2.removed, { element: t3 });
            try {
              Nt(t3).removeChild(t3);
            } catch (e3) {
              if (vt(t3), !Nt(t3)) throw C("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place");
            }
          }, sn = function(t3, e3, n2) {
            try {
              t3.removeAttributeNode(e3);
            } catch (e4) {
              try {
                t3.removeAttribute(n2);
              } catch (t4) {
              }
            }
          }, un = function(t3) {
            mn(t3);
            const e3 = xt(t3);
            if (e3) {
              const t4 = [];
              m(e3, (e4) => {
                y(t4, e4);
              }), m(t4, (t5) => {
                try {
                  vt(t5);
                } catch (t6) {
                }
              });
            }
            const n2 = Dt(t3);
            if (n2) for (let e4 = n2.length - 1; e4 >= 0; --e4) {
              const o3 = n2[e4], r3 = o3 && o3.name;
              "string" == typeof r3 && sn(t3, o3, r3);
            }
          }, fn = function(t3, e3, n2) {
            if (!n2) try {
              n2 = e3.getAttributeNode(t3);
            } catch (t4) {
              n2 = null;
            }
            y(o2.removed, { attribute: n2 || null, from: e3 });
            try {
              n2 ? e3.removeAttributeNode(n2) : e3.removeAttribute(t3);
            } catch (n3) {
              try {
                e3.removeAttribute(t3);
              } catch (t4) {
              }
            }
            if ("is" === t3) if (ve || Oe) try {
              cn(e3);
            } catch (t4) {
            }
            else try {
              e3.setAttribute(t3, "");
            } catch (t4) {
            }
          }, pn = function(t3) {
            const e3 = Dt(t3);
            if (e3) for (let n2 = e3.length - 1; n2 >= 0; --n2) {
              const o3 = e3[n2], r3 = o3 && o3.name;
              "string" != typeof r3 || le[Qe(r3)] || sn(t3, o3, r3);
            }
          }, mn = function(t3) {
            const e3 = [t3];
            for (; e3.length > 0; ) {
              const t4 = e3.pop();
              It(t4) === ut && pn(t4);
              const n2 = xt(t4);
              if (n2) for (let t5 = n2.length - 1; t5 >= 0; --t5) e3.push(n2[t5]);
            }
          }, dn = function(t3, e3) {
            return !!be && ("patchsrc" === t3 || "for" === t3 && "label" !== e3 && "output" !== e3);
          }, hn = function(t3) {
            let e3 = null, n2 = null;
            if (we) t3 = "<remove></remove>" + t3;
            else {
              const e4 = A(t3, /^[\r\n\t ]+/);
              n2 = e4 && e4[0];
            }
            "application/xhtml+xml" === Ze && Be === je && (t3 = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + t3 + "</body></html>");
            const o3 = zt ? jt(t3) : t3;
            if (Be === je) try {
              e3 = new M2().parseFromString(o3, Ze);
            } catch (t4) {
            }
            if (!e3 || !e3.documentElement) {
              e3 = Yt.createDocument(Be, "template", null);
              try {
                e3.documentElement.innerHTML = We ? Pt : o3;
              } catch (t4) {
              }
            }
            const i3 = e3.body || e3.documentElement;
            return t3 && n2 && i3.insertBefore(r2.createTextNode(n2), i3.childNodes[0] || null), Be === je ? $t.call(e3, Se ? "html" : "body")[0] : Se ? e3.documentElement : i3;
          }, yn = function(t3) {
            const e3 = Ct ? Ct(t3) : t3.ownerDocument;
            return Gt.call(e3 || t3, t3, I2.SHOW_ELEMENT | I2.SHOW_COMMENT | I2.SHOW_TEXT | I2.SHOW_PROCESSING_INSTRUCTION | I2.SHOW_CDATA_SECTION, null);
          }, gn = function(t3) {
            return t3 = E(t3, Vt, " "), t3 = E(t3, Zt, " "), t3 = E(t3, Jt, " ");
          }, bn = function(t3) {
            var e3;
            t3.normalize();
            const n2 = Ct ? Ct(t3) : t3.ownerDocument, o3 = Gt.call(n2 || t3, t3, I2.SHOW_TEXT | I2.SHOW_COMMENT | I2.SHOW_CDATA_SECTION | I2.SHOW_PROCESSING_INSTRUCTION, null);
            let r3 = o3.nextNode();
            for (; r3; ) r3.data = gn(r3.data), r3 = o3.nextNode();
            const i3 = null === (e3 = t3.querySelectorAll) || void 0 === e3 ? void 0 : e3.call(t3, "template");
            i3 && m(i3, (t4) => {
              Tn(t4.content) && bn(t4.content);
            });
          }, Sn = function(t3) {
            const e3 = kt ? kt(t3) : null;
            return "string" == typeof e3 && ("form" === Qe(e3) && ("string" != typeof t3.nodeName || "string" != typeof t3.textContent || "function" != typeof t3.removeChild || t3.attributes !== Dt(t3) || "function" != typeof t3.removeAttribute || "function" != typeof t3.setAttribute || "string" != typeof t3.namespaceURI || "function" != typeof t3.insertBefore || "function" != typeof t3.hasChildNodes || t3.nodeType !== Rt(t3) || t3.childNodes !== xt(t3)));
          }, Tn = function(t3) {
            if (!Rt || "object" != typeof t3 || null === t3) return false;
            try {
              return Rt(t3) === ht;
            } catch (t4) {
              return false;
            }
          }, An = function(t3) {
            if (!Rt || "object" != typeof t3 || null === t3) return false;
            try {
              return "number" == typeof Rt(t3);
            } catch (t4) {
              return false;
            }
          };
          function En(t3, e3, n2) {
            0 !== t3.length && m(t3, (t4) => {
              t4.call(o2, e3, n2, tn);
            });
          }
          const wn = function(t3, e3) {
            if (t3 instanceof RegExp) return k(t3, e3);
            if (t3 instanceof Function) {
              for (var n2 = arguments.length, o3 = new Array(n2 > 2 ? n2 - 2 : 0), r3 = 2; r3 < n2; r3++) o3[r3 - 2] = arguments[r3];
              return Boolean(t3(e3, ...o3));
            }
            return false;
          }, vn = function(t3, e3, n2, o3) {
            return 0 === t3.length ? e3 : e3 === n2 || e3 === o3 ? P(e3) : e3;
          }, On = function(t3, e3) {
            return t3 !== e3 && null === Nt(t3) && (ke && mn(t3), true);
          }, xn = function(t3, e3) {
            if (En(Kt.beforeSanitizeElements, t3, null), On(t3, e3)) return true;
            if (Sn(t3)) return cn(t3), true;
            const n2 = Qe(Lt(t3));
            if (ie = vn(Kt.uponSanitizeElement, ie, ae, Ae), En(Kt.uponSanitizeElement, t3, { tagName: n2, allowedTags: ie }), On(t3, e3)) return true;
            if ((function(t4, e4) {
              return !!(be && t4.hasChildNodes() && !An(t4.firstElementChild) && k(at, t4.textContent) && k(at, t4.innerHTML)) || !!(be && t4.namespaceURI === je && gt[e4] && (An(t4.firstElementChild) || "string" == typeof t4.textContent && k(bt[e4], t4.textContent))) || t4.nodeType === pt || !(!be || t4.nodeType !== mt || !k(lt, t4.data));
            })(t3, n2)) return cn(t3), true;
            if (ue[n2] || !(pe.tagCheck instanceof Function && pe.tagCheck(n2)) && !ie[n2]) {
              const o3 = (function(t4, e4, n3) {
                if (!ue[e4] && Dn(e4) && wn(se.tagNameCheck, e4)) return false;
                if (Re && !Ie[e4]) {
                  const e5 = Nt(t4), o4 = xt(t4);
                  if (o4 && e5) for (let r3 = o4.length - 1; r3 >= 0; --r3) {
                    const i3 = t4 === n3 ? wt(o4[r3], true) : o4[r3];
                    e5.insertBefore(i3, Ot(t4));
                  }
                }
                return cn(t4), true;
              })(t3, n2, e3);
              return false === o3 && En(Kt.afterSanitizeElements, t3, null), o3;
            }
            if (It(t3) === ut && !ln(t3)) return cn(t3), true;
            if (("noscript" === n2 || "noembed" === n2 || "noframes" === n2) && k(ct, t3.innerHTML)) return cn(t3), true;
            if (ge && t3.nodeType === ft) {
              const e4 = gn(t3.textContent);
              t3.textContent !== e4 && (y(o2.removed, { element: t3.cloneNode() }), t3.textContent = e4);
            }
            return En(Kt.afterSanitizeElements, t3, null), false;
          }, Nn = function(t3, e3, n2) {
            if (fe[e3]) return false;
            if (dn(e3, t3)) return false;
            if (Ne && ("id" === e3 || "name" === e3) && (n2 in r2 || n2 in en)) return false;
            const o3 = le[e3] || pe.attributeCheck instanceof Function && pe.attributeCheck(e3, t3);
            return !(!de || !k(Qt, e3)) || (!(!me || !k(te, e3)) || (o3 ? !!Pe[e3] || (!!k(re, E(n2, ne, "")) || (!("src" !== e3 && "xlink:href" !== e3 && "href" !== e3 || "script" === t3 || 0 !== w(n2, "data:") || !ze[t3]) || (!(!he || k(ee, E(n2, ne, ""))) || !n2))) : Dn(t3) && wn(se.tagNameCheck, t3) && wn(se.attributeNameCheck, e3, t3) || "is" === e3 && se.allowCustomizedBuiltInElements && wn(se.tagNameCheck, n2)));
          }, _n = z({}, ["annotation-xml", "color-profile", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "missing-glyph"]), Dn = function(t3) {
            return !_n[S(t3)] && k(oe, t3);
          }, Rn = function(t3, e3, n2, o3) {
            if (zt && "object" == typeof yt2 && "function" == typeof yt2.getAttributeType && !n2) switch (yt2.getAttributeType(t3, e3)) {
              case "TrustedHTML":
                return jt(o3);
              case "TrustedScriptURL":
                return (function(t4) {
                  Ht(), Ft++;
                  try {
                    return zt.createScriptURL(t4);
                  } finally {
                    Ft--;
                  }
                })(o3);
            }
            return o3;
          }, kn = function(t3, e3, n2, r3) {
            try {
              n2 ? t3.setAttributeNS(n2, e3, r3) : t3.setAttribute(e3, r3), Sn(t3) ? cn(t3) : h(o2.removed);
            } catch (n3) {
              fn(e3, t3);
            }
          }, Cn = function(t3) {
            En(Kt.beforeSanitizeAttributes, t3, null);
            const e3 = t3.attributes;
            if (!e3 || Sn(t3)) return;
            le = vn(Kt.uponSanitizeAttribute, le, ce, Ee);
            const n2 = { attrName: "", attrValue: "", keepAttr: true, allowedAttributes: le, forceKeepAttr: void 0 };
            let o3 = e3.length;
            const r3 = Qe(t3.nodeName);
            for (; o3--; ) {
              const i3 = e3[o3], a3 = i3.name, l2 = i3.namespaceURI, c2 = i3.value, s2 = Qe(a3), u3 = c2;
              let f3 = "value" === a3 ? u3 : v(u3);
              n2.attrName = s2, n2.attrValue = f3, n2.keepAttr = true, n2.forceKeepAttr = void 0, En(Kt.uponSanitizeAttribute, t3, n2), f3 = n2.attrValue, !_e || "id" !== s2 && "name" !== s2 || 0 === w(f3, De) || (fn(a3, t3, i3), f3 = De + f3), be && k(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, f3) ? fn(a3, t3, i3) : "attributename" === s2 && A(f3, "href") ? fn(a3, t3, i3) : n2.forceKeepAttr || (n2.keepAttr && (ye || !k(st, f3)) ? (ge && (f3 = gn(f3)), Nn(r3, s2, f3) ? (f3 = Rn(r3, s2, l2, f3), f3 !== u3 && kn(t3, a3, l2, f3)) : fn(a3, t3, i3)) : fn(a3, t3, i3));
            }
            En(Kt.afterSanitizeAttributes, t3, null);
          }, In = function(t3) {
            let e3 = null;
            const n2 = yn(t3);
            for (En(Kt.beforeSanitizeShadowDOM, t3, null); e3 = n2.nextNode(); ) if (En(Kt.uponSanitizeShadowNode, e3, null), xn(e3, t3), Cn(e3), Tn(e3.content) && In(e3.content), It(e3) === ut) {
              const t4 = _t(e3);
              Tn(t4) && (Ln(t4), In(t4));
            }
            En(Kt.afterSanitizeShadowDOM, t3, null);
          }, Ln = function(t3) {
            const e3 = [{ node: t3, shadow: null }];
            for (; e3.length > 0; ) {
              const t4 = e3.pop();
              if (t4.shadow) {
                In(t4.shadow);
                continue;
              }
              const n2 = t4.node, o3 = It(n2) === ut, r3 = xt(n2);
              if (r3) for (let t5 = r3.length - 1; t5 >= 0; --t5) e3.push({ node: r3[t5], shadow: null });
              if (o3) {
                const t5 = kt ? kt(n2) : null;
                if ("string" == typeof t5 && "template" === Qe(t5)) {
                  const t6 = n2.content;
                  Tn(t6) && e3.push({ node: t6, shadow: null });
                }
              }
              if (o3) {
                const t5 = _t(n2);
                Tn(t5) && e3.push({ node: null, shadow: t5 }, { node: t5, shadow: null });
              }
            }
          };
          return o2.sanitize = function(t3) {
            let e3 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}, n2 = null, r3 = null, a3 = null, l2 = null;
            if (We = !t3, We && (t3 = "<!-->"), "string" != typeof t3 && !An(t3) && "string" != typeof (t3 = (function(t4) {
              switch (typeof t4) {
                case "string":
                  return t4;
                case "number":
                  return O(t4);
                case "boolean":
                  return x(t4);
                case "bigint":
                  return N ? N(t4) : "0";
                case "symbol":
                  return _ ? _(t4) : "Symbol()";
                case "undefined":
                default:
                  return R(t4);
                case "function":
                case "object": {
                  if (null === t4) return R(t4);
                  const e4 = t4, n3 = U(e4, "toString");
                  if ("function" == typeof n3) {
                    const t5 = n3(e4);
                    return "string" == typeof t5 ? t5 : R(t5);
                  }
                  return R(t4);
                }
              }
            })(t3))) throw C("dirty is not a string, aborting");
            if (!o2.isSupported) return t3;
            Te ? (ie = Ae, le = Ee) : on(e3), (Kt.uponSanitizeElement.length > 0 || Kt.uponSanitizeAttribute.length > 0) && (ie = P(ie)), Kt.uponSanitizeAttribute.length > 0 && (le = P(le)), o2.removed = [];
            const c2 = ke && "string" != typeof t3 && An(t3);
            if (c2) {
              !(function(t4) {
                if (!be) return;
                const e5 = [t4];
                for (; e5.length > 0; ) {
                  const t5 = e5.pop(), n3 = It(t5);
                  if (n3 === pt || n3 === mt && k(lt, t5.data)) {
                    try {
                      vt(t5);
                    } catch (t6) {
                    }
                    continue;
                  }
                  if (n3 === ut) {
                    const e6 = t5, n4 = Qe(Lt(t5));
                    try {
                      e6.hasAttribute && e6.hasAttribute("patchsrc") && e6.removeAttribute("patchsrc"), e6.hasAttribute && e6.hasAttribute("for") && dn("for", n4) && e6.removeAttribute("for");
                    } catch (t6) {
                    }
                  }
                  const o3 = xt(t5);
                  if (o3) for (let t6 = o3.length - 1; t6 >= 0; --t6) e5.push(o3[t6]);
                }
              })(t3);
              const e4 = Lt(t3);
              if ("string" == typeof e4) {
                const n3 = Qe(e4);
                if (!ie[n3] || ue[n3]) throw un(t3), C("root node is forbidden and cannot be sanitized in-place");
              }
              if (Sn(t3)) throw un(t3), C("root node is clobbered and cannot be sanitized in-place");
              try {
                Ln(t3);
              } catch (e5) {
                throw un(t3), e5;
              }
            } else if (An(t3)) n2 = hn("<!---->"), r3 = n2.ownerDocument.importNode(t3, true), r3.nodeType === ut && "BODY" === r3.nodeName || "HTML" === r3.nodeName ? n2 = r3 : n2.appendChild(r3), Ln(r3);
            else {
              if (!ve && !ge && !Se && -1 === t3.indexOf("<")) return zt && xe ? jt(t3) : t3;
              if (n2 = hn(t3), !n2) return ve ? null : xe ? Pt : "";
            }
            n2 && we && cn(n2.firstChild);
            const s2 = c2 ? t3 : n2;
            try {
              const t4 = yn(s2);
              for (; a3 = t4.nextNode(); ) xn(a3, s2), Cn(a3), Tn(a3.content) && In(a3.content);
            } catch (e4) {
              throw c2 && (un(t3), m(o2.removed, (t4) => {
                t4.element && mn(t4.element);
              })), e4;
            }
            if (c2) return m(o2.removed, (t4) => {
              t4.element && mn(t4.element);
            }), ge && bn(t3), t3;
            if (ve) {
              if (ge && bn(n2), Oe) for (l2 = qt.call(n2.ownerDocument); n2.firstChild; ) l2.appendChild(n2.firstChild);
              else l2 = n2;
              return (le.shadowroot || le.shadowrootmode) && (l2 = Xt.call(i2, l2, true)), l2;
            }
            let u3 = Se ? n2.outerHTML : n2.innerHTML;
            return Se && ie["!doctype"] && n2.ownerDocument && n2.ownerDocument.doctype && n2.ownerDocument.doctype.name && k(rt, n2.ownerDocument.doctype.name) && (u3 = "<!DOCTYPE " + n2.ownerDocument.doctype.name + ">\n" + u3), ge && (u3 = gn(u3)), zt && xe ? jt(u3) : u3;
          }, o2.setConfig = function() {
            on(arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}), Te = true, Ae = ie, Ee = le;
          }, o2.clearConfig = function() {
            tn = null, Te = false, Ae = null, Ee = null, zt = Mt, Pt = "";
          }, o2.isValidAttribute = function(t3, e3, n2) {
            tn || on({});
            const o3 = Qe(t3), r3 = Qe(e3);
            return Nn(o3, r3, n2);
          }, o2.addHook = function(t3, e3) {
            "function" == typeof e3 && D(Kt, t3) && y(Kt[t3], e3);
          }, o2.removeHook = function(t3, e3) {
            if (D(Kt, t3)) {
              if (void 0 !== e3) {
                const n2 = d(Kt[t3], e3);
                return -1 === n2 ? void 0 : g(Kt[t3], n2, 1)[0];
              }
              return h(Kt[t3]);
            }
          }, o2.removeHooks = function(t3) {
            D(Kt, t3) && (Kt[t3] = []);
          }, o2.removeAllHooks = function() {
            Kt = { afterSanitizeAttributes: [], afterSanitizeElements: [], afterSanitizeShadowDOM: [], beforeSanitizeAttributes: [], beforeSanitizeElements: [], beforeSanitizeShadowDOM: [], uponSanitizeAttribute: [], uponSanitizeElement: [], uponSanitizeShadowNode: [] };
          }, o2;
        })();
        return Et;
      });
    }
  });

  // banner-src/script.js
  var import_purify_min = __toESM(require_purify_min());

  // banner-src/style.css
  var style_default = `/* Bannern ligger i en shadow root. :host ar dess ytterelement, som ligger kvar
   i kundens sida med id="cookie-sectionId". Kundens egna varden satta pa det
   id:t vinner over dessa standardvarden och arvs in genom skuggan - darfor
   fortsatter befintliga designblock att fungera utan andring.

   display: contents gor att vardelementet inte tar plats i kundens layout. */
:host {
  display: contents;

  /* Color scheme dark mode */
  --bg-main: #0e0e0e;
  --bg-muted: rgba(255, 255, 255, 0.1);
  --text-main: #ffffff;
  --text-muted: #9ca3af;
  --accent-color: #686868;
  --accent-hover: #6366f1;
  --bg-dark-btn: #111827;
  --border-color: rgba(255, 255, 255, 0.2);
  --btn-border: rgba(255, 255, 255, 0.5);
  --logo-color: #ffffff;
  --bg-logo-wrapper: #686868;
  --bg-customize-btn: #1d1d1d;

  /* Knapptext och hovring. Egna variabler eftersom en kund inte langre kan na
     in i skuggan med en vanlig CSS-regel - variablerna ar vagen in i stallet.
     Standardvardena ger exakt samma utseende som fore Shadow DOM. */
  --btn-accent-text: var(--text-main);
  --btn-hover-filter: brightness(1.2);
  /* Samma farg som knappens vanliga bakgrund = ingen forandring vid hovring,
     precis som forut. Effekten kom fran filtret, inte fran bakgrunden. */
  --btn-secondary-hover-bg: var(--bg-customize-btn);
  --btn-secondary-hover-filter: var(--btn-hover-filter);

  /* Radhojder. Lag tidigare i kundens egen reset och skilde sig darfor mellan
     sajterna. Nu bannerns eget varde, lika overallt - och stallbart per sajt. */
  --btn-line-height: 1.2;
  --header-line-height: 1.2;

  /* Fokusmarkering. Egen variabel sa en sajt kan gora den synlig mot sin egen
     bakgrund - en ring som inte syns ar samma sak som ingen ring. */
  /* Brodtextfargen, inte currentColor: pa en knapp med ljus text hade ringen
     ritats ljus mot bannerns ljusa bakgrund och blivit osynlig. --text-main
     maste per definition kontrastera mot --bg-main. */
  --fokus-ring: 2px solid var(--text-main);
  /* Rullningsstapeln. Foljer --text-muted som standard, sa den anpassar sig
     till varje sajts fargskala utan egen konfiguration - men gar att satta
     for sig om den blir for stark eller for svag. */
  --scrollbar-thumb: var(--text-muted);
  --policy-link-color: var(--text-main);
  --badge-text-color: var(--text-main);

  --toggle-switch-bg: #374151;
  --scroll-gradient: radial-gradient(
    ellipse at bottom,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(17, 24, 39, 0.6) 40%,
    transparent 80%
  );
  --icon-path: url('/src/Cookie Icon Wrapper.svg');

  /* Typography.
     Bannern ARVER sidans typsnitt som standard, med flit: den ska smalta in
     pa sajten den hamnar pa, inte bara SEOS egna. Typsnitt ar en arvd
     CSS-egenskap och passerar darfor skuggan, till skillnad fran vanliga
     regler. Bannern laddar aldrig egna typsnitt - den anvander de sajten
     redan har.

     Egen variabel for rubriken: manga sajter har ett typsnitt for rubriker
     och ett annat for brodtext. Satt bada explicit for att lasa utseendet. */
  --main-font: inherit;
  --header-font: var(--main-font);
  /* GEOMETRI harifran och ner. Ska vara LIKA pa alla sajter - bannern ska
     kannas som samma komponent overallt. Overstyr inte dessa per kund; ratta
     i stallet basvardet har, sa naar andringen alla. Det som far variera per
     sajt ar varumarket: typsnitt, radier och farger.

     Varden hamtade fran brevenshus 2026-08-20, som var nedskalade for hand.
     De gamla basvardena (850 px, 18 px brodtext) gav en pafallande stor
     banner - synligt pa seosdesign, som kor pa basen. */
  --header-text-size: clamp(1rem, 0.95rem + 0.22vw, 1.1875rem);
  --body-text-size: clamp(0.8125rem, 0.78rem + 0.16vw, 0.9375rem);
  --badge-text-size: 0.625rem;
  --small-text-size: 0.75rem;

  --icon-container-size: clamp(2.125rem, 2rem + 0.4vw, 2.5rem);
  --banner-width: 640px;

  /* Radierna hor till VARUMARKET, inte geometrin - en sajt med pillerformade
     knappar ska kunna ha det aven i bannern. Overstyr fritt per sajt. */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  /* Avstandsskala, 320px -> 1240px. Geometri: lika overallt. */
  --space-xs: clamp(0.375rem, 0.35rem + 0.1vw, 0.5rem);
  --space-sm: clamp(0.625rem, 0.59rem + 0.15vw, 0.75rem);
  --space-md: clamp(0.75rem, 0.68rem + 0.3vw, 1rem);
  --space-lg: clamp(1rem, 0.9rem + 0.45vw, 1.375rem);
  --space-xl: clamp(1.5rem, 1.35rem + 0.6vw, 2rem);

  /* Reglagets bredd. Egen variabel for att beskedskortet ska kunna reservera
     exakt lika mycket plats - annars linjerar inte raderna nar en kategori
     visas som besked i stallet for som reglage. Geometri, alltsa densamma pa
     alla sajter och inte stallbar fran databasen. */
  --toggle-width: 44px;
}

.light-theme {
  /* Background and text */
  --bg-main: #f1f3f1;
  --bg-muted: rgba(0, 0, 0, 0.05);
  --text-main: #111827;
  --text-muted: #4b5563;
  /* Accent and logo */
  --accent-color: #66c966;
  --logo-color: #4a9e4a;
  --bg-logo-wrapper: #ffffff;
  /* Buttons and borders */
  --border-color: #d1d5db;
  --btn-border: #d1d5db;
  --bg-customize-btn: #ffffff;
  /* Toggles */
  --toggle-switch-bg: #d1d5db;
  --toggle-circle: #ffffff;
  /* Scroll shadow */
  --scroll-gradient: radial-gradient(
    ellipse at bottom,
    rgba(0, 0, 0, 0.09) 0%,
    rgba(0, 0, 0, 0.04) 40%,
    transparent 80%
  );
}

/* Egen aterstallning INUTI skuggan.
   Fore isoleringen lag bannern i kundens sida och arvde deras globala reset -
   Webflow satter box-sizing: border-box och far knappar att arva typsnitt.
   Det markte vi aldrig, for det fanns alltid nagon annans reset att luta sig
   mot. Utestangd blir bannern beroende av webblasarens standardvarden i
   stallet, och knapparna foll tillbaka pa Arial. Nu bar bannern sitt eget. */
*,
*::before,
*::after {
  box-sizing: border-box;
}

.dark-bg {
  background-color: #222831;
}
/*  CONTAINER - BASIC STRUCTURE */
.cookie-section {
  position: fixed;
  inset: 0;
  padding: var(--space-lg);
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  z-index: 9999;
  font-family: var(--main-font);
  pointer-events: none;
}

/* THE CONTENTS AND BUILDING BLOCK */
.cookie {
  background-color: var(--bg-main);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  width: min(var(--banner-width), calc(100vw - var(--space-xl)));
  max-width: calc(100vw - var(--space-xl));
  max-height: calc(100svh - var(--space-xl));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  position: relative;
  margin-left: 0;
}

/* HEADER */
.cookie-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-lg) 0;
  flex-shrink: 0;
}

/* CONTENT AND SCROLL AREA */
.cookie-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--space-lg);
  display: flex;
  flex-direction: column;
  position: relative;
  -webkit-overflow-scrolling: touch;

  /* SYNLIG SCROLLBAR, med flit.
     Den var tidigare dold (scrollbar-width: none). Det sag renare ut men tog
     bort den enda markeringen for att det finns mer att lasa - och i
     policyrutan finns ingen annan: toningen i botten hor bara till
     installningsrutan. Cirka 60 procent av policytexten ligger under kanten,
     och sist av allt star vilken policyversion besokaren faktiskt fick se.
     En besokare som tror att policyn ar fem avsnitt har blivit samre
     informerad an en som ser att den ar nio.

     Egen styling och inte webblasarens standard: pa macOS och iOS ar
     scrollbars dolda tills man borjar rulla, alltsa precis nar de INTE
     behovs. ::-webkit-scrollbar gor den bestandig. */
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
}

.cookie-content::-webkit-scrollbar {
  width: 8px;
}

.cookie-content::-webkit-scrollbar-track {
  background: transparent;
}

.cookie-content::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb);
  border-radius: 999px;
  /* Genomskinlig kant + padding-box gor stapeln smalare och indragen utan
     att traffytan krymper. */
  border: 2px solid transparent;
  background-clip: padding-box;
}

/* LOGO CONTAINER */
.cookie-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--icon-container-size);
  height: var(--icon-container-size);
  background-color: var(--bg-logo-wrapper);
  flex-shrink: 0;
  border-radius: var(--radius-sm);
}

/* LOGO DESIGN */
.cookie-icon-svg {
  width: 90%;
  height: 90%;
  color: var(--logo-color);
  transition: fill 0.2s ease;
}

.cookie h2 {
  margin: 0;
  font-family: var(--header-font);
  font-size: var(--header-text-size);
  font-weight: 700;
  line-height: var(--header-line-height);
  text-transform: none;
}
.cookie-body p {
  font-size: var(--body-text-size);
  line-height: 1.6;
  border-bottom: 1px solid var(--bg-muted);
  padding-bottom: var(--space-md);
  margin-top: var(--space-xs);
}

/* LAYOUT CONTAINER FOR BUTTON GROUPS */
.cookie-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-lg) var(--space-lg);
  flex-shrink: 0;
}
/* BASE STYLES FOR ALL BUTTONS */
button {
  /* Knappar arver INTE typsnitt av sig sjalva - webblasaren ger dem Arial.
     Fore isoleringen fixade kundens reset det at oss. */
  font-family: inherit;
  line-height: var(--btn-line-height);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--body-text-size);
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
}

/* NECESSARY ONLY AND ACCCEPT ALL BUTTONS */
.main-actions {
  display: flex;
  gap: 12px;
}
/* PURPLE BUTTONS (Save, Accept All) */
.btn-save,
.btn-reject {
  background-color: var(--accent-color);
  color: var(--btn-accent-text);
  border: 1px solid var(--btn-border);
}

/* DARK BUTTONS (Minimize, Customize, Reject, Return) */
.btn-customize,
.btn-back {
  background-color: var(--bg-customize-btn);
  color: var(--text-main);
  border: 1px solid var(--btn-border);
}

/* FOOTER BUTTON FOR OPENING BANNER */
.cookie-settings-btn {
  color: var(--text-main);
  background-color: var(--accent-color);
  position: static;
  display: inline-block;
}

button:hover {
  filter: var(--btn-hover-filter);
}

.btn-customize:hover,
.btn-back:hover {
  background-color: var(--btn-secondary-hover-bg);
  filter: var(--btn-secondary-hover-filter);
}

/* CUSTOMIZE LOGO SVG */
.btn-icon {
  width: 16px;
  height: 16px;
  display: inline-block;
  vertical-align: middle;
  color: inherit;
  transition: transform 0.3s ease;
}
/* Egen variabel, och INTE --accent-color som forut. Accentfargen anvands ocksa
   som knappbakgrund, sa den ar vald for att text ska synas OVANPA den - inte
   for att sjalv vara lasbar text. Pa standardtemat gav det 3,46:1 mot
   bakgrunden dar WCAG kraver 4,5:1. Standardvardet ar nu brodtextfargen, som
   per definition maste kontrastera mot bakgrunden. Understrykningen gor att
   lanken anda gar att skilja fran vanlig text. */
.policy-link {
  color: var(--policy-link-color);
  text-decoration: none;
  transition: filter 0.2s;
  border-bottom: 1px solid currentColor;
  padding-bottom: 1px;
}

.policy-link:hover {
  filter: brightness(1.5);
}

/*  SETTINGS  */
.cookie-settings-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.cookie-category-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-lg);
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--bg-muted);
}
/* BESKEDSKORT (C1 steg 2, beskedslaget).
   Kategorin finns men sajten anvander den inte, sa kortet har ingen knapp.
   Utan reserverad plats for reglaget skulle texten bli bredare an de andra
   korten och raderna sluta linjera. Marginalen halls darfor kvar. */
.cookie-category-card.category-notice {
  padding-right: calc(var(--space-lg) + var(--toggle-width));
  cursor: default;
}
.category-text-wrapper h5 {
  margin: 0;
  font-size: var(--body-text-size);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  text-transform: none;
}
.category-text-wrapper p {
  color: var(--text-muted);
  font-size: var(--body-text-size);
  margin-top: 4px;
}

/* TOGGLES */
/* Reglaget ar en <button role="switch"> sedan C8. Den arver darfor knapp-
   reglerna ovan (padding, inline-flex, ram) och maste nollstalla dem. */
.toggle-switch {
  width: var(--toggle-width);
  height: 24px;
  min-width: var(--toggle-width);
  padding: 0;
  border: none;
  display: block;
  background: var(--toggle-switch-bg);
  border-radius: var(--radius-md);
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

/* Fokus maste SYNAS. Utan detta vet den som anvander tangentbord inte var hen
   ar - WCAG 2.4.7. :focus-visible visar ringen for tangentbord men inte vid
   musklick. Ringen ligger utanfor elementet sa den syns aven pa smaknappar. */
:focus-visible {
  outline: var(--fokus-ring);
  outline-offset: 2px;
}

/* Respektera systemets installning for minskad rorelse - WCAG 2.3.3. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

.toggle-slider {
  width: 18px;
  height: 18px;
  background: var(--toggle-circle, var(--text-main));
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: 0.2s;
}
.toggle-switch.active,
.toggle-switch.always-active {
  background: var(--accent-color);
}
.toggle-switch.always-active:hover {
  cursor: not-allowed;
}

.toggle-switch.active .toggle-slider,
.toggle-switch.always-active .toggle-slider {
  left: 23px;
}

/* REQUIRED BADGE FOR STRICTLY NECESSSARY */
.badge {
  background: var(--bg-logo-wrapper);
  font-size: var(--badge-text-size);
  line-height: 1.4; /* explicit sa kundens radhojd inte styr badgens hojd */
  padding: 2px 6px;
  border-radius: 4px;
  /* Brodtextfargen, inte den dampade. Badgen ligger pa --bg-logo-wrapper, en
     mellanton, och dampad text pa mellanton gav 2,19:1 dar WCAG kraver 4,5.
     Egen variabel sa en sajt vars logotypruta har annan ljushet kan ratta till
     det - kontrasten beror pa kundens fargval och gar inte att garantera har. */
  color: var(--badge-text-color);
}

/* UI-kansla: ingen textmarkering pa kontroller och etiketter.
   Policytexten lamnas markerbar sa besokare kan kopiera den. */
.cookie h2,
.cookie h5,
.badge,
.cookie button,
.cookie-category-card,
.toggle-switch {
  user-select: none;
  -webkit-user-select: none;
}

/* ANIMATION LIGHT FOR SCROLLING */
.scroll-shadow {
  position: relative;
  width: 100%;
  height: 60px;
  margin-top: -60px;
  background: var(--scroll-gradient);
  pointer-events: none;
  z-index: 100;
  transition: opacity 0.4s ease;
  opacity: 0;
  flex-shrink: 0;
}

/* POLICY MODAL STYLING */

.policy-container {
  padding-bottom: 0;
}

#cookie-policy .cookie-header {
  margin: 0 var(--space-lg);
  padding: var(--space-lg) 0 var(--space-md) 0;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-shrink: 0;
}

#cookie-policy .cookie-icon-container {
  width: var(--icon-container-size);
  height: var(--icon-container-size);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-logo-wrapper);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

#cookie-policy .cookie-content {
  padding-top: var(--space-md);
}

#cookie-policy h2 {
  font-size: var(--header-text-size);
  font-weight: 700;
  margin: 0;
  color: var(--text-main);
}

.policy-container h2 {
  margin-top: 0;
  margin-bottom: var(--space-md);
  color: var(--text-main);
  font-size: var(--header-text-size);
}

.policy-container h3 {
  font-size: 1.125rem; /* 18px */
  font-weight: 600;
  margin-top: var(--space-md);
  margin-bottom: var(--space-sm);
  color: var(--text-main);
}

.policy-container p {
  font-size: var(--body-text-size);
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: var(--space-md);
}
/* RESPONSIVE TABLES MOBILE/DESKTOP */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* soft scrolling on ios */
  margin-bottom: var(--space-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background-color: var(--bg-main);
}

.policy-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
  font-size: 0.9rem;
}

/* TABLE HEAD */
.policy-table th {
  text-align: left;
  padding: var(--space-md);
  background-color: var(--bg-muted);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-main);
}

/* TABLECELLS */
.policy-table td {
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-muted);
  vertical-align: top;
}

.policy-table tbody tr:last-child td {
  border-bottom: none;
}

.policy-footer-note {
  margin-top: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-color);
  font-size: var(--small-text-size);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.policy-footer-note p {
  font-size: var(--small-text-size);
  color: var(--text-muted);
  margin: 0;
}

@media (max-width: 475px) {
  .cookie-section {
    padding: var(--space-xs);
    align-items: flex-end;
    justify-content: center;
    padding-top: var(--space-lg);
    padding-bottom: var(--space-lg);
  }
  .cookie {
    width: 100%;
    max-height: calc(100svh - 48px);
    height: auto;
    margin-top: 0;
  }

  .cookie-header {
    padding: var(--space-md) var(--space-md) 0;
  }

  .cookie-content {
    padding: 0 var(--space-md);
    flex: 1;
    min-height: 0;
    padding: var(--space-xs) var(--space-md);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .cookie-buttons {
    flex-direction: column;
    align-items: stretch;
    padding: var(--space-sm);
    gap: var(--space-sm);
  }

  .cookie-buttons .main-actions {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .main-actions {
    display: flex;
    gap: var(--space-sm);
  }
}
`;

  // banner-src/script.js
  (function() {
    const PRODUCTION_API_URL = "https://seos-cookie-banner-api.vercel.app";
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const API_BASE_URL = isLocalhost ? "http://127.0.0.1:3000" : PRODUCTION_API_URL;
    let client_consent_id_cache = null;
    const LONG_LIVED_COOKIE_DAYS = 30;
    const BANNER_ID = "cookie-banner";
    const SETTINGS_ID = "cookie-settings";
    const POLICY_ID = "cookie-policy";
    const HOST_ID = "cookie-sectionId";
    let shadow = null;
    function el(id) {
      return shadow ? shadow.getElementById(id) : null;
    }
    const DEBUG = false;
    function log(...args) {
      if (DEBUG) console.log(...args);
    }
    const translations = {
      en: {
        bannerTitle: "We value your privacy",
        bannerBody: 'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
        policyLink: "Read our Cookie policy",
        customize: "Customize",
        necessaryOnly: "Necessary only",
        acceptAll: "Accept all",
        settingsTitle: "Cookie Settings",
        settingsBody: "Manage your preferences below. Strictly necessary cookies are always active.",
        necessaryLabel: "Strictly Necessary",
        requiredBadge: "REQUIRED",
        necessaryDesc: "Essential for the website to function properly.",
        analyticsLabel: "Analytics and Performance",
        analyticsDesc: "Helps us understand how the website is used.",
        functionalLabel: "Functional",
        functionalDesc: "Remembers your personal preferences.",
        marketingLabel: "Marketing",
        marketingDesc: "Used to deliver relevant ads and track visitors.",
        // Beskedslaget: visas i stallet for ett reglage nar sajten inte
        // anvander kategorin. En utsaga, inte en fraga.
        analyticsNone: "This website does not use any analytics cookies.",
        functionalNone: "This website does not use any functional cookies.",
        marketingNone: "This website does not use any marketing cookies.",
        returnBtn: "Return",
        savePreferences: "Save preferences",
        policyTitle: "Cookie Policy",
        policyLoading: "Loading cookie policy...",
        policyErrorTitle: "Could not load policy.",
        policyErrorBody: "Could not find an active policy for this domain.",
        policyNetworkTitle: "Network Error",
        policyNetworkBody: "Could not connect to the server to fetch policy.",
        close: "Close",
        // Platshallaren for en inbaddning som hallits tillbaka (C5).
        blockedBody: "This content appears once you accept {kategori}.",
        blockedButton: "Change settings"
      },
      sv: {
        bannerTitle: "Vi värnar om din integritet",
        bannerBody: 'Vi använder cookies för att förbättra din upplevelse, visa anpassat innehåll och analysera vår trafik. Genom att klicka på "Acceptera alla" godkänner du vår användning av cookies.',
        policyLink: "Läs vår cookiepolicy",
        customize: "Anpassa",
        necessaryOnly: "Endast nödvändiga",
        acceptAll: "Acceptera alla",
        settingsTitle: "Cookieinställningar",
        settingsBody: "Hantera dina inställningar nedan. Strikt nödvändiga cookies är alltid aktiva.",
        necessaryLabel: "Strikt nödvändiga",
        requiredBadge: "KRÄVS",
        necessaryDesc: "Nödvändiga för att webbplatsen ska fungera korrekt.",
        analyticsLabel: "Analys och prestanda",
        analyticsDesc: "Hjälper oss förstå hur webbplatsen används.",
        functionalLabel: "Funktionella",
        functionalDesc: "Kommer ihåg dina personliga inställningar.",
        marketingLabel: "Marknadsföring",
        marketingDesc: "Används för att visa relevanta annonser och spåra besökare.",
        analyticsNone: "Den här webbplatsen använder inga analyscookies.",
        functionalNone: "Den här webbplatsen använder inga funktionella cookies.",
        marketingNone: "Den här webbplatsen använder inga marknadsföringscookies.",
        returnBtn: "Tillbaka",
        savePreferences: "Spara inställningar",
        policyTitle: "Cookiepolicy",
        policyLoading: "Hämtar cookiepolicy...",
        policyErrorTitle: "Kunde inte ladda policyn.",
        policyErrorBody: "Hittade ingen aktiv policy för den här domänen.",
        policyNetworkTitle: "Nätverksfel",
        policyNetworkBody: "Kunde inte ansluta till servern för att hämta policyn.",
        close: "Stäng",
        blockedBody: "Innehållet visas när du godkänt {kategori}.",
        blockedButton: "Ändra inställningar"
      }
    };
    const selfScript = document.currentScript || document.querySelector('script[src*="seos-cookie-banner"]');
    const SITE_KEY = selfScript && selfScript.dataset && selfScript.dataset.siteKey || window.SEOS_SITE_KEY || null;
    const DESIGN_VARIABLES = /* @__PURE__ */ new Set([
      "bg-main",
      "bg-muted",
      "text-main",
      "text-muted",
      "accent-color",
      "accent-hover",
      "bg-dark-btn",
      "border-color",
      "btn-border",
      "logo-color",
      "bg-logo-wrapper",
      "bg-customize-btn",
      "toggle-switch-bg",
      "toggle-circle",
      "btn-accent-text",
      "btn-hover-filter",
      "btn-secondary-hover-bg",
      "btn-secondary-hover-filter",
      "fokus-ring",
      "scrollbar-thumb",
      "policy-link-color",
      "badge-text-color",
      "scroll-gradient",
      "main-font",
      "header-font",
      "radius-sm",
      "radius-md",
      "radius-lg"
    ]);
    const UNSAFE_VALUE = /url\(|expression\(|javascript:|@import|[<>{}\\;]/i;
    const CATEGORY_KEYS = ["necessary", "analytics", "functional", "marketing"];
    const DEFAULT_CATEGORIES = CATEGORY_KEYS.map((key) => ({
      key,
      is_required: key === "necessary",
      visibility: "toggle"
    }));
    function sanitizeCategories(list) {
      if (!Array.isArray(list)) return [];
      const found = /* @__PURE__ */ new Map();
      for (const row of list) {
        if (!row || typeof row !== "object") continue;
        if (typeof row.key !== "string") continue;
        if (CATEGORY_KEYS.indexOf(row.key) === -1) continue;
        found.set(row.key, {
          is_required: row.is_required === true,
          // Bara ett uttryckligt 'notice' ger besked. Allt annat - okant varde,
          // saknat falt, ett API som annu inte skickar det - blir reglage.
          // Det sakra fallet ar att FRAGA, inte att pasta nagot om sajten.
          visibility: row.visibility === "notice" ? "notice" : "toggle"
        });
      }
      if (!found.size) return [];
      found.set("necessary", { is_required: true, visibility: "toggle" });
      return CATEGORY_KEYS.filter((key) => found.has(key)).map((key) => ({
        key,
        is_required: found.get(key).is_required,
        visibility: found.get(key).visibility
      }));
    }
    const CONFIG_TIMEOUT_MS = 800;
    let loadedDesign = null;
    let loadedCategories = null;
    let loadedTexts = null;
    function activeCategories() {
      return loadedCategories && loadedCategories.length ? loadedCategories : DEFAULT_CATEGORIES;
    }
    function toggleCategories() {
      return activeCategories().filter((category) => category.visibility !== "notice");
    }
    const TEXT_LANGUAGES = /* @__PURE__ */ new Set(["sv", "en"]);
    const TEXT_FIELDS = /* @__PURE__ */ new Set(["label", "description", "notice"]);
    const MAX_TEXT_LENGTH = 300;
    const UNSAFE_TEXT = /[<>]/;
    function isValidText(value) {
      return typeof value === "string" && value.trim().length > 0 && value.length <= MAX_TEXT_LENGTH && !UNSAFE_TEXT.test(value);
    }
    function sanitizeTexts(texts) {
      if (!texts || typeof texts !== "object" || Array.isArray(texts)) return {};
      const cleaned = {};
      for (const lang in texts) {
        if (!TEXT_LANGUAGES.has(lang)) continue;
        const categories = texts[lang];
        if (!categories || typeof categories !== "object" || Array.isArray(categories)) continue;
        const perCategory = {};
        for (const category in categories) {
          if (CATEGORY_KEYS.indexOf(category) === -1) continue;
          const field = categories[category];
          if (!field || typeof field !== "object" || Array.isArray(field)) continue;
          const perField = {};
          for (const name in field) {
            if (!TEXT_FIELDS.has(name)) continue;
            if (category === "necessary" && name === "notice") continue;
            if (!isValidText(field[name])) continue;
            perField[name] = field[name];
          }
          if (Object.keys(perField).length > 0) perCategory[category] = perField;
        }
        if (Object.keys(perCategory).length > 0) cleaned[lang] = perCategory;
      }
      return cleaned;
    }
    function applyDesign() {
      if (!loadedDesign) return;
      const host = document.getElementById(HOST_ID);
      if (!host) return;
      for (const key in loadedDesign) {
        host.style.setProperty("--" + key, loadedDesign[key]);
      }
    }
    function isFreshMode() {
      try {
        if (window.SEOS_FARSK) return true;
        return new URLSearchParams(window.location.search).has("seos_farsk");
      } catch (e) {
        return false;
      }
    }
    const EMPTY_CONFIG = { design: {}, categories: [], texts: {} };
    async function fetchConfig() {
      if (!SITE_KEY) return EMPTY_CONFIG;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CONFIG_TIMEOUT_MS);
      try {
        const url = `${API_BASE_URL}/config/${encodeURIComponent(SITE_KEY)}` + (isFreshMode() ? `?farsk=${Date.now()}` : "");
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return EMPTY_CONFIG;
        const data = await response.json();
        if (!data || typeof data !== "object") return EMPTY_CONFIG;
        const design = data.design;
        const cleaned = {};
        if (design && typeof design === "object") {
          for (const key in design) {
            const value = design[key];
            if (!DESIGN_VARIABLES.has(key)) continue;
            if (typeof value !== "string" || !value || value.length > 200) continue;
            if (UNSAFE_VALUE.test(value)) continue;
            cleaned[key] = value;
          }
        }
        return {
          design: cleaned,
          categories: sanitizeCategories(data.categories),
          texts: sanitizeTexts(data.texts)
        };
      } catch (error) {
        log("[Config] Kunde inte hamta config:", error && error.message);
        return EMPTY_CONFIG;
      } finally {
        clearTimeout(timer);
      }
    }
    let configPromise = null;
    function ensureConfig() {
      if (!configPromise) {
        configPromise = fetchConfig().then((config) => {
          loadedDesign = config.design;
          loadedCategories = config.categories;
          loadedTexts = config.texts;
          applyDesign();
          applyCategories();
          return config;
        });
      }
      return configPromise;
    }
    function applyCategories() {
      const container = el("settings-container");
      if (!container) return;
      container.textContent = "";
      renderCategoryCards(container);
    }
    if (!getCookie("consent_status")) ensureConfig();
    const META_PIXEL_ID = selfScript && selfScript.dataset && selfScript.dataset.metaPixelId || window.SEOS_META_PIXEL_ID || null;
    let metaPixelLoaded = false;
    const pageLang = (window.SEOS_COOKIE_LANG || document.documentElement.lang || "").split("-")[0].toLowerCase();
    const t = translations[pageLang] || translations["en"];
    const textLang = translations[pageLang] ? pageLang : "en";
    function categoryTexts() {
      const own = loadedTexts && loadedTexts[textLang] || {};
      const pick = (key, field, fallback) => {
        const row = own[key];
        return row && typeof row[field] === "string" ? row[field] : fallback;
      };
      return {
        necessary: {
          label: pick("necessary", "label", t.necessaryLabel),
          description: pick("necessary", "description", t.necessaryDesc)
        },
        analytics: {
          label: pick("analytics", "label", t.analyticsLabel),
          description: pick("analytics", "description", t.analyticsDesc),
          notice: pick("analytics", "notice", t.analyticsNone)
        },
        functional: {
          label: pick("functional", "label", t.functionalLabel),
          description: pick("functional", "description", t.functionalDesc),
          notice: pick("functional", "notice", t.functionalNone)
        },
        marketing: {
          label: pick("marketing", "label", t.marketingLabel),
          description: pick("marketing", "description", t.marketingDesc),
          notice: pick("marketing", "notice", t.marketingNone)
        }
      };
    }
    function renderCategoryCards(container) {
      const texts = categoryTexts();
      for (const category of activeCategories()) {
        const copy = texts[category.key];
        if (!copy) continue;
        if (category.visibility === "notice" && !copy.notice) continue;
        const isNotice = category.visibility === "notice";
        const card = document.createElement("div");
        card.className = isNotice ? "cookie-category-card category-notice" : "cookie-category-card";
        const wrapper = document.createElement("div");
        wrapper.className = "category-text-wrapper";
        const heading = document.createElement("h5");
        heading.id = `etikett-${category.key}`;
        heading.textContent = copy.label;
        const bodyText = document.createElement("p");
        bodyText.id = `text-${category.key}`;
        bodyText.textContent = isNotice ? copy.notice : copy.description;
        wrapper.append(heading, bodyText);
        card.appendChild(wrapper);
        if (isNotice) {
          container.appendChild(card);
          continue;
        }
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("role", "switch");
        button.setAttribute("aria-labelledby", heading.id);
        button.setAttribute("aria-describedby", bodyText.id);
        if (category.is_required) {
          const badge = document.createElement("span");
          badge.className = "badge";
          badge.textContent = t.requiredBadge;
          heading.append(" ", badge);
          button.className = "toggle-switch always-active";
          button.setAttribute("aria-checked", "true");
          button.disabled = true;
        } else {
          const toggleId = `${category.key}-toggle`;
          card.dataset.handling = "vaxla";
          card.dataset.reglage = toggleId;
          button.className = "toggle-switch";
          button.id = toggleId;
          button.setAttribute("aria-checked", "false");
        }
        const slider = document.createElement("span");
        slider.className = "toggle-slider";
        button.appendChild(slider);
        card.appendChild(button);
        container.appendChild(card);
      }
    }
    function injectBannerHTML() {
      if (document.getElementById(HOST_ID)) return;
      const cookieIconSVG = `
      <svg class="cookie-icon-svg" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10C18.0222 10 16.0888 10.5865 14.4443 11.6853C12.7998 12.7841 11.5181 14.3459 10.7612
  16.1732C10.0043 18.0004 9.8063 20.0111 10.1922 21.9509C10.578 23.8907 11.5304 25.6725 12.9289 27.0711C14.3275 28.4696
  16.1093 29.422 18.0491 29.8079C19.9889 30.1937 21.9996 29.9957 23.8268 29.2388C25.6541 28.4819 27.2159 27.2002 28.3147
   25.5557C29.4135 23.9112 30 21.9778 30 20C29.305 20.214 28.5648 20.2345 27.8591 20.0593C27.1533 19.8841 26.5087
  19.5198 25.9945 19.0056C25.4803 18.4913 25.116 17.8467 24.9407 17.1409C24.7655 16.4352 24.786 15.695 25 15C24.305
  15.214 23.5648 15.2345 22.8591 15.0593C22.1533 14.8841 21.5087 14.5198 20.9945 14.0056C20.4803 13.4913 20.116 12.8467
  19.9407 12.1409C19.7655 11.4352 19.786 10.695 20 10Z" />
        <path d="M16.5 16.5V16.51" /><path d="M24 23.5V23.51" /><path d="M20 20V20.01" /><path d="M19 25V25.01" /><path
  d="M15 22V22.01" />
      </svg>`;
      const bannerHTML = `
  <section class="cookie-section" lang="${pageLang || "en"}">

    <div class="cookie" id="${BANNER_ID}" style="display: none;" role="dialog" tabindex="-1" aria-labelledby="rubrik-banner">
      <div class="cookie-header">
        <div class="cookie-icon-container">${cookieIconSVG}</div>
        <h2 id="rubrik-banner">${t.bannerTitle}</h2>
      </div>
      <div class="cookie-content">
        <div class="cookie-body">
          <p>${t.bannerBody}
          <a class="policy-link" href="#" data-handling="visaPolicy"> ${t.policyLink}</a></p>
        </div>
      </div>
      <div class="cookie-buttons">
        <button class="btn-customize" data-handling="oppnaInstallningar">${t.customize}
          <svg class="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-linecap="round"
  stroke-linejoin="round">
            <path d="M9.33334 11.3333H3.33334" /><path d="M12.6667 4.66666H6.66666" />
            <path d="M11.3333 13.3333C12.4379 13.3333 13.3333 12.4379 13.3333 11.3333C13.3333 10.2288 12.4379 9.33334
  11.3333 9.33334C10.2288 9.33334 9.33334 10.2288 9.33334 11.3333C9.33334 12.4379 10.2288 13.3333 11.3333 13.3333Z" />
            <path d="M4.66666 6.66666C5.77123 6.66666 6.66666 5.77123 6.66666 4.66666C6.66666 3.56209 5.77123 2.66666
  4.66666 2.66666C3.56209 2.66666 2.66666 3.56209 2.66666 4.66666C2.66666 5.77123 3.56209 6.66666 4.66666 6.66666Z" />
          </svg>
        </button>
        <div class="main-actions">
          <button class="btn-reject" data-handling="endastNodvandiga">${t.necessaryOnly}</button>
          <button class="btn-save" data-handling="acceptaAlla">${t.acceptAll}</button>
        </div>
      </div>
    </div>

    <div class="cookie" id="${SETTINGS_ID}" style="display: none;" role="dialog" tabindex="-1" aria-labelledby="rubrik-installningar">
      <div class="cookie-header">
        <div class="cookie-icon-container">${cookieIconSVG}</div>
        <h2 id="rubrik-installningar">${t.settingsTitle}</h2>
      </div>
      <div class="cookie-content" id="scroll-area">
        <div class="cookie-body">
          <p>${t.settingsBody}</p>
        </div>
        <div id="settings-container" class="cookie-settings-container"></div>
      </div>
      <div class="scroll-shadow" id="bottom-shadow"></div>
      <div class="cookie-buttons">
        <button class="btn-back" data-handling="tillbaka">${t.returnBtn}</button>
        <div class="main-actions">
          <button class="btn-reject" data-handling="endastNodvandiga">${t.necessaryOnly}</button>
          <button class="btn-save" data-handling="sparaInstallningar">${t.savePreferences}</button>
        </div>
      </div>
    </div>

    <div class="cookie" id="${POLICY_ID}" style="display: none;" role="dialog" tabindex="-1" aria-labelledby="policy-version-title">
      <div class="cookie-header">
        <div class="cookie-icon-container">${cookieIconSVG}</div>
        <h2 id="policy-version-title">${t.policyTitle}</h2>
      </div>
      <div class="cookie-content">
        <div id="policy-content-area"><p>${t.policyLoading}</p></div>
      </div>
      <div class="cookie-buttons">
        <div class="main-actions">
          <button class="btn-save" data-handling="stangPolicy">${t.close}</button>
        </div>
      </div>
    </div>

  </section>`;
      const host = document.createElement("div");
      host.id = HOST_ID;
      document.body.appendChild(host);
      shadow = host.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.id = "seos-cookie-css";
      style.textContent = style_default;
      shadow.appendChild(style);
      const template = document.createElement("template");
      template.innerHTML = bannerHTML;
      shadow.appendChild(template.content);
      applyCategories();
      bindEvents();
      bindKeyboard();
      bindScroll();
    }
    function bindEvents() {
      const actions = {
        visaPolicy: showPolicy,
        oppnaInstallningar: openSettings,
        endastNodvandiga: acceptEssential,
        acceptaAlla: acceptAll,
        sparaInstallningar: saveSettings,
        tillbaka: backToBanner,
        stangPolicy: closePolicy,
        vaxla: (element) => toggleCookie(el(element.dataset.reglage))
      };
      shadow.addEventListener("click", (event) => {
        const match = event.target.closest("[data-handling]");
        if (!match) return;
        const run = actions[match.dataset.handling];
        if (!run) return;
        event.preventDefault();
        run(match);
      });
    }
    function generateUUID() {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
      }
      console.warn("[Crypto] randomUUID saknas, använder fallback-metod");
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : r & 3 | 8;
        return v.toString(16);
      });
    }
    function setCookie(name, value, days) {
      const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1e3).toUTCString();
      const isSecure = window.location.protocol === "https:";
      const secureFlag = isSecure ? "; Secure" : "";
      if (!isSecure && window.location.hostname !== "127.0.0.1" && window.location.hostname !== "localhost") {
        console.warn("[Security] Insecure cookie - deploy with HTTPS!");
      }
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secureFlag}`;
    }
    function getCookie(name) {
      const cookies = document.cookie.split("; ");
      const cookie = cookies.find((c) => c.startsWith(name + "="));
      if (!cookie) return null;
      const raw = cookie.slice(name.length + 1);
      try {
        return decodeURIComponent(raw);
      } catch (e) {
        return raw;
      }
    }
    function getOrCreateClientId() {
      if (client_consent_id_cache) {
        log("cache exists with: ", client_consent_id_cache);
        return client_consent_id_cache;
      }
      let clientId = getCookie("client_consent_id");
      log("Client ID: ", clientId);
      if (!clientId) {
        log("Generating new guid");
        clientId = generateUUID();
        setCookie("client_consent_id", clientId, 365);
        log("Setting cookie: ", clientId);
      }
      client_consent_id_cache = clientId;
      return clientId;
    }
    let focusBefore = null;
    function moveFocusTo(box) {
      if (!box) return;
      box.focus();
    }
    function rememberFocus() {
      const active = shadow && shadow.activeElement ? shadow.activeElement : document.activeElement;
      if (active) focusBefore = active;
    }
    function restoreFocus() {
      if (focusBefore && typeof focusBefore.focus === "function") focusBefore.focus();
      focusBefore = null;
    }
    function scrollableBox(event) {
      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      for (const node of path) {
        if (node === shadow || node === shadow.host) break;
        if (!node || node.nodeType !== 1) continue;
        const styleEl = window.getComputedStyle(node);
        const scrollable = styleEl.overflowY === "auto" || styleEl.overflowY === "scroll";
        if (scrollable && node.scrollHeight > node.clientHeight + 1) return node;
      }
      return null;
    }
    function bindScroll() {
      if (!shadow) return;
      shadow.addEventListener(
        "wheel",
        (event) => {
          const box = scrollableBox(event);
          if (!box) return;
          const nedat = event.deltaY > 0;
          const canScrollFurther = nedat ? box.scrollTop < box.scrollHeight - box.clientHeight - 1 : box.scrollTop > 0;
          if (canScrollFurther) event.stopPropagation();
        },
        true
      );
    }
    function bindKeyboard() {
      shadow.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        const settings = el(SETTINGS_ID);
        const policy = el(POLICY_ID);
        if (policy && policy.style.display !== "none") {
          event.preventDefault();
          closePolicy();
        } else if (settings && settings.style.display !== "none") {
          event.preventDefault();
          backToBanner();
        }
      });
    }
    function hideAllBanners() {
      el(BANNER_ID).style.display = "none";
      el(SETTINGS_ID).style.display = "none";
      el(POLICY_ID).style.display = "none";
    }
    function showCookieBanner() {
      hideAllBanners();
      el(BANNER_ID).style.display = "flex";
    }
    function showSettingsModal() {
      rememberFocus();
      hideAllBanners();
      const box = el(SETTINGS_ID);
      box.style.display = "flex";
      moveFocusTo(box);
    }
    function showPolicyModal() {
      rememberFocus();
      hideAllBanners();
      const box = el(POLICY_ID);
      box.style.display = "flex";
      moveFocusTo(box);
    }
    function acceptAllConsent() {
      const clientId = getOrCreateClientId();
      const seen = {};
      for (const category of toggleCategories()) seen[category.key] = true;
      return {
        necessary: true,
        analytics: seen.analytics === true,
        marketing: seen.marketing === true,
        functional: seen.functional === true,
        client_id: clientId,
        site_key: SITE_KEY,
        domain: window.location.hostname,
        status: "all",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        userAgent: navigator.userAgent
      };
    }
    function acceptEssentialConsent() {
      const clientId = getOrCreateClientId();
      return {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
        client_id: clientId,
        site_key: SITE_KEY,
        domain: window.location.hostname,
        status: "necessary_only",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        userAgent: navigator.userAgent
      };
    }
    const QUEUE_KEY = "seos_consent_ko";
    const QUEUE_MAX_ITEMS = 10;
    const QUEUE_MAX_AGE_DAYS = 30;
    const QUEUE_MAX_ATTEMPTS = 5;
    function readQueue() {
      try {
        const row = window.localStorage.getItem(QUEUE_KEY);
        const queue = row ? JSON.parse(row) : [];
        return Array.isArray(queue) ? queue : [];
      } catch (e) {
        return [];
      }
    }
    function writeQueue(queue) {
      try {
        if (queue.length) window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        else window.localStorage.removeItem(QUEUE_KEY);
      } catch (e) {
      }
    }
    async function postConsent(payload) {
      try {
        const response = await fetch(`${API_BASE_URL}/consent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          log("[Backend] Consent recorded successfully");
          return "ok";
        }
        if (response.status >= 400 && response.status < 500) {
          const details = await response.json().catch(() => ({}));
          console.error("[Backend] Consent avvisad, status:", response.status, details);
          return "avvisad";
        }
        console.error("[Backend] Consent POST failed, status:", response.status);
        return "fel";
      } catch (error) {
        console.error("[Backend] Network error - could not reach server:", error);
        return "fel";
      }
    }
    function queueConsent(payload) {
      const queue = readQueue();
      queue.push({ payload, attempts: 0 });
      writeQueue(queue.slice(-QUEUE_MAX_ITEMS));
      log("[Ko] Samtycke koat, poster i ko:", Math.min(queue.length, QUEUE_MAX_ITEMS));
    }
    async function flushQueue() {
      const queue = readQueue();
      if (!queue.length) return;
      const remaining = [];
      for (const entry of queue) {
        const age = Date.now() - new Date(entry.payload.timestamp).getTime();
        if (!(age < QUEUE_MAX_AGE_DAYS * 864e5)) continue;
        const result = await postConsent(entry.payload);
        if (result === "ok" || result === "avvisad") continue;
        entry.attempts += 1;
        if (entry.attempts < QUEUE_MAX_ATTEMPTS) remaining.push(entry);
      }
      writeQueue(remaining);
      if (queue.length !== remaining.length) log("[Ko] Skickade", queue.length - remaining.length, "koade samtycken");
    }
    async function saveConsentAndSend(payload) {
      const result = await postConsent(payload);
      if (result === "fel") queueConsent(payload);
    }
    function applyGoogleConsentFromPayload(payload) {
      if (typeof gtag !== "function") {
        console.warn("gtag is not defined, cannot apply consent");
        return;
      }
      gtag("consent", "update", {
        analytics_storage: payload.analytics ? "granted" : "denied",
        ad_storage: payload.marketing ? "granted" : "denied",
        ad_user_data: payload.marketing ? "granted" : "denied",
        ad_personalization: payload.marketing ? "granted" : "denied",
        functionality_storage: payload.functional ? "granted" : "denied",
        personalization_storage: payload.functional ? "granted" : "denied",
        security_storage: "granted"
      });
      log("[Google] Consent mode updated:", {
        analytics: payload.analytics ? "granted" : "denied",
        marketing: payload.marketing ? "granted" : "denied",
        functional: payload.functional ? "granted" : "denied"
      });
    }
    function ensureFbqStub() {
      if (window.fbq) return;
      const n = window.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!window._fbq) window._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
    }
    function loadMetaPixel() {
      if (!META_PIXEL_ID || metaPixelLoaded) return;
      metaPixelLoaded = true;
      const pending = window.fbq && window.fbq.queue ? window.fbq.queue.splice(0) : [];
      fbq("init", META_PIXEL_ID);
      fbq("track", "PageView");
      pending.forEach((call) => window.fbq.queue.push(call));
      if (pending.length) log("[Meta] Koade anrop slappta efter init:", pending.length);
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(s);
      log("[Meta] Pixel laddad efter samtycke:", META_PIXEL_ID);
    }
    function deleteMetaCookies() {
      const host = window.location.hostname;
      const parts = host.split(".");
      const domains = ["", `; domain=${host}`, `; domain=.${host}`];
      if (parts.length > 2) domains.push(`; domain=.${parts.slice(-2).join(".")}`);
      ["_fbp", "_fbc"].forEach((name) => {
        domains.forEach((d) => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d}`;
        });
      });
      log("[Meta] Cookies rensade");
    }
    function applyMetaConsentFromPayload(payload) {
      if (!META_PIXEL_ID) {
        if (typeof fbq === "function") {
          fbq("consent", payload.marketing ? "grant" : "revoke");
        }
        return;
      }
      ensureFbqStub();
      if (payload.marketing) {
        fbq("consent", "grant");
        loadMetaPixel();
      } else {
        fbq("consent", "revoke");
        deleteMetaCookies();
      }
      log("[Meta] Consent:", payload.marketing ? "grant" : "revoke");
    }
    function triggerGTMConsentEvent() {
      if (typeof gtag === "function") {
        gtag("event", "consent_granted_full");
        log("[GTM] Firing custom event: consent_granted_full");
      }
    }
    let currentConsent = null;
    const consentListeners = /* @__PURE__ */ new Set();
    function setConsent(payload) {
      currentConsent = {
        necessary: true,
        analytics: payload.analytics === true,
        functional: payload.functional === true,
        marketing: payload.marketing === true
      };
      applyConsentToEmbeds();
      notifyConsentChange();
    }
    function notifyConsentChange() {
      const detail = { ...currentConsent };
      for (const listener of consentListeners) {
        try {
          listener(detail);
        } catch (error) {
          log("[C5] Lyssnare kastade:", error && error.message);
        }
      }
      try {
        document.dispatchEvent(new CustomEvent("seos:consent", { detail }));
      } catch (error) {
        log("[C5] Kunde inte skicka seos:consent:", error && error.message);
      }
    }
    const seosApi = {
      hasConsent(category) {
        if (category === "necessary") return true;
        if (!currentConsent) return false;
        return currentConsent[category] === true;
      },
      /** Returnerar en funktion som kopplar bort lyssnaren igen. */
      onConsentChange(listener) {
        if (typeof listener !== "function") return () => {
        };
        consentListeners.add(listener);
        if (currentConsent) {
          try {
            listener({ ...currentConsent });
          } catch (error) {
            log("[C5] Lyssnare kastade:", error && error.message);
          }
        }
        return () => consentListeners.delete(listener);
      },
      openSettings: () => openSettings(),
      showPolicy: () => showPolicy()
    };
    const PLACEHOLDER_CLASS = "seos-blockerad";
    const PLACEHOLDER_STYLE_ID = "seos-blockerad-css";
    const placeholderCss = `
.${PLACEHOLDER_CLASS} {
  container-type: inline-size;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75em;
  width: 100%;
  padding: 1.25em;
  text-align: center;
  font-family: inherit;
  color: inherit;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 4px;
}
.${PLACEHOLDER_CLASS} p {
  margin: 0;
  max-width: 40ch;
  font-size: 0.9em;
  line-height: 1.4;
}
.${PLACEHOLDER_CLASS} button {
  font: inherit;
  font-size: 0.9em;
  color: inherit;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 0.5em 1em;
  cursor: pointer;
}
/* Regel 2: innehallet maste tala att krympa. En liten karta i en sidokolumn
   ska inte bli en textvagg - da stannar bara knappen kvar. */
@container (max-width: 260px) {
  .${PLACEHOLDER_CLASS} p { display: none; }
  .${PLACEHOLDER_CLASS} { padding: 0.75em; }
}`;
    function ensurePlaceholderCss() {
      if (document.getElementById(PLACEHOLDER_STYLE_ID)) return;
      const styleEl = document.createElement("style");
      styleEl.id = PLACEHOLDER_STYLE_ID;
      styleEl.textContent = placeholderCss;
      (document.head || document.documentElement).appendChild(styleEl);
    }
    function sizePlaceholder(box, element) {
      const b = parseFloat(element.getAttribute("width"));
      const h = parseFloat(element.getAttribute("height"));
      if (b > 0 && h > 0) {
        box.style.aspectRatio = `${b} / ${h}`;
        return;
      }
      const rect = element.getBoundingClientRect();
      if (rect.height > 0) box.style.minHeight = `${Math.round(rect.height)}px`;
    }
    function categoryLabel(key) {
      const texts = categoryTexts();
      return texts[key] && texts[key].label || key;
    }
    function buildPlaceholder(element, category) {
      ensurePlaceholderCss();
      const box = document.createElement("div");
      box.className = PLACEHOLDER_CLASS;
      box.setAttribute("role", "group");
      const text = document.createElement("p");
      text.textContent = t.blockedBody.replace("{kategori}", categoryLabel(category));
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = t.blockedButton;
      button.addEventListener("click", () => openSettings());
      box.append(text, button);
      sizePlaceholder(box, element);
      return box;
    }
    function warnAboutMarkup() {
      for (const element of document.querySelectorAll("script[data-seos-consent]")) {
        const type = (element.getAttribute("type") || "").toLowerCase();
        if (type !== "text/plain") {
          console.warn(
            '[SEOS] This script has data-seos-consent but type="' + (element.getAttribute("type") || "") + '". It ran immediately and was NOT held back. Add type="text/plain".',
            element
          );
        }
      }
      for (const element of document.querySelectorAll("iframe[data-seos-consent]")) {
        if (element.hasAttribute("data-seos-src")) continue;
        if (element.hasAttribute("src")) {
          console.warn(
            "[SEOS] This iframe has data-seos-consent but its address is still in src, so it loaded immediately. Move the address to data-seos-src.",
            element
          );
        } else {
          console.warn(
            "[SEOS] This iframe has data-seos-consent but no data-seos-src, so there is nothing to load when consent is given.",
            element
          );
        }
      }
      for (const element of document.querySelectorAll("[data-seos-consent]")) {
        const key = element.getAttribute("data-seos-consent");
        if (CATEGORY_KEYS.indexOf(key) === -1) {
          console.warn(
            '[SEOS] Unknown consent category "' + key + '". Known categories: ' + CATEGORY_KEYS.join(", ") + ". This element will never be released.",
            element
          );
        }
      }
    }
    function embedCategory(element) {
      const key = element.getAttribute("data-seos-consent");
      if (CATEGORY_KEYS.indexOf(key) === -1) return null;
      return key;
    }
    function isGranted(category) {
      return category !== null && seosApi.hasConsent(category);
    }
    function releaseScript(oldScript) {
      const newScript = document.createElement("script");
      for (const attr of oldScript.attributes) {
        if (attr.name === "type") continue;
        if (attr.name.indexOf("data-seos-") === 0) continue;
        newScript.setAttribute(attr.name, attr.value);
      }
      if (oldScript.textContent) newScript.textContent = oldScript.textContent;
      oldScript.parentNode.insertBefore(newScript, oldScript);
      oldScript.remove();
    }
    function releaseIframe(element) {
      const url = element.getAttribute("data-seos-src");
      if (!url) return;
      element.setAttribute("src", url);
      element.removeAttribute("data-seos-src");
      element.style.removeProperty("display");
      const box = element.previousElementSibling;
      if (box && box.classList.contains(PLACEHOLDER_CLASS)) box.remove();
    }
    function holdIframe(element) {
      if (element.previousElementSibling && element.previousElementSibling.classList.contains(PLACEHOLDER_CLASS)) {
        return;
      }
      const category = element.getAttribute("data-seos-consent");
      const box = buildPlaceholder(element, category);
      element.parentNode.insertBefore(box, element);
      element.style.display = "none";
    }
    function applyConsentToEmbeds() {
      for (const element of document.querySelectorAll(
        'script[type="text/plain"][data-seos-consent]'
      )) {
        if (isGranted(embedCategory(element))) releaseScript(element);
      }
      for (const element of document.querySelectorAll("iframe[data-seos-consent]")) {
        if (isGranted(embedCategory(element))) {
          releaseIframe(element);
        } else if (element.hasAttribute("data-seos-src")) {
          holdIframe(element);
        }
      }
    }
    function acceptAll() {
      const payload = acceptAllConsent();
      setCookie("consent_status", payload.status, LONG_LIVED_COOKIE_DAYS);
      hideAllBanners();
      applyGoogleConsentFromPayload(payload);
      applyMetaConsentFromPayload(payload);
      triggerGTMConsentEvent();
      setConsent(payload);
      saveConsentAndSend(payload);
    }
    function acceptEssential() {
      const payload = acceptEssentialConsent();
      setCookie("consent_status", payload.status, LONG_LIVED_COOKIE_DAYS);
      hideAllBanners();
      applyGoogleConsentFromPayload(payload);
      applyMetaConsentFromPayload(payload);
      setConsent(payload);
      saveConsentAndSend(payload);
    }
    async function openSettings() {
      await ensureConfig();
      applyDesign();
      let choices = { analytics: false, marketing: false, functional: false };
      const status = getCookie("consent_status");
      const choicesJson = getCookie("consent_choices");
      if (status === "all") {
        choices = { analytics: true, marketing: true, functional: true };
      } else if (status === "necessary_only") {
        choices = { analytics: false, marketing: false, functional: false };
      } else if (choicesJson) {
        try {
          choices = JSON.parse(choicesJson);
        } catch (e) {
          console.error("Error parsing consent_choices cookie:", e);
        }
      }
      const applyToggleState = (id, isActive) => {
        const element = el(id);
        if (element) {
          element.classList.toggle("active", isActive);
          element.setAttribute("aria-checked", isActive ? "true" : "false");
        }
      };
      for (const category of toggleCategories()) {
        if (category.is_required) continue;
        applyToggleState(`${category.key}-toggle`, choices[category.key] === true);
      }
      showSettingsModal();
      setTimeout(() => {
        checkScrollStatus();
      }, 10);
    }
    function checkScrollStatus() {
      const scrollArea = el("scroll-area");
      const bottomShadow = el("bottom-shadow");
      if (scrollArea && bottomShadow) {
        const hasScroll = scrollArea.scrollHeight > scrollArea.clientHeight;
        bottomShadow.style.opacity = hasScroll ? "1" : "0";
        scrollArea.onscroll = () => {
          const scrollBottom = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;
          if (scrollBottom < 15) {
            bottomShadow.style.opacity = "0";
          } else {
            bottomShadow.style.opacity = "1";
          }
        };
      }
    }
    function saveSettings() {
      const clientId = getOrCreateClientId();
      const choice = { analytics: false, marketing: false, functional: false };
      for (const category of toggleCategories()) {
        if (category.is_required) continue;
        choice[category.key] = el(`${category.key}-toggle`)?.classList.contains("active") || false;
      }
      const analytics = choice.analytics;
      const marketing = choice.marketing;
      const functional = choice.functional;
      const payload = {
        necessary: true,
        analytics,
        marketing,
        functional,
        client_id: clientId,
        site_key: SITE_KEY,
        domain: window.location.hostname,
        status: "custom",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        userAgent: navigator.userAgent
      };
      const choices = { analytics, marketing, functional };
      setCookie("consent_choices", JSON.stringify(choices), LONG_LIVED_COOKIE_DAYS);
      setCookie("consent_status", "custom", LONG_LIVED_COOKIE_DAYS);
      applyGoogleConsentFromPayload(payload);
      applyMetaConsentFromPayload(payload);
      if (analytics) {
        triggerGTMConsentEvent();
      }
      setConsent(payload);
      saveConsentAndSend(payload);
      hideAllBanners();
      log("[Settings] Custom choices saved:", choices);
    }
    function backToBanner() {
      showCookieBanner();
      restoreFocus();
    }
    function closePolicy() {
      if (getCookie("consent_status")) {
        hideAllBanners();
      } else {
        showCookieBanner();
      }
      restoreFocus();
    }
    function toggleCookie(element) {
      if (!element) return;
      const isOn = element.classList.toggle("active");
      element.setAttribute("aria-checked", isOn ? "true" : "false");
    }
    async function showPolicy() {
      await ensureConfig();
      applyDesign();
      const domain = window.location.hostname;
      const policyUrl = `${API_BASE_URL}/consent/policy/latest?domain=${domain}`;
      showPolicyModal();
      const contentArea = el("policy-content-area");
      const titleArea = el("policy-version-title");
      contentArea.innerHTML = `<p>${t.policyLoading}</p>`;
      try {
        const response = await fetch(policyUrl);
        if (response.ok) {
          const data = await response.json();
          contentArea.innerHTML = import_purify_min.default.sanitize(data.content, {
            ADD_ATTR: ["target", "rel"]
          });
        } else {
          titleArea.innerText = t.policyErrorTitle;
          contentArea.innerHTML = `<p>${t.policyErrorBody}</p>`;
        }
      } catch (error) {
        console.error("[Policy] Failed to fetch:", error);
        titleArea.innerText = t.policyNetworkTitle;
        contentArea.innerHTML = `<p>${t.policyNetworkBody}</p>`;
      }
    }
    function loadAndApplySavedConsent() {
      const consentStatus = getCookie("consent_status");
      if (!consentStatus) {
        log("[Init] No saved consent");
        return;
      }
      log("[Init] Found saved consent:", consentStatus);
      let payload;
      if (consentStatus === "all") {
        payload = {
          necessary: true,
          analytics: true,
          marketing: true,
          functional: true,
          status: "all"
        };
      } else if (consentStatus === "necessary_only") {
        payload = {
          necessary: true,
          analytics: false,
          marketing: false,
          functional: false,
          status: "necessary_only"
        };
      } else if (consentStatus === "custom") {
        const choicesJson = getCookie("consent_choices");
        if (choicesJson) {
          const choices = JSON.parse(choicesJson);
          payload = {
            necessary: true,
            analytics: choices.analytics || false,
            marketing: choices.marketing || false,
            functional: choices.functional || false,
            status: "custom"
          };
        }
      }
      if (payload) {
        applyGoogleConsentFromPayload(payload);
        applyMetaConsentFromPayload(payload);
        if (payload.analytics === true) {
          triggerGTMConsentEvent();
        }
        setConsent(payload);
      }
    }
    function initializeBanner() {
      injectBannerHTML();
      warnAboutMarkup();
      if (!currentConsent) applyConsentToEmbeds();
      applyDesign();
      const webflowLink = document.getElementById("open-cookie-settings");
      if (webflowLink) {
        webflowLink.addEventListener("click", (e) => {
          e.preventDefault();
          openSettings();
        });
      }
      setTimeout(async () => {
        getOrCreateClientId();
        loadAndApplySavedConsent();
        flushQueue();
        const consentStatus = getCookie("consent_status");
        if (consentStatus) {
          hideAllBanners();
          log("[Init] Consent found - banner hidden");
          return;
        }
        await ensureConfig();
        applyDesign();
        showCookieBanner();
        log("[Init] No consent - showing banner");
      }, 50);
    }
    window.acceptAll = acceptAll;
    window.acceptEssential = acceptEssential;
    window.openSettings = openSettings;
    window.saveSettings = saveSettings;
    window.backToBanner = backToBanner;
    window.toggleCookie = toggleCookie;
    window.showPolicy = showPolicy;
    window.closePolicy = closePolicy;
    window.SEOS = seosApi;
    if (META_PIXEL_ID) ensureFbqStub();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeBanner);
    } else {
      initializeBanner();
    }
  })();
})();
