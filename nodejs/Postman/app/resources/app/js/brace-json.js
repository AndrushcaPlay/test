webpackJsonp([9],{

/***/ 3462:
/***/ (function(module, exports, __webpack_require__) {

ace.define("ace/mode/json_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(acequire, exports, module) {
"use strict";

var oop = acequire("../lib/oop");
var TextHighlightRules = acequire("./text_highlight_rules").TextHighlightRules;

var JsonHighlightRules = function() {
    this.$rules = {
        "start" : [
            {
                token : "variable", // single line
                regex : '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]\\s*(?=:)'
            }, {
                token : "string", // single line
                regex : '"',
                next  : "string"
            }, {
                token : "constant.numeric", // hex
                regex : "0[xX][0-9a-fA-F]+\\b"
            }, {
                token : "constant.numeric", // float
                regex : "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
            }, {
                token : "constant.language.boolean",
                regex : "(?:true|false)\\b"
            }, {
                token : "invalid.illegal", // single quoted strings are not allowed
                regex : "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
            }, {
                token : "invalid.illegal", // comments are not allowed
                regex : "\\/\\/.*$"
            }, {
                token : "paren.lparen",
                regex : "[[({]"
            }, {
                token : "paren.rparen",
                regex : "[\\])}]"
            }, {
                token : "text",
                regex : "\\s+"
            }
        ],
        "string" : [
            {
                token : "constant.language.escape",
                regex : /\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|["\\\/bfnrt])/
            }, {
                token : "string",
                regex : '[^"\\\\]+'
            }, {
                token : "string",
                regex : '"',
                next  : "start"
            }, {
                token : "string",
                regex : "",
                next  : "start"
            }
        ]
    };
    
};

oop.inherits(JsonHighlightRules, TextHighlightRules);

exports.JsonHighlightRules = JsonHighlightRules;
});

ace.define("ace/mode/matching_brace_outdent",["require","exports","module","ace/range"], function(acequire, exports, module) {
"use strict";

var Range = acequire("../range").Range;

var MatchingBraceOutdent = function() {};

(function() {

    this.checkOutdent = function(line, input) {
        if (! /^\s+$/.test(line))
            return false;

        return /^\s*\}/.test(input);
    };

    this.autoOutdent = function(doc, row) {
        var line = doc.getLine(row);
        var match = line.match(/^(\s*\})/);

        if (!match) return 0;

        var column = match[1].length;
        var openBracePos = doc.findMatchingBracket({row: row, column: column});

        if (!openBracePos || openBracePos.row == row) return 0;

        var indent = this.$getIndent(doc.getLine(openBracePos.row));
        doc.replace(new Range(row, 0, row, column-1), indent);
    };

    this.$getIndent = function(line) {
        return line.match(/^\s*/)[0];
    };

}).call(MatchingBraceOutdent.prototype);

exports.MatchingBraceOutdent = MatchingBraceOutdent;
});

ace.define("ace/mode/folding/cstyle",["require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"], function(acequire, exports, module) {
"use strict";

var oop = acequire("../../lib/oop");
var Range = acequire("../../range").Range;
var BaseFoldMode = acequire("./fold_mode").FoldMode;

var FoldMode = exports.FoldMode = function(commentRegex) {
    if (commentRegex) {
        this.foldingStartMarker = new RegExp(
            this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.start)
        );
        this.foldingStopMarker = new RegExp(
            this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.end)
        );
    }
};
oop.inherits(FoldMode, BaseFoldMode);

(function() {
    
    this.foldingStartMarker = /(\{|\[)[^\}\]]*$|^\s*(\/\*)/;
    this.foldingStopMarker = /^[^\[\{]*(\}|\])|^[\s\*]*(\*\/)/;
    this.singleLineBlockCommentRe= /^\s*(\/\*).*\*\/\s*$/;
    this.tripleStarBlockCommentRe = /^\s*(\/\*\*\*).*\*\/\s*$/;
    this.startRegionRe = /^\s*(\/\*|\/\/)#?region\b/;
    this._getFoldWidgetBase = this.getFoldWidget;
    this.getFoldWidget = function(session, foldStyle, row) {
        var line = session.getLine(row);
    
        if (this.singleLineBlockCommentRe.test(line)) {
            if (!this.startRegionRe.test(line) && !this.tripleStarBlockCommentRe.test(line))
                return "";
        }
    
        var fw = this._getFoldWidgetBase(session, foldStyle, row);
    
        if (!fw && this.startRegionRe.test(line))
            return "start"; // lineCommentRegionStart
    
        return fw;
    };

    this.getFoldWidgetRange = function(session, foldStyle, row, forceMultiline) {
        var line = session.getLine(row);
        
        if (this.startRegionRe.test(line))
            return this.getCommentRegionBlock(session, line, row);
        
        var match = line.match(this.foldingStartMarker);
        if (match) {
            var i = match.index;

            if (match[1])
                return this.openingBracketBlock(session, match[1], row, i);
                
            var range = session.getCommentFoldRange(row, i + match[0].length, 1);
            
            if (range && !range.isMultiLine()) {
                if (forceMultiline) {
                    range = this.getSectionRange(session, row);
                } else if (foldStyle != "all")
                    range = null;
            }
            
            return range;
        }

        if (foldStyle === "markbegin")
            return;

        var match = line.match(this.foldingStopMarker);
        if (match) {
            var i = match.index + match[0].length;

            if (match[1])
                return this.closingBracketBlock(session, match[1], row, i);

            return session.getCommentFoldRange(row, i, -1);
        }
    };
    
    this.getSectionRange = function(session, row) {
        var line = session.getLine(row);
        var startIndent = line.search(/\S/);
        var startRow = row;
        var startColumn = line.length;
        row = row + 1;
        var endRow = row;
        var maxRow = session.getLength();
        while (++row < maxRow) {
            line = session.getLine(row);
            var indent = line.search(/\S/);
            if (indent === -1)
                continue;
            if  (startIndent > indent)
                break;
            var subRange = this.getFoldWidgetRange(session, "all", row);
            
            if (subRange) {
                if (subRange.start.row <= startRow) {
                    break;
                } else if (subRange.isMultiLine()) {
                    row = subRange.end.row;
                } else if (startIndent == indent) {
                    break;
                }
            }
            endRow = row;
        }
        
        return new Range(startRow, startColumn, endRow, session.getLine(endRow).length);
    };
    this.getCommentRegionBlock = function(session, line, row) {
        var startColumn = line.search(/\s*$/);
        var maxRow = session.getLength();
        var startRow = row;
        
        var re = /^\s*(?:\/\*|\/\/|--)#?(end)?region\b/;
        var depth = 1;
        while (++row < maxRow) {
            line = session.getLine(row);
            var m = re.exec(line);
            if (!m) continue;
            if (m[1]) depth--;
            else depth++;

            if (!depth) break;
        }

        var endRow = row;
        if (endRow > startRow) {
            return new Range(startRow, startColumn, endRow, line.length);
        }
    };

}).call(FoldMode.prototype);

});

ace.define("ace/mode/json",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/json_highlight_rules","ace/mode/matching_brace_outdent","ace/mode/behaviour/cstyle","ace/mode/folding/cstyle","ace/worker/worker_client"], function(acequire, exports, module) {
"use strict";

var oop = acequire("../lib/oop");
var TextMode = acequire("./text").Mode;
var HighlightRules = acequire("./json_highlight_rules").JsonHighlightRules;
var MatchingBraceOutdent = acequire("./matching_brace_outdent").MatchingBraceOutdent;
var CstyleBehaviour = acequire("./behaviour/cstyle").CstyleBehaviour;
var CStyleFoldMode = acequire("./folding/cstyle").FoldMode;
var WorkerClient = acequire("../worker/worker_client").WorkerClient;

var Mode = function() {
    this.HighlightRules = HighlightRules;
    this.$outdent = new MatchingBraceOutdent();
    this.$behaviour = new CstyleBehaviour();
    this.foldingRules = new CStyleFoldMode();
};
oop.inherits(Mode, TextMode);

(function() {

    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);

        if (state == "start") {
            var match = line.match(/^.*[\{\(\[]\s*$/);
            if (match) {
                indent += tab;
            }
        }

        return indent;
    };

    this.checkOutdent = function(state, line, input) {
        return this.$outdent.checkOutdent(line, input);
    };

    this.autoOutdent = function(state, doc, row) {
        this.$outdent.autoOutdent(doc, row);
    };

    this.createWorker = function(session) {
        var worker = new WorkerClient(["ace"], __webpack_require__(4273), "JsonWorker");
        worker.attachToDocument(session.getDocument());

        worker.on("annotate", function(e) {
            session.setAnnotations(e.data);
        });

        worker.on("terminate", function() {
            session.clearAnnotations();
        });

        return worker;
    };


    this.$id = "ace/mode/json";
}).call(Mode.prototype);

exports.Mode = Mode;
});


/***/ }),

/***/ 4273:
/***/ (function(module, exports) {

module.exports.id = 'ace/mode/json_worker';
module.exports.src = "\"no use strict\";(function(window){function resolveModuleId(id,paths){for(var testPath=id,tail=\"\";testPath;){var alias=paths[testPath];if(\"string\"==typeof alias)return alias+tail;if(alias)return alias.location.replace(/\\/*$/,\"/\")+(tail||alias.main||alias.name);if(alias===!1)return\"\";var i=testPath.lastIndexOf(\"/\");if(-1===i)break;tail=testPath.substr(i)+tail,testPath=testPath.slice(0,i)}return id}if(!(void 0!==window.window&&window.document||window.acequire&&window.define)){window.console||(window.console=function(){var msgs=Array.prototype.slice.call(arguments,0);postMessage({type:\"log\",data:msgs})},window.console.error=window.console.warn=window.console.log=window.console.trace=window.console),window.window=window,window.ace=window,window.onerror=function(message,file,line,col,err){postMessage({type:\"error\",data:{message:message,data:err.data,file:file,line:line,col:col,stack:err.stack}})},window.normalizeModule=function(parentId,moduleName){if(-1!==moduleName.indexOf(\"!\")){var chunks=moduleName.split(\"!\");return window.normalizeModule(parentId,chunks[0])+\"!\"+window.normalizeModule(parentId,chunks[1])}if(\".\"==moduleName.charAt(0)){var base=parentId.split(\"/\").slice(0,-1).join(\"/\");for(moduleName=(base?base+\"/\":\"\")+moduleName;-1!==moduleName.indexOf(\".\")&&previous!=moduleName;){var previous=moduleName;moduleName=moduleName.replace(/^\\.\\//,\"\").replace(/\\/\\.\\//,\"/\").replace(/[^\\/]+\\/\\.\\.\\//,\"\")}}return moduleName},window.acequire=function acequire(parentId,id){if(id||(id=parentId,parentId=null),!id.charAt)throw Error(\"worker.js acequire() accepts only (parentId, id) as arguments\");id=window.normalizeModule(parentId,id);var module=window.acequire.modules[id];if(module)return module.initialized||(module.initialized=!0,module.exports=module.factory().exports),module.exports;if(!window.acequire.tlns)return console.log(\"unable to load \"+id);var path=resolveModuleId(id,window.acequire.tlns);return\".js\"!=path.slice(-3)&&(path+=\".js\"),window.acequire.id=id,window.acequire.modules[id]={},importScripts(path),window.acequire(parentId,id)},window.acequire.modules={},window.acequire.tlns={},window.define=function(id,deps,factory){if(2==arguments.length?(factory=deps,\"string\"!=typeof id&&(deps=id,id=window.acequire.id)):1==arguments.length&&(factory=id,deps=[],id=window.acequire.id),\"function\"!=typeof factory)return window.acequire.modules[id]={exports:factory,initialized:!0},void 0;deps.length||(deps=[\"require\",\"exports\",\"module\"]);var req=function(childId){return window.acequire(id,childId)};window.acequire.modules[id]={exports:{},factory:function(){var module=this,returnExports=factory.apply(this,deps.map(function(dep){switch(dep){case\"require\":return req;case\"exports\":return module.exports;case\"module\":return module;default:return req(dep)}}));return returnExports&&(module.exports=returnExports),module}}},window.define.amd={},acequire.tlns={},window.initBaseUrls=function(topLevelNamespaces){for(var i in topLevelNamespaces)acequire.tlns[i]=topLevelNamespaces[i]},window.initSender=function(){var EventEmitter=window.acequire(\"ace/lib/event_emitter\").EventEmitter,oop=window.acequire(\"ace/lib/oop\"),Sender=function(){};return function(){oop.implement(this,EventEmitter),this.callback=function(data,callbackId){postMessage({type:\"call\",id:callbackId,data:data})},this.emit=function(name,data){postMessage({type:\"event\",name:name,data:data})}}.call(Sender.prototype),new Sender};var main=window.main=null,sender=window.sender=null;window.onmessage=function(e){var msg=e.data;if(msg.event&&sender)sender._signal(msg.event,msg.data);else if(msg.command)if(main[msg.command])main[msg.command].apply(main,msg.args);else{if(!window[msg.command])throw Error(\"Unknown command:\"+msg.command);window[msg.command].apply(window,msg.args)}else if(msg.init){window.initBaseUrls(msg.tlns),acequire(\"ace/lib/es5-shim\"),sender=window.sender=window.initSender();var clazz=acequire(msg.module)[msg.classname];main=window.main=new clazz(sender)}}}})(this),ace.define(\"ace/lib/oop\",[\"require\",\"exports\",\"module\"],function(acequire,exports){\"use strict\";exports.inherits=function(ctor,superCtor){ctor.super_=superCtor,ctor.prototype=Object.create(superCtor.prototype,{constructor:{value:ctor,enumerable:!1,writable:!0,configurable:!0}})},exports.mixin=function(obj,mixin){for(var key in mixin)obj[key]=mixin[key];return obj},exports.implement=function(proto,mixin){exports.mixin(proto,mixin)}}),ace.define(\"ace/range\",[\"require\",\"exports\",\"module\"],function(acequire,exports){\"use strict\";var comparePoints=function(p1,p2){return p1.row-p2.row||p1.column-p2.column},Range=function(startRow,startColumn,endRow,endColumn){this.start={row:startRow,column:startColumn},this.end={row:endRow,column:endColumn}};(function(){this.isEqual=function(range){return this.start.row===range.start.row&&this.end.row===range.end.row&&this.start.column===range.start.column&&this.end.column===range.end.column},this.toString=function(){return\"Range: [\"+this.start.row+\"/\"+this.start.column+\"] -> [\"+this.end.row+\"/\"+this.end.column+\"]\"},this.contains=function(row,column){return 0==this.compare(row,column)},this.compareRange=function(range){var cmp,end=range.end,start=range.start;return cmp=this.compare(end.row,end.column),1==cmp?(cmp=this.compare(start.row,start.column),1==cmp?2:0==cmp?1:0):-1==cmp?-2:(cmp=this.compare(start.row,start.column),-1==cmp?-1:1==cmp?42:0)},this.comparePoint=function(p){return this.compare(p.row,p.column)},this.containsRange=function(range){return 0==this.comparePoint(range.start)&&0==this.comparePoint(range.end)},this.intersects=function(range){var cmp=this.compareRange(range);return-1==cmp||0==cmp||1==cmp},this.isEnd=function(row,column){return this.end.row==row&&this.end.column==column},this.isStart=function(row,column){return this.start.row==row&&this.start.column==column},this.setStart=function(row,column){\"object\"==typeof row?(this.start.column=row.column,this.start.row=row.row):(this.start.row=row,this.start.column=column)},this.setEnd=function(row,column){\"object\"==typeof row?(this.end.column=row.column,this.end.row=row.row):(this.end.row=row,this.end.column=column)},this.inside=function(row,column){return 0==this.compare(row,column)?this.isEnd(row,column)||this.isStart(row,column)?!1:!0:!1},this.insideStart=function(row,column){return 0==this.compare(row,column)?this.isEnd(row,column)?!1:!0:!1},this.insideEnd=function(row,column){return 0==this.compare(row,column)?this.isStart(row,column)?!1:!0:!1},this.compare=function(row,column){return this.isMultiLine()||row!==this.start.row?this.start.row>row?-1:row>this.end.row?1:this.start.row===row?column>=this.start.column?0:-1:this.end.row===row?this.end.column>=column?0:1:0:this.start.column>column?-1:column>this.end.column?1:0},this.compareStart=function(row,column){return this.start.row==row&&this.start.column==column?-1:this.compare(row,column)},this.compareEnd=function(row,column){return this.end.row==row&&this.end.column==column?1:this.compare(row,column)},this.compareInside=function(row,column){return this.end.row==row&&this.end.column==column?1:this.start.row==row&&this.start.column==column?-1:this.compare(row,column)},this.clipRows=function(firstRow,lastRow){if(this.end.row>lastRow)var end={row:lastRow+1,column:0};else if(firstRow>this.end.row)var end={row:firstRow,column:0};if(this.start.row>lastRow)var start={row:lastRow+1,column:0};else if(firstRow>this.start.row)var start={row:firstRow,column:0};return Range.fromPoints(start||this.start,end||this.end)},this.extend=function(row,column){var cmp=this.compare(row,column);if(0==cmp)return this;if(-1==cmp)var start={row:row,column:column};else var end={row:row,column:column};return Range.fromPoints(start||this.start,end||this.end)},this.isEmpty=function(){return this.start.row===this.end.row&&this.start.column===this.end.column},this.isMultiLine=function(){return this.start.row!==this.end.row},this.clone=function(){return Range.fromPoints(this.start,this.end)},this.collapseRows=function(){return 0==this.end.column?new Range(this.start.row,0,Math.max(this.start.row,this.end.row-1),0):new Range(this.start.row,0,this.end.row,0)},this.toScreenRange=function(session){var screenPosStart=session.documentToScreenPosition(this.start),screenPosEnd=session.documentToScreenPosition(this.end);return new Range(screenPosStart.row,screenPosStart.column,screenPosEnd.row,screenPosEnd.column)},this.moveBy=function(row,column){this.start.row+=row,this.start.column+=column,this.end.row+=row,this.end.column+=column}}).call(Range.prototype),Range.fromPoints=function(start,end){return new Range(start.row,start.column,end.row,end.column)},Range.comparePoints=comparePoints,Range.comparePoints=function(p1,p2){return p1.row-p2.row||p1.column-p2.column},exports.Range=Range}),ace.define(\"ace/apply_delta\",[\"require\",\"exports\",\"module\"],function(acequire,exports){\"use strict\";exports.applyDelta=function(docLines,delta){var row=delta.start.row,startColumn=delta.start.column,line=docLines[row]||\"\";switch(delta.action){case\"insert\":var lines=delta.lines;if(1===lines.length)docLines[row]=line.substring(0,startColumn)+delta.lines[0]+line.substring(startColumn);else{var args=[row,1].concat(delta.lines);docLines.splice.apply(docLines,args),docLines[row]=line.substring(0,startColumn)+docLines[row],docLines[row+delta.lines.length-1]+=line.substring(startColumn)}break;case\"remove\":var endColumn=delta.end.column,endRow=delta.end.row;row===endRow?docLines[row]=line.substring(0,startColumn)+line.substring(endColumn):docLines.splice(row,endRow-row+1,line.substring(0,startColumn)+docLines[endRow].substring(endColumn))}}}),ace.define(\"ace/lib/event_emitter\",[\"require\",\"exports\",\"module\"],function(acequire,exports){\"use strict\";var EventEmitter={},stopPropagation=function(){this.propagationStopped=!0},preventDefault=function(){this.defaultPrevented=!0};EventEmitter._emit=EventEmitter._dispatchEvent=function(eventName,e){this._eventRegistry||(this._eventRegistry={}),this._defaultHandlers||(this._defaultHandlers={});var listeners=this._eventRegistry[eventName]||[],defaultHandler=this._defaultHandlers[eventName];if(listeners.length||defaultHandler){\"object\"==typeof e&&e||(e={}),e.type||(e.type=eventName),e.stopPropagation||(e.stopPropagation=stopPropagation),e.preventDefault||(e.preventDefault=preventDefault),listeners=listeners.slice();for(var i=0;listeners.length>i&&(listeners[i](e,this),!e.propagationStopped);i++);return defaultHandler&&!e.defaultPrevented?defaultHandler(e,this):void 0}},EventEmitter._signal=function(eventName,e){var listeners=(this._eventRegistry||{})[eventName];if(listeners){listeners=listeners.slice();for(var i=0;listeners.length>i;i++)listeners[i](e,this)}},EventEmitter.once=function(eventName,callback){var _self=this;callback&&this.addEventListener(eventName,function newCallback(){_self.removeEventListener(eventName,newCallback),callback.apply(null,arguments)})},EventEmitter.setDefaultHandler=function(eventName,callback){var handlers=this._defaultHandlers;if(handlers||(handlers=this._defaultHandlers={_disabled_:{}}),handlers[eventName]){var old=handlers[eventName],disabled=handlers._disabled_[eventName];disabled||(handlers._disabled_[eventName]=disabled=[]),disabled.push(old);var i=disabled.indexOf(callback);-1!=i&&disabled.splice(i,1)}handlers[eventName]=callback},EventEmitter.removeDefaultHandler=function(eventName,callback){var handlers=this._defaultHandlers;if(handlers){var disabled=handlers._disabled_[eventName];if(handlers[eventName]==callback)handlers[eventName],disabled&&this.setDefaultHandler(eventName,disabled.pop());else if(disabled){var i=disabled.indexOf(callback);-1!=i&&disabled.splice(i,1)}}},EventEmitter.on=EventEmitter.addEventListener=function(eventName,callback,capturing){this._eventRegistry=this._eventRegistry||{};var listeners=this._eventRegistry[eventName];return listeners||(listeners=this._eventRegistry[eventName]=[]),-1==listeners.indexOf(callback)&&listeners[capturing?\"unshift\":\"push\"](callback),callback},EventEmitter.off=EventEmitter.removeListener=EventEmitter.removeEventListener=function(eventName,callback){this._eventRegistry=this._eventRegistry||{};var listeners=this._eventRegistry[eventName];if(listeners){var index=listeners.indexOf(callback);-1!==index&&listeners.splice(index,1)}},EventEmitter.removeAllListeners=function(eventName){this._eventRegistry&&(this._eventRegistry[eventName]=[])},exports.EventEmitter=EventEmitter}),ace.define(\"ace/anchor\",[\"require\",\"exports\",\"module\",\"ace/lib/oop\",\"ace/lib/event_emitter\"],function(acequire,exports){\"use strict\";var oop=acequire(\"./lib/oop\"),EventEmitter=acequire(\"./lib/event_emitter\").EventEmitter,Anchor=exports.Anchor=function(doc,row,column){this.$onChange=this.onChange.bind(this),this.attach(doc),column===void 0?this.setPosition(row.row,row.column):this.setPosition(row,column)};(function(){function $pointsInOrder(point1,point2,equalPointsInOrder){var bColIsAfter=equalPointsInOrder?point1.column<=point2.column:point1.column<point2.column;return point1.row<point2.row||point1.row==point2.row&&bColIsAfter}function $getTransformedPoint(delta,point,moveIfEqual){var deltaIsInsert=\"insert\"==delta.action,deltaRowShift=(deltaIsInsert?1:-1)*(delta.end.row-delta.start.row),deltaColShift=(deltaIsInsert?1:-1)*(delta.end.column-delta.start.column),deltaStart=delta.start,deltaEnd=deltaIsInsert?deltaStart:delta.end;return $pointsInOrder(point,deltaStart,moveIfEqual)?{row:point.row,column:point.column}:$pointsInOrder(deltaEnd,point,!moveIfEqual)?{row:point.row+deltaRowShift,column:point.column+(point.row==deltaEnd.row?deltaColShift:0)}:{row:deltaStart.row,column:deltaStart.column}}oop.implement(this,EventEmitter),this.getPosition=function(){return this.$clipPositionToDocument(this.row,this.column)},this.getDocument=function(){return this.document},this.$insertRight=!1,this.onChange=function(delta){if(!(delta.start.row==delta.end.row&&delta.start.row!=this.row||delta.start.row>this.row)){var point=$getTransformedPoint(delta,{row:this.row,column:this.column},this.$insertRight);this.setPosition(point.row,point.column,!0)}},this.setPosition=function(row,column,noClip){var pos;if(pos=noClip?{row:row,column:column}:this.$clipPositionToDocument(row,column),this.row!=pos.row||this.column!=pos.column){var old={row:this.row,column:this.column};this.row=pos.row,this.column=pos.column,this._signal(\"change\",{old:old,value:pos})}},this.detach=function(){this.document.removeEventListener(\"change\",this.$onChange)},this.attach=function(doc){this.document=doc||this.document,this.document.on(\"change\",this.$onChange)},this.$clipPositionToDocument=function(row,column){var pos={};return row>=this.document.getLength()?(pos.row=Math.max(0,this.document.getLength()-1),pos.column=this.document.getLine(pos.row).length):0>row?(pos.row=0,pos.column=0):(pos.row=row,pos.column=Math.min(this.document.getLine(pos.row).length,Math.max(0,column))),0>column&&(pos.column=0),pos}}).call(Anchor.prototype)}),ace.define(\"ace/document\",[\"require\",\"exports\",\"module\",\"ace/lib/oop\",\"ace/apply_delta\",\"ace/lib/event_emitter\",\"ace/range\",\"ace/anchor\"],function(acequire,exports){\"use strict\";var oop=acequire(\"./lib/oop\"),applyDelta=acequire(\"./apply_delta\").applyDelta,EventEmitter=acequire(\"./lib/event_emitter\").EventEmitter,Range=acequire(\"./range\").Range,Anchor=acequire(\"./anchor\").Anchor,Document=function(textOrLines){this.$lines=[\"\"],0===textOrLines.length?this.$lines=[\"\"]:Array.isArray(textOrLines)?this.insertMergedLines({row:0,column:0},textOrLines):this.insert({row:0,column:0},textOrLines)};(function(){oop.implement(this,EventEmitter),this.setValue=function(text){var len=this.getLength()-1;this.remove(new Range(0,0,len,this.getLine(len).length)),this.insert({row:0,column:0},text)},this.getValue=function(){return this.getAllLines().join(this.getNewLineCharacter())},this.createAnchor=function(row,column){return new Anchor(this,row,column)},this.$split=0===\"aaa\".split(/a/).length?function(text){return text.replace(/\\r\\n|\\r/g,\"\\n\").split(\"\\n\")}:function(text){return text.split(/\\r\\n|\\r|\\n/)},this.$detectNewLine=function(text){var match=text.match(/^.*?(\\r\\n|\\r|\\n)/m);this.$autoNewLine=match?match[1]:\"\\n\",this._signal(\"changeNewLineMode\")},this.getNewLineCharacter=function(){switch(this.$newLineMode){case\"windows\":return\"\\r\\n\";case\"unix\":return\"\\n\";default:return this.$autoNewLine||\"\\n\"}},this.$autoNewLine=\"\",this.$newLineMode=\"auto\",this.setNewLineMode=function(newLineMode){this.$newLineMode!==newLineMode&&(this.$newLineMode=newLineMode,this._signal(\"changeNewLineMode\"))},this.getNewLineMode=function(){return this.$newLineMode},this.isNewLine=function(text){return\"\\r\\n\"==text||\"\\r\"==text||\"\\n\"==text},this.getLine=function(row){return this.$lines[row]||\"\"},this.getLines=function(firstRow,lastRow){return this.$lines.slice(firstRow,lastRow+1)},this.getAllLines=function(){return this.getLines(0,this.getLength())},this.getLength=function(){return this.$lines.length},this.getTextRange=function(range){return this.getLinesForRange(range).join(this.getNewLineCharacter())},this.getLinesForRange=function(range){var lines;if(range.start.row===range.end.row)lines=[this.getLine(range.start.row).substring(range.start.column,range.end.column)];else{lines=this.getLines(range.start.row,range.end.row),lines[0]=(lines[0]||\"\").substring(range.start.column);var l=lines.length-1;range.end.row-range.start.row==l&&(lines[l]=lines[l].substring(0,range.end.column))}return lines},this.insertLines=function(row,lines){return console.warn(\"Use of document.insertLines is deprecated. Use the insertFullLines method instead.\"),this.insertFullLines(row,lines)},this.removeLines=function(firstRow,lastRow){return console.warn(\"Use of document.removeLines is deprecated. Use the removeFullLines method instead.\"),this.removeFullLines(firstRow,lastRow)},this.insertNewLine=function(position){return console.warn(\"Use of document.insertNewLine is deprecated. Use insertMergedLines(position, ['', '']) instead.\"),this.insertMergedLines(position,[\"\",\"\"])},this.insert=function(position,text){return 1>=this.getLength()&&this.$detectNewLine(text),this.insertMergedLines(position,this.$split(text))},this.insertInLine=function(position,text){var start=this.clippedPos(position.row,position.column),end=this.pos(position.row,position.column+text.length);return this.applyDelta({start:start,end:end,action:\"insert\",lines:[text]},!0),this.clonePos(end)},this.clippedPos=function(row,column){var length=this.getLength();void 0===row?row=length:0>row?row=0:row>=length&&(row=length-1,column=void 0);var line=this.getLine(row);return void 0==column&&(column=line.length),column=Math.min(Math.max(column,0),line.length),{row:row,column:column}},this.clonePos=function(pos){return{row:pos.row,column:pos.column}},this.pos=function(row,column){return{row:row,column:column}},this.$clipPosition=function(position){var length=this.getLength();return position.row>=length?(position.row=Math.max(0,length-1),position.column=this.getLine(length-1).length):(position.row=Math.max(0,position.row),position.column=Math.min(Math.max(position.column,0),this.getLine(position.row).length)),position},this.insertFullLines=function(row,lines){row=Math.min(Math.max(row,0),this.getLength());var column=0;this.getLength()>row?(lines=lines.concat([\"\"]),column=0):(lines=[\"\"].concat(lines),row--,column=this.$lines[row].length),this.insertMergedLines({row:row,column:column},lines)},this.insertMergedLines=function(position,lines){var start=this.clippedPos(position.row,position.column),end={row:start.row+lines.length-1,column:(1==lines.length?start.column:0)+lines[lines.length-1].length};return this.applyDelta({start:start,end:end,action:\"insert\",lines:lines}),this.clonePos(end)},this.remove=function(range){var start=this.clippedPos(range.start.row,range.start.column),end=this.clippedPos(range.end.row,range.end.column);return this.applyDelta({start:start,end:end,action:\"remove\",lines:this.getLinesForRange({start:start,end:end})}),this.clonePos(start)},this.removeInLine=function(row,startColumn,endColumn){var start=this.clippedPos(row,startColumn),end=this.clippedPos(row,endColumn);return this.applyDelta({start:start,end:end,action:\"remove\",lines:this.getLinesForRange({start:start,end:end})},!0),this.clonePos(start)},this.removeFullLines=function(firstRow,lastRow){firstRow=Math.min(Math.max(0,firstRow),this.getLength()-1),lastRow=Math.min(Math.max(0,lastRow),this.getLength()-1);var deleteFirstNewLine=lastRow==this.getLength()-1&&firstRow>0,deleteLastNewLine=this.getLength()-1>lastRow,startRow=deleteFirstNewLine?firstRow-1:firstRow,startCol=deleteFirstNewLine?this.getLine(startRow).length:0,endRow=deleteLastNewLine?lastRow+1:lastRow,endCol=deleteLastNewLine?0:this.getLine(endRow).length,range=new Range(startRow,startCol,endRow,endCol),deletedLines=this.$lines.slice(firstRow,lastRow+1);return this.applyDelta({start:range.start,end:range.end,action:\"remove\",lines:this.getLinesForRange(range)}),deletedLines},this.removeNewLine=function(row){this.getLength()-1>row&&row>=0&&this.applyDelta({start:this.pos(row,this.getLine(row).length),end:this.pos(row+1,0),action:\"remove\",lines:[\"\",\"\"]})},this.replace=function(range,text){if(range instanceof Range||(range=Range.fromPoints(range.start,range.end)),0===text.length&&range.isEmpty())return range.start;if(text==this.getTextRange(range))return range.end;this.remove(range);var end;return end=text?this.insert(range.start,text):range.start},this.applyDeltas=function(deltas){for(var i=0;deltas.length>i;i++)this.applyDelta(deltas[i])},this.revertDeltas=function(deltas){for(var i=deltas.length-1;i>=0;i--)this.revertDelta(deltas[i])},this.applyDelta=function(delta,doNotValidate){var isInsert=\"insert\"==delta.action;(isInsert?1>=delta.lines.length&&!delta.lines[0]:!Range.comparePoints(delta.start,delta.end))||(isInsert&&delta.lines.length>2e4&&this.$splitAndapplyLargeDelta(delta,2e4),applyDelta(this.$lines,delta,doNotValidate),this._signal(\"change\",delta))},this.$splitAndapplyLargeDelta=function(delta,MAX){for(var lines=delta.lines,l=lines.length,row=delta.start.row,column=delta.start.column,from=0,to=0;;){from=to,to+=MAX-1;var chunk=lines.slice(from,to);if(to>l){delta.lines=chunk,delta.start.row=row+from,delta.start.column=column;break}chunk.push(\"\"),this.applyDelta({start:this.pos(row+from,column),end:this.pos(row+to,column=0),action:delta.action,lines:chunk},!0)}},this.revertDelta=function(delta){this.applyDelta({start:this.clonePos(delta.start),end:this.clonePos(delta.end),action:\"insert\"==delta.action?\"remove\":\"insert\",lines:delta.lines.slice()})},this.indexToPosition=function(index,startRow){for(var lines=this.$lines||this.getAllLines(),newlineLength=this.getNewLineCharacter().length,i=startRow||0,l=lines.length;l>i;i++)if(index-=lines[i].length+newlineLength,0>index)return{row:i,column:index+lines[i].length+newlineLength};return{row:l-1,column:lines[l-1].length}},this.positionToIndex=function(pos,startRow){for(var lines=this.$lines||this.getAllLines(),newlineLength=this.getNewLineCharacter().length,index=0,row=Math.min(pos.row,lines.length),i=startRow||0;row>i;++i)index+=lines[i].length+newlineLength;return index+pos.column}}).call(Document.prototype),exports.Document=Document}),ace.define(\"ace/lib/lang\",[\"require\",\"exports\",\"module\"],function(acequire,exports){\"use strict\";exports.last=function(a){return a[a.length-1]},exports.stringReverse=function(string){return string.split(\"\").reverse().join(\"\")},exports.stringRepeat=function(string,count){for(var result=\"\";count>0;)1&count&&(result+=string),(count>>=1)&&(string+=string);return result};var trimBeginRegexp=/^\\s\\s*/,trimEndRegexp=/\\s\\s*$/;exports.stringTrimLeft=function(string){return string.replace(trimBeginRegexp,\"\")},exports.stringTrimRight=function(string){return string.replace(trimEndRegexp,\"\")},exports.copyObject=function(obj){var copy={};for(var key in obj)copy[key]=obj[key];return copy},exports.copyArray=function(array){for(var copy=[],i=0,l=array.length;l>i;i++)copy[i]=array[i]&&\"object\"==typeof array[i]?this.copyObject(array[i]):array[i];return copy},exports.deepCopy=function deepCopy(obj){if(\"object\"!=typeof obj||!obj)return obj;var copy;if(Array.isArray(obj)){copy=[];for(var key=0;obj.length>key;key++)copy[key]=deepCopy(obj[key]);return copy}if(\"[object Object]\"!==Object.prototype.toString.call(obj))return obj;copy={};for(var key in obj)copy[key]=deepCopy(obj[key]);return copy},exports.arrayToMap=function(arr){for(var map={},i=0;arr.length>i;i++)map[arr[i]]=1;return map},exports.createMap=function(props){var map=Object.create(null);for(var i in props)map[i]=props[i];return map},exports.arrayRemove=function(array,value){for(var i=0;array.length>=i;i++)value===array[i]&&array.splice(i,1)},exports.escapeRegExp=function(str){return str.replace(/([.*+?^${}()|[\\]\\/\\\\])/g,\"\\\\$1\")},exports.escapeHTML=function(str){return str.replace(/&/g,\"&#38;\").replace(/\"/g,\"&#34;\").replace(/'/g,\"&#39;\").replace(/</g,\"&#60;\")},exports.getMatchOffsets=function(string,regExp){var matches=[];return string.replace(regExp,function(str){matches.push({offset:arguments[arguments.length-2],length:str.length})}),matches},exports.deferredCall=function(fcn){var timer=null,callback=function(){timer=null,fcn()},deferred=function(timeout){return deferred.cancel(),timer=setTimeout(callback,timeout||0),deferred};return deferred.schedule=deferred,deferred.call=function(){return this.cancel(),fcn(),deferred},deferred.cancel=function(){return clearTimeout(timer),timer=null,deferred},deferred.isPending=function(){return timer},deferred},exports.delayedCall=function(fcn,defaultTimeout){var timer=null,callback=function(){timer=null,fcn()},_self=function(timeout){null==timer&&(timer=setTimeout(callback,timeout||defaultTimeout))};return _self.delay=function(timeout){timer&&clearTimeout(timer),timer=setTimeout(callback,timeout||defaultTimeout)},_self.schedule=_self,_self.call=function(){this.cancel(),fcn()},_self.cancel=function(){timer&&clearTimeout(timer),timer=null},_self.isPending=function(){return timer},_self}}),ace.define(\"ace/worker/mirror\",[\"require\",\"exports\",\"module\",\"ace/range\",\"ace/document\",\"ace/lib/lang\"],function(acequire,exports){\"use strict\";acequire(\"../range\").Range;var Document=acequire(\"../document\").Document,lang=acequire(\"../lib/lang\"),Mirror=exports.Mirror=function(sender){this.sender=sender;var doc=this.doc=new Document(\"\"),deferredUpdate=this.deferredUpdate=lang.delayedCall(this.onUpdate.bind(this)),_self=this;sender.on(\"change\",function(e){var data=e.data;if(data[0].start)doc.applyDeltas(data);else for(var i=0;data.length>i;i+=2){if(Array.isArray(data[i+1]))var d={action:\"insert\",start:data[i],lines:data[i+1]};else var d={action:\"remove\",start:data[i],end:data[i+1]};doc.applyDelta(d,!0)}return _self.$timeout?deferredUpdate.schedule(_self.$timeout):(_self.onUpdate(),void 0)})};(function(){this.$timeout=500,this.setTimeout=function(timeout){this.$timeout=timeout},this.setValue=function(value){this.doc.setValue(value),this.deferredUpdate.schedule(this.$timeout)},this.getValue=function(callbackId){this.sender.callback(this.doc.getValue(),callbackId)},this.onUpdate=function(){},this.isPending=function(){return this.deferredUpdate.isPending()}}).call(Mirror.prototype)}),ace.define(\"ace/mode/json/json_parse\",[\"require\",\"exports\",\"module\"],function(){\"use strict\";var at,ch,text,value,escapee={'\"':'\"',\"\\\\\":\"\\\\\",\"/\":\"/\",b:\"\\b\",f:\"\\f\",n:\"\\n\",r:\"\\r\",t:\"\t\"},error=function(m){throw{name:\"SyntaxError\",message:m,at:at,text:text}},next=function(c){return c&&c!==ch&&error(\"Expected '\"+c+\"' instead of '\"+ch+\"'\"),ch=text.charAt(at),at+=1,ch},number=function(){var number,string=\"\";for(\"-\"===ch&&(string=\"-\",next(\"-\"));ch>=\"0\"&&\"9\">=ch;)string+=ch,next();if(\".\"===ch)for(string+=\".\";next()&&ch>=\"0\"&&\"9\">=ch;)string+=ch;if(\"e\"===ch||\"E\"===ch)for(string+=ch,next(),(\"-\"===ch||\"+\"===ch)&&(string+=ch,next());ch>=\"0\"&&\"9\">=ch;)string+=ch,next();return number=+string,isNaN(number)?(error(\"Bad number\"),void 0):number},string=function(){var hex,i,uffff,string=\"\";if('\"'===ch)for(;next();){if('\"'===ch)return next(),string;if(\"\\\\\"===ch)if(next(),\"u\"===ch){for(uffff=0,i=0;4>i&&(hex=parseInt(next(),16),isFinite(hex));i+=1)uffff=16*uffff+hex;string+=String.fromCharCode(uffff)}else{if(\"string\"!=typeof escapee[ch])break;string+=escapee[ch]}else string+=ch}error(\"Bad string\")},white=function(){for(;ch&&\" \">=ch;)next()},word=function(){switch(ch){case\"t\":return next(\"t\"),next(\"r\"),next(\"u\"),next(\"e\"),!0;case\"f\":return next(\"f\"),next(\"a\"),next(\"l\"),next(\"s\"),next(\"e\"),!1;case\"n\":return next(\"n\"),next(\"u\"),next(\"l\"),next(\"l\"),null}error(\"Unexpected '\"+ch+\"'\")},array=function(){var array=[];if(\"[\"===ch){if(next(\"[\"),white(),\"]\"===ch)return next(\"]\"),array;for(;ch;){if(array.push(value()),white(),\"]\"===ch)return next(\"]\"),array;next(\",\"),white()}}error(\"Bad array\")},object=function(){var key,object={};if(\"{\"===ch){if(next(\"{\"),white(),\"}\"===ch)return next(\"}\"),object;for(;ch;){if(key=string(),white(),next(\":\"),Object.hasOwnProperty.call(object,key)&&error('Duplicate key \"'+key+'\"'),object[key]=value(),white(),\"}\"===ch)return next(\"}\"),object;next(\",\"),white()}}error(\"Bad object\")};return value=function(){switch(white(),ch){case\"{\":return object();case\"[\":return array();case'\"':return string();case\"-\":return number();default:return ch>=\"0\"&&\"9\">=ch?number():word()}},function(source,reviver){var result;return text=source,at=0,ch=\" \",result=value(),white(),ch&&error(\"Syntax error\"),\"function\"==typeof reviver?function walk(holder,key){var k,v,value=holder[key];if(value&&\"object\"==typeof value)for(k in value)Object.hasOwnProperty.call(value,k)&&(v=walk(value,k),void 0!==v?value[k]=v:delete value[k]);return reviver.call(holder,key,value)}({\"\":result},\"\"):result}}),ace.define(\"ace/mode/json_worker\",[\"require\",\"exports\",\"module\",\"ace/lib/oop\",\"ace/worker/mirror\",\"ace/mode/json/json_parse\"],function(acequire,exports){\"use strict\";var oop=acequire(\"../lib/oop\"),Mirror=acequire(\"../worker/mirror\").Mirror,parse=acequire(\"./json/json_parse\"),JsonWorker=exports.JsonWorker=function(sender){Mirror.call(this,sender),this.setTimeout(200)};oop.inherits(JsonWorker,Mirror),function(){this.onUpdate=function(){var value=this.doc.getValue(),errors=[];try{value&&parse(value)}catch(e){var pos=this.doc.indexToPosition(e.at-1);errors.push({row:pos.row,column:pos.column,text:e.message,type:\"error\"})}this.sender.emit(\"annotate\",errors)}}.call(JsonWorker.prototype)}),ace.define(\"ace/lib/es5-shim\",[\"require\",\"exports\",\"module\"],function(){function Empty(){}function doesDefinePropertyWork(object){try{return Object.defineProperty(object,\"sentinel\",{}),\"sentinel\"in object}catch(exception){}}function toInteger(n){return n=+n,n!==n?n=0:0!==n&&n!==1/0&&n!==-(1/0)&&(n=(n>0||-1)*Math.floor(Math.abs(n))),n}Function.prototype.bind||(Function.prototype.bind=function(that){var target=this;if(\"function\"!=typeof target)throw new TypeError(\"Function.prototype.bind called on incompatible \"+target);var args=slice.call(arguments,1),bound=function(){if(this instanceof bound){var result=target.apply(this,args.concat(slice.call(arguments)));return Object(result)===result?result:this}return target.apply(that,args.concat(slice.call(arguments)))};return target.prototype&&(Empty.prototype=target.prototype,bound.prototype=new Empty,Empty.prototype=null),bound});var defineGetter,defineSetter,lookupGetter,lookupSetter,supportsAccessors,call=Function.prototype.call,prototypeOfArray=Array.prototype,prototypeOfObject=Object.prototype,slice=prototypeOfArray.slice,_toString=call.bind(prototypeOfObject.toString),owns=call.bind(prototypeOfObject.hasOwnProperty);if((supportsAccessors=owns(prototypeOfObject,\"__defineGetter__\"))&&(defineGetter=call.bind(prototypeOfObject.__defineGetter__),defineSetter=call.bind(prototypeOfObject.__defineSetter__),lookupGetter=call.bind(prototypeOfObject.__lookupGetter__),lookupSetter=call.bind(prototypeOfObject.__lookupSetter__)),2!=[1,2].splice(0).length)if(function(){function makeArray(l){var a=Array(l+2);return a[0]=a[1]=0,a}var lengthBefore,array=[];return array.splice.apply(array,makeArray(20)),array.splice.apply(array,makeArray(26)),lengthBefore=array.length,array.splice(5,0,\"XXX\"),lengthBefore+1==array.length,lengthBefore+1==array.length?!0:void 0\n}()){var array_splice=Array.prototype.splice;Array.prototype.splice=function(start,deleteCount){return arguments.length?array_splice.apply(this,[void 0===start?0:start,void 0===deleteCount?this.length-start:deleteCount].concat(slice.call(arguments,2))):[]}}else Array.prototype.splice=function(pos,removeCount){var length=this.length;pos>0?pos>length&&(pos=length):void 0==pos?pos=0:0>pos&&(pos=Math.max(length+pos,0)),length>pos+removeCount||(removeCount=length-pos);var removed=this.slice(pos,pos+removeCount),insert=slice.call(arguments,2),add=insert.length;if(pos===length)add&&this.push.apply(this,insert);else{var remove=Math.min(removeCount,length-pos),tailOldPos=pos+remove,tailNewPos=tailOldPos+add-remove,tailCount=length-tailOldPos,lengthAfterRemove=length-remove;if(tailOldPos>tailNewPos)for(var i=0;tailCount>i;++i)this[tailNewPos+i]=this[tailOldPos+i];else if(tailNewPos>tailOldPos)for(i=tailCount;i--;)this[tailNewPos+i]=this[tailOldPos+i];if(add&&pos===lengthAfterRemove)this.length=lengthAfterRemove,this.push.apply(this,insert);else for(this.length=lengthAfterRemove+add,i=0;add>i;++i)this[pos+i]=insert[i]}return removed};Array.isArray||(Array.isArray=function(obj){return\"[object Array]\"==_toString(obj)});var boxedString=Object(\"a\"),splitString=\"a\"!=boxedString[0]||!(0 in boxedString);if(Array.prototype.forEach||(Array.prototype.forEach=function(fun){var object=toObject(this),self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):object,thisp=arguments[1],i=-1,length=self.length>>>0;if(\"[object Function]\"!=_toString(fun))throw new TypeError;for(;length>++i;)i in self&&fun.call(thisp,self[i],i,object)}),Array.prototype.map||(Array.prototype.map=function(fun){var object=toObject(this),self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):object,length=self.length>>>0,result=Array(length),thisp=arguments[1];if(\"[object Function]\"!=_toString(fun))throw new TypeError(fun+\" is not a function\");for(var i=0;length>i;i++)i in self&&(result[i]=fun.call(thisp,self[i],i,object));return result}),Array.prototype.filter||(Array.prototype.filter=function(fun){var value,object=toObject(this),self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):object,length=self.length>>>0,result=[],thisp=arguments[1];if(\"[object Function]\"!=_toString(fun))throw new TypeError(fun+\" is not a function\");for(var i=0;length>i;i++)i in self&&(value=self[i],fun.call(thisp,value,i,object)&&result.push(value));return result}),Array.prototype.every||(Array.prototype.every=function(fun){var object=toObject(this),self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):object,length=self.length>>>0,thisp=arguments[1];if(\"[object Function]\"!=_toString(fun))throw new TypeError(fun+\" is not a function\");for(var i=0;length>i;i++)if(i in self&&!fun.call(thisp,self[i],i,object))return!1;return!0}),Array.prototype.some||(Array.prototype.some=function(fun){var object=toObject(this),self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):object,length=self.length>>>0,thisp=arguments[1];if(\"[object Function]\"!=_toString(fun))throw new TypeError(fun+\" is not a function\");for(var i=0;length>i;i++)if(i in self&&fun.call(thisp,self[i],i,object))return!0;return!1}),Array.prototype.reduce||(Array.prototype.reduce=function(fun){var object=toObject(this),self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):object,length=self.length>>>0;if(\"[object Function]\"!=_toString(fun))throw new TypeError(fun+\" is not a function\");if(!length&&1==arguments.length)throw new TypeError(\"reduce of empty array with no initial value\");var result,i=0;if(arguments.length>=2)result=arguments[1];else for(;;){if(i in self){result=self[i++];break}if(++i>=length)throw new TypeError(\"reduce of empty array with no initial value\")}for(;length>i;i++)i in self&&(result=fun.call(void 0,result,self[i],i,object));return result}),Array.prototype.reduceRight||(Array.prototype.reduceRight=function(fun){var object=toObject(this),self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):object,length=self.length>>>0;if(\"[object Function]\"!=_toString(fun))throw new TypeError(fun+\" is not a function\");if(!length&&1==arguments.length)throw new TypeError(\"reduceRight of empty array with no initial value\");var result,i=length-1;if(arguments.length>=2)result=arguments[1];else for(;;){if(i in self){result=self[i--];break}if(0>--i)throw new TypeError(\"reduceRight of empty array with no initial value\")}do i in this&&(result=fun.call(void 0,result,self[i],i,object));while(i--);return result}),Array.prototype.indexOf&&-1==[0,1].indexOf(1,2)||(Array.prototype.indexOf=function(sought){var self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):toObject(this),length=self.length>>>0;if(!length)return-1;var i=0;for(arguments.length>1&&(i=toInteger(arguments[1])),i=i>=0?i:Math.max(0,length+i);length>i;i++)if(i in self&&self[i]===sought)return i;return-1}),Array.prototype.lastIndexOf&&-1==[0,1].lastIndexOf(0,-3)||(Array.prototype.lastIndexOf=function(sought){var self=splitString&&\"[object String]\"==_toString(this)?this.split(\"\"):toObject(this),length=self.length>>>0;if(!length)return-1;var i=length-1;for(arguments.length>1&&(i=Math.min(i,toInteger(arguments[1]))),i=i>=0?i:length-Math.abs(i);i>=0;i--)if(i in self&&sought===self[i])return i;return-1}),Object.getPrototypeOf||(Object.getPrototypeOf=function(object){return object.__proto__||(object.constructor?object.constructor.prototype:prototypeOfObject)}),!Object.getOwnPropertyDescriptor){var ERR_NON_OBJECT=\"Object.getOwnPropertyDescriptor called on a non-object: \";Object.getOwnPropertyDescriptor=function(object,property){if(\"object\"!=typeof object&&\"function\"!=typeof object||null===object)throw new TypeError(ERR_NON_OBJECT+object);if(owns(object,property)){var descriptor,getter,setter;if(descriptor={enumerable:!0,configurable:!0},supportsAccessors){var prototype=object.__proto__;object.__proto__=prototypeOfObject;var getter=lookupGetter(object,property),setter=lookupSetter(object,property);if(object.__proto__=prototype,getter||setter)return getter&&(descriptor.get=getter),setter&&(descriptor.set=setter),descriptor}return descriptor.value=object[property],descriptor}}}if(Object.getOwnPropertyNames||(Object.getOwnPropertyNames=function(object){return Object.keys(object)}),!Object.create){var createEmpty;createEmpty=null===Object.prototype.__proto__?function(){return{__proto__:null}}:function(){var empty={};for(var i in empty)empty[i]=null;return empty.constructor=empty.hasOwnProperty=empty.propertyIsEnumerable=empty.isPrototypeOf=empty.toLocaleString=empty.toString=empty.valueOf=empty.__proto__=null,empty},Object.create=function(prototype,properties){var object;if(null===prototype)object=createEmpty();else{if(\"object\"!=typeof prototype)throw new TypeError(\"typeof prototype[\"+typeof prototype+\"] != 'object'\");var Type=function(){};Type.prototype=prototype,object=new Type,object.__proto__=prototype}return void 0!==properties&&Object.defineProperties(object,properties),object}}if(Object.defineProperty){var definePropertyWorksOnObject=doesDefinePropertyWork({}),definePropertyWorksOnDom=\"undefined\"==typeof document||doesDefinePropertyWork(document.createElement(\"div\"));if(!definePropertyWorksOnObject||!definePropertyWorksOnDom)var definePropertyFallback=Object.defineProperty}if(!Object.defineProperty||definePropertyFallback){var ERR_NON_OBJECT_DESCRIPTOR=\"Property description must be an object: \",ERR_NON_OBJECT_TARGET=\"Object.defineProperty called on non-object: \",ERR_ACCESSORS_NOT_SUPPORTED=\"getters & setters can not be defined on this javascript engine\";Object.defineProperty=function(object,property,descriptor){if(\"object\"!=typeof object&&\"function\"!=typeof object||null===object)throw new TypeError(ERR_NON_OBJECT_TARGET+object);if(\"object\"!=typeof descriptor&&\"function\"!=typeof descriptor||null===descriptor)throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR+descriptor);if(definePropertyFallback)try{return definePropertyFallback.call(Object,object,property,descriptor)}catch(exception){}if(owns(descriptor,\"value\"))if(supportsAccessors&&(lookupGetter(object,property)||lookupSetter(object,property))){var prototype=object.__proto__;object.__proto__=prototypeOfObject,delete object[property],object[property]=descriptor.value,object.__proto__=prototype}else object[property]=descriptor.value;else{if(!supportsAccessors)throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);owns(descriptor,\"get\")&&defineGetter(object,property,descriptor.get),owns(descriptor,\"set\")&&defineSetter(object,property,descriptor.set)}return object}}Object.defineProperties||(Object.defineProperties=function(object,properties){for(var property in properties)owns(properties,property)&&Object.defineProperty(object,property,properties[property]);return object}),Object.seal||(Object.seal=function(object){return object}),Object.freeze||(Object.freeze=function(object){return object});try{Object.freeze(function(){})}catch(exception){Object.freeze=function(freezeObject){return function(object){return\"function\"==typeof object?object:freezeObject(object)}}(Object.freeze)}if(Object.preventExtensions||(Object.preventExtensions=function(object){return object}),Object.isSealed||(Object.isSealed=function(){return!1}),Object.isFrozen||(Object.isFrozen=function(){return!1}),Object.isExtensible||(Object.isExtensible=function(object){if(Object(object)===object)throw new TypeError;for(var name=\"\";owns(object,name);)name+=\"?\";object[name]=!0;var returnValue=owns(object,name);return delete object[name],returnValue}),!Object.keys){var hasDontEnumBug=!0,dontEnums=[\"toString\",\"toLocaleString\",\"valueOf\",\"hasOwnProperty\",\"isPrototypeOf\",\"propertyIsEnumerable\",\"constructor\"],dontEnumsLength=dontEnums.length;for(var key in{toString:null})hasDontEnumBug=!1;Object.keys=function(object){if(\"object\"!=typeof object&&\"function\"!=typeof object||null===object)throw new TypeError(\"Object.keys called on a non-object\");var keys=[];for(var name in object)owns(object,name)&&keys.push(name);if(hasDontEnumBug)for(var i=0,ii=dontEnumsLength;ii>i;i++){var dontEnum=dontEnums[i];owns(object,dontEnum)&&keys.push(dontEnum)}return keys}}Date.now||(Date.now=function(){return(new Date).getTime()});var ws=\"\t\\n\u000b\\f\\r   ᠎             　\\u2028\\u2029﻿\";if(!String.prototype.trim||ws.trim()){ws=\"[\"+ws+\"]\";var trimBeginRegexp=RegExp(\"^\"+ws+ws+\"*\"),trimEndRegexp=RegExp(ws+ws+\"*$\");String.prototype.trim=function(){return(this+\"\").replace(trimBeginRegexp,\"\").replace(trimEndRegexp,\"\")}}var toObject=function(o){if(null==o)throw new TypeError(\"can't convert \"+o+\" to object\");return Object(o)}});";

/***/ })

});