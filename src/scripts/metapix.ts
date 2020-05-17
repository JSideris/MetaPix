

export default class MetaPix{
	constructor(){}

	transpile(code: string, selectedLine: number): string{
		polygonNumbs = 1;
		materialNumbs = 1;
		groupNumbs = 1;
		//allNames = [];
		indent = "\t";
		globalIndentationType = "none";
		noAnimations = true;

		var output = [];
		output.push("var generate = function(){");
		//output.push("    var defaultMaterial = new THREE.MeshStandardMaterial({color: 0xFF00FF});");
		output.push("    var container0 = new PIXI.Container();");
		
		var parentBlock = new Block(null, null, 0, false);
		var topLevelBlock = parentBlock;
		var lastBlock = null;
		//var indentationStack = [];
		//indentationStack.push(0);
		//console.log("Building.");
		
		// Transpile each line.
		var lines = code.split("\n");
		for(var i = 0; i < lines.length; i++){
			var fullLine = lines[i].split("#")[0];
			var indentation = getIndentation(fullLine);
			var line = fullLine.trim();
			if(line == "") continue;
			if(indentation.type == "error") throwError(i+1,indentation.level,"Can't indent with both tabs and spaces on the same line.", fullLine);
			if(globalIndentationType == "none"){
				globalIndentationType = indentation.type;
			}
			else if(globalIndentationType != indentation.type && indentation.type != "none"){
				throwError(i+1,0,"Can't switch from " + globalIndentationType + " to " + indentation.type + ".", fullLine);
			}

			var thisBlock = new Block(indentation, fullLine, i+1, selectedLine == i + 1);
			if(!lastBlock || lastBlock.indentation.level == indentation.level){
				lastBlock = thisBlock;
			}
			else if(lastBlock.indentation.level < indentation.level){ //Indents.
				parentBlock = lastBlock;
				lastBlock = thisBlock;
				
			}
			else if(lastBlock.indentation.level > indentation.level){ //Unindents.
				while(parentBlock.indentation.level > indentation.level) parentBlock = parentBlock.parent;
				if(parentBlock.indentation.level != indentation.level){
					throwError(i+1, 0, "Indentation level does not match any previous levels.", fullLine);
				}
				parentBlock = parentBlock.parent
				lastBlock = thisBlock;
			}
			thisBlock.parent = parentBlock;
			parentBlock.children.push(thisBlock);

			//var obj = getJsCodeForLine(line, currentParent);
			// if(obj.error){
			// 	throwError(i + 1, obj.errorChar + indentation.level, obj.error, fullLine);
			// }
			//console.log("Done.");
		}

		var codeTree = new PixiNode(topLevelBlock, null);
		//codeTree.allMaterials.push(new Material("MeshBasic", null, null, null));
		output.push(codeTree.toJs(null) + indent + "return " + codeTree.name + ";");
		//output.push(`container0.cacheAsBitmap = true;`);
		// output.push("var geometry = new THREE.BoxBufferGeometry( 200, 200, 200 );")
		// output.push("var material = new THREE.MeshPhysicalMaterial( { color: 0xFF0000 } );")
		// output.push("var object = new THREE.Mesh( geometry, material );")

		//output.push("\treturn " + codeTree.name + ";");
		output.push("}");
		return output.join("\r\n");
	}
}

class Block {
	parent: Block = null;
	creationLine: string = null;
	lineNumber: number = null;
	children: Block[] = [];
	indentation: { level: number; type: string; };
	isSelected: boolean = false;
	cursorY: number = 0;
	cursorX: number = 0;
	
	constructor(indentation: { level: number; type: string; }, creationLine:string, lineNumber:number, isSelected:boolean){
		this.indentation = indentation ?? {level: 0, type: "none"};
		this.creationLine = creationLine;
		this.lineNumber = lineNumber;
		this.isSelected = isSelected;
	}
}


	var polygonNumbs = 1;
	var materialNumbs = 1;
	var groupNumbs = 1;
	//var allNames = [];
	var indent = "    ";
	var globalIndentationType = "none";
	var noAnimations = true;

	var globalCommands = {};

class MetaPixCommand{
	command: string; 
	parse: Function;
	render: Function;
	close: Function;

	constructor(command, parse?: (node: PixiNode)=>void, render?: (node: PixiNode)=>string, close?: (node: PixiNode)=>string){
		this.command = command;
		this.parse = parse;
		this.render = render;
		this.close = close;
		globalCommands[command] = this;
	}
}


	function validateCommand(node: PixiNode, name: string, requireParams: string[], optionalParams: string[], allowedParents: string[]){
		if(
			(allowedParents.indexOf("Graphics") == -1 && node.parent.isGraphics)
			|| (allowedParents.indexOf("Container") == -1 && node.parent.isContainer)
		){
			let message = "";
			if(allowedParents.length == 0) message = `${name} objects are not supported.`;
			else if(allowedParents.length == 1) message = `${name} objects are only valid inside ${allowedParents[0] } objects.`;
			else message = `${name} objects are only valid inside ${allowedParents.slice(0, allowedParents.length - 1).join(", ") } or ${allowedParents[allowedParents.length - 1]} objects.`;
			
			throwError(node.block.lineNumber, 0, message, node.block.creationLine);
		}
		
		if(node.args.length < requireParams.length || node.args.length > requireParams.length + optionalParams.length){
			throwError(node.block.lineNumber, 0, `Invalid usage. The ${name} command has ${requireParams.length} ${requireParams.length + optionalParams.length == 0 ? "" : "required "}parameters${requireParams.length > 0 ? ` (${(requireParams as string[]).join(", ")})`:``}${optionalParams.length > 0 ? `, and ${optionalParams.length} optional parameters (${(optionalParams as string[]).join(", ")})`:``}.`, node.block.creationLine);

		}
	}
	
	function drawBoundingBoxIfSelected(node: PixiNode){
		if(node.block.isSelected){
			switch(node.command){
				case "Container":
				case "Graphics":
				case "Ellipse":
				case "DrawEllipse":
				case "Circle":
				case "DrawCircle":
				case "Rect":
				case "DrawRect":
				case "RoundedRect":
				case "DrawRoundedRect":
					return [
						"",
						`var _boundingBoxRect = new PIXI.Graphics();`, 
						`_boundingBoxRect.lineStyle(1, 0x6666FF, 0.6);`, 
						`_boundingBoxRect.drawShape(${node.name}.getBounds ? ${node.name}.getBounds() : ${node.name});`,
						`container0.addChild(_boundingBoxRect)`, 
						""
					].join(`\r\n${node.indentChars}`);
				case "Arc":{
					return [
						"",
						`var _boundingBoxRect = new PIXI.Graphics();`, 
						`var _boundingBoxPosition = ${node.parent.name}.getGlobalPosition();`,
						`_boundingBoxRect.lineStyle(1, 0x6666FF, 0.6);`, 
						`_boundingBoxRect.drawRect(_boundingBoxPosition.x+${node.args[0]}-${node.args[2]},_boundingBoxPosition.y+${node.args[1]}-${node.args[2]},${Number(node.args[2])*2},${Number(node.args[2])*2});`,
						`container0.addChild(_boundingBoxRect)`, 
						""
					].join(`\r\n${node.indentChars}`);
				}
				case "LineTo":
				case "MoveTo":{
					return [
						"",
						`var _boundingBoxArrow = new PIXI.Graphics();`, 
						`var _boundingBoxPosition = ${node.parent.name}.getGlobalPosition();`,
						`_boundingBoxArrow.lineStyle(2, 0x6666FF, 1);`, 
						`_boundingBoxArrow.moveTo(_boundingBoxPosition.x+${node.parent.block.cursorX},_boundingBoxPosition.y+${node.parent.block.cursorY});`,
						`_boundingBoxArrow.lineTo(_boundingBoxPosition.x+${node.args[0]},_boundingBoxPosition.y+${node.args[1]});`,
						`container0.addChild(_boundingBoxArrow)`, 
						""
					].join(`\r\n${node.indentChars}`);
				}
				default: return "";
			}
		}

		return "";
	}

	function getNameWithPrefix(node: PixiNode, prefix: string){
		if(!node.name) {
			node.name = node.nextName(prefix);
			if(node.allNames.indexOf(node.name) != -1) throwError(node.block.lineNumber, node.block.indentation.level, "The name `" + node.name + "` was declared twice.", node.block.creationLine);
			node.allNames.push(node.name);
		}
	}

	var gfxFunctions = [
		// GfxMethods
		["Arc", "arc", ["cx", "cy", "radius", "startAngle", "endAngle"], ["anticlockwise"]],
		["ArcTo", "arcTo", ["x1", "y1", "x2", "y2", "radius"], []],
		["BeginFill", "beginFill", [], ["color", "alpha"]],
		["BeginHole", "beginHole", [], []],
		["BezierCurveTo", "bezierCurveTo", ["cpX", "cpY", "cpX2", "cpY2", "toX", "toY"], []],
		["ClosePath", "closePath", [], []],
		["EndFill", "endFill", [], []],
		["EndHole", "endHole", [], []],
		["FinishPoly", "finishPoly", [], []],
		["LineStyle", "lineStyle", [], ["width", "color", "alpha", "alignment", "native"]],
		["LineTo", "lineTo", ["x", "y"], []],
		["MoveTo", "moveTo", ["x", "y"], []],

		// Drawing Methods (deprecated)
		["DrawStar", "drawStar", ["x", "y", "points", "radius"], ["innerRadius", "rotation"]],
	];

	for(let i = 0; i < gfxFunctions.length; i++){
		let command = gfxFunctions[i];
		new MetaPixCommand(command[0], (node) => {
			validateCommand(node, command[0] as string, command[2] as string[], command[3] as string[], ["Graphics"]);

			//node.relevantContainer = node;
		}, (node) => {
			var ret = "";
			//ret += node.indentChars + "" + node.parent.name + ".beginFill(0xe74c3c); // Red\r\n"

			// Center rects.
			switch(command[1]){
				case "drawRect":
				case "drawRoundedRect":
					node.args[0] = "" + (Number(node.args[0]) - Number(node.args[2]) / 2);
					node.args[1] = "" + (Number(node.args[1]) - Number(node.args[3]) / 2);
					break;
			}

			// Rads to degs.
			switch(command[1]){
				case "arc":
					node.args[3] = "" + (Number(node.args[3]) * Math.PI / 180);
					node.args[4] = "" + (Number(node.args[4]) * Math.PI / 180);
					break;
				case "drawStar":
					if(node.args.length > 5)
					node.args[5] = "" + (Number(node.args[5]) * Math.PI / 180);
					break;
			}

			// generalized conversion to degrees:
			// for(let a = 0; a < node.args[a].length; a++){
			// 	if(command[1].indexOf(":angle") != -1){
			// 		node.args[a] = "" + (Number(node.args[0]) * Math.PI / 180);
			// 	}
			// }

			ret += `${node.indentChars}${node.parent.name}.${command[1]}( ${node.args.join(", ")} );\r\n`
	
			return ret;
		}, node=>{
			let ret = "";
			ret += drawBoundingBoxIfSelected(node);

			if(node.command == "MoveTo" || node.command == "LineTo"){
				node.parent.block.cursorX = Number(node.args[0]);
				node.parent.block.cursorY = Number(node.args[1]);
			}

			return ret;
		});
	}

	var shapes = [
		["Circle", "Circle", ["x", "y", "radius"], []],
		["Ellipse", "Ellipse", ["x", "y", "width", "height"], []],
		["Polygon", "Polygon", ["path"], []],
		["Rect", "Rectangle", ["x", "y", "width", "height"], []],
		["RoundedRect", "RoundedRectangle", ["x", "y", "width", "height", "radius"], []],
		
		// Aliases
		["DrawCircle", "Circle", ["x", "y", "radius"], []],
		["DrawEllipse", "Ellipse", ["x", "y", "width", "height"], []],
		["DrawPolygon", "Polygon", ["path"], []],
		["DrawRect", "Rectangle", ["x", "y", "width", "height"], []],
		["DrawRoundedRect", "RoundedRectangle", ["x", "y", "width", "height", "radius"], []],
		//["Star", "drawStar", ["x", "y", "points", "radius"], ["innerRadius", "rotation"]],
	];

	for(let i = 0; i < shapes.length; i++){
		let command = shapes[i];
		new MetaPixCommand(command[0], (node) => {

			validateCommand(node, command[0] as string, command[2] as string[], command[3] as string[], ["Graphics"]);
			node.isShape = true;
			//node.relevantContainer = node;
		}, (node) => {
			var ret = "";
			//ret += node.indentChars + "" + node.parent.name + ".beginFill(0xe74c3c); // Red\r\n"

			getNameWithPrefix(node, "shape");
			
			// Center rects.
			switch(command[1]){
				case "Rectangle":
				case "RoundedRectangle":
					node.args[0] = "" + (Number(node.args[0]) - Number(node.args[2]) / 2);
					node.args[1] = "" + (Number(node.args[1]) - Number(node.args[3]) / 2);
					break;
			}

			ret += [
				"",
				`var ${node.name} = new PIXI.${command[1]}(${node.args.join(", ")});`,
				`${node.parent.name}.drawShape( ${node.name} );`,
				""
			].join(`\r\n${node.indentChars}`);
	
			return ret;
		}, node => {
			let ret = "";
			ret += drawBoundingBoxIfSelected(node);
			return ret;
		});
	}

	
	var gfxAndContainerProps = [
		// GfxMethods
		["Rotate", "rotation", "angle"],
	];

	for(let i = 0; i < gfxAndContainerProps.length; i++){
		let command = gfxAndContainerProps[i];
		new MetaPixCommand(command[0], (node) => {
			//node.relevantContainer = node;
			console.log(node);
			validateCommand(node, command[0], [command[2]], [command[3]], ["Container", "Graphics"]);
			if(!node.relevantContainer || !node.parent.isGraphics && !node.parent.isContainer){
				//if(!this.parent.isGeometry && !this.parent.isContainer && !this.parent.isModifier && !this.parent.isFlowControl){
				throwError(node.block.lineNumber, 0, `The ${command[0]} command must be nested in a Graphics or Container object.`, node.block.creationLine);
			}
			if(node.args.length != 1){
				//if(!this.parent.isGeometry && !this.parent.isContainer && !this.parent.isModifier && !this.parent.isFlowControl){
				throwError(node.block.lineNumber, 0, `The ${command[0]} command takes one argument of ${command[2]} type.`, node.block.creationLine);
			}
		}, (node) => {
			var ret = "";
			//ret += node.indentChars + "" + node.parent.name + ".beginFill(0xe74c3c); // Red\r\n"

			if(command[2] == "angle"){
				node.args[0] = "" + (Number(node.args[0]) * Math.PI / 180);
			}

			ret += `${node.indentChars}${node.parent.name}.${command[1]} = ${node.args[0]};\r\n`
	
			return ret;
		}, null/*GeometryCommandClose*/);
	}
	

	new MetaPixCommand("If", function(node){
		node.isFlowControl = true;
		if(node.args.length != 1){
			throwError(node.block.lineNumber, 0, "If blocks require a single parameter.", node.block.creationLine);
		}
	}, function(node){
		var ret = "";
		ret += node.indentChars + "if(" + node.args[0] + "){\r\n";
		node.indentation = (node.indentation || 0) + 1;
		return ret;
	}, function(node){
		return node.indentChars + "}\r\n";
	});

	new MetaPixCommand("ElseIf", function(node){
		node.isFlowControl = true;
		if(node.args.length != 1){
			throwError(node.block.lineNumber, 0, "ElseIf blocks require a single parameter.", node.block.creationLine);
		}
	}, function(node){
		var ret = "";
		ret += node.indentChars + "else if(" + node.args[0] + "){\r\n";
		node.indentation = (node.indentation || 0) + 1;
		return ret;
	}, function(node){
		return node.indentChars + "}\r\n";
	});

	new MetaPixCommand("Else", function(node){
		node.isFlowControl = true;
		if(node.args.length != 0){
			throwError(node.block.lineNumber, 0, "Else blocks do not accept any parameters.", node.block.creationLine);
		}
	}, function(node){
		var ret = "";
		ret += node.indentChars + "else{\r\n";
		node.indentation = (node.indentation || 0) + 1;
		return ret;
	}, function(node){
		return node.indentChars + "}\r\n";
	});

	new MetaPixCommand("Template", function(node){
		node.isFlowControl = true;
		node.relevantContainer = node;
		node.relaventParentContainer = node;
		if(!node.name) throwError(node.block.lineNumber, 0, "Templates must be assigned a name.", node.block.creationLine);
		//console.log(node.name);
		//console.log(node.templateNames[node.name]);
		if(node.templateNames[node.name]) throwError(node.block.lineNumber, 0, "Template name \"" + node.name + "\" is already in use by another template.", node.block.creationLine);
		node.templateNames[node.name] = node;
		//if(this.name[this.name]) throwError(block.lineNumber, 0, "Template name \"" + this.name + "\" is already in use by a variable.", this.block.creationLine);
	}, function(node){
		var ret = "";
		/*if(!node.name){
		}*/
		ret += node.indentChars + "var " + node.name + " = function(" + node.args.join(", ") + "){\r\n";
		getNameWithPrefix(node, "container");
		node.indentation = (node.indentation || 0) + 1;
		ret += node.indentChars + indent + "var " + node.name + " = new PIXI.Container();\r\n"
		return ret;
	}, function(node){
		return node.indentChars + indent + "return " + node.name + ";\r\n" + node.indentChars + "}\r\n";
	});

	new MetaPixCommand("Array", function(node){
		node.isModifier = true;
		// if(node.parent && !node.parent.isGeometry && !node.parent.isContainer && !node.parent.isModifier){
		// 	throwError(node.block.lineNumber, 0, "Modifiers must be nested in other modifiers, groups, or geometry.", node.block.creationLine);
		// }
	}, function(node){
		var ret = "";
		node.arrayVarName = node.args[0];
		node.arrayCount = isNaN(node.args[1]) ? node.args[1] : Number(node.args[1]);
		//node.name = node.parent.name; //I don't think node matters anymore.
		if(!node.arrayVarName){ //TODO: also validate the name. TODO: and make sure the var isn't in use.
			throwError(node.block.lineNumber, node.block.indentation.level, "Array requires a valid var name to iterate over.", node.block.creationLine);
		}
		if((!isNaN(node.arrayCount) && node.arrayCount < 0)){ //TODO: now accepts vars, but doesn't offer adiquate validation.
			throwError(node.block.lineNumber, node.block.indentation.level, "Second parameter must be a number above zero.", node.block.creationLine);
		}
		
		if(node.allNames.indexOf(node.arrayVarName) != -1) throwError(node.block.lineNumber, node.block.indentation.level, "The name `" + node.arrayVarName + "` was declared twice. Avoid the `group` prefix because it's used internally.", node.block.creationLine);
		node.allNames.push(node.arrayVarName);
		
		ret += node.indentChars + "for(var " + node.arrayVarName + " = 0; " + node.arrayVarName + " < " + node.arrayCount + "; " + node.arrayVarName + "++){\r\n";
		node.indentation = (node.indentation || 0) + 1;
		return ret;
	}, function(node){
		var ret = "";
		ret += node.indentChars + "}\r\n";
		node.allNames.splice(node.allNames.indexOf(node.arrayVarName), 1);
		return ret;
	});

	new MetaPixCommand("Material", function(node){
		node.isMaterialAssignment = true;
		node.parent.material = node.args[0] || null;
	}, function(node){
		return "";
	});

	new MetaPixCommand("Graphics", function(node){
		validateCommand(node, "Graphics", [], ["x", "y"], ["Container", "Graphics"]);
		node.isGraphics = true;
		node.relevantContainer = node;
	}, function(node){
		var ret = "";
		getNameWithPrefix(node, "gfx");
		ret += `${node.indentChars}var ${node.name} = new PIXI.Graphics();\r\n`;
		if(node.relaventParentContainer && node.parent) ret += node.indentChars + node.relaventParentContainer.name + ".addChild(" + node.name + ")\r\n";
		if(node.args.length == 2) ret += `${node.indentChars}${node.name}.position.set(${node.args.join(", ")});\r\n`;
		return ret;		
	}, function(node){
		let ret = "";
		ret += drawBoundingBoxIfSelected(node);
		return ret;
	});

	new MetaPixCommand("Container", function(node){
		validateCommand(node, "Container", [], ["x", "y"], ["Container"]);
		node.isContainer = true;
		node.relevantContainer = node;
	}, function(node){
		var ret = "";
		getNameWithPrefix(node, "container");
		ret += node.indentChars + "var " + node.name + " = new PIXI.Container();\r\n"
		if(node.relaventParentContainer && node.parent) ret += node.indentChars + node.relaventParentContainer.name + ".addChild(" + node.name + ")\r\n"
		if(node.args.length == 2) ret += `${node.indentChars}${node.name}.position.set(${node.args.join(", ")});\r\n`;
		return ret;
	}, function(node){
		let ret = "";
		ret += drawBoundingBoxIfSelected(node);
		return ret;
	});

	new MetaPixCommand("Animate", function(node){
		node.isAnimation = true;
	}, function(node){
		var ret = "";
		getNameWithPrefix(node, "animation");
		if(noAnimations){
			noAnimations = false;
			ret += node.indentChars + "group0.animations = {};\r\n"
		}
		ret += node.indentChars + "group0.animations[\"" + node.name + "\"] = function(time){\r\n";
		
		node.indentation = (node.indentation || 0) + 1;
		return ret;
	}, function(node){
		var ret = "";
		ret += node.indentChars + indent + "return true;\r\n";
		ret += node.indentChars + "}\r\n";
		//node.allNames.splice(node.allNames.indexOf(node.arrayVarName), 1);
		return ret;
	});
	
	//Completes the animation.
	new MetaPixCommand("Done", function(node){
	}, function(node){
		return node.indentChars + "return false;\r\n";
	}, function(node){
		return "";
	});

	new MetaPixCommand("Js", function(node){
	}, function(node){
		return node.name + " = " + node.statementPart + ";\r\n";
	});

	var Material = function(type,name, creationLine, block){
		this.type = type;
		this.name = name || null;
		this.creationLine = creationLine;
		this.block = block;
	};

	var Indentation = function(level, type){
		this.level = level || 0;
		this.type = type || null;

	};

class PixiNode{
	block: Block;
	type: any = null;
	name: any = null;
	command: any = null;
	creationLine: any;
	parent: PixiNode;
	isBoolean: any;
	booleanChildren: any;
	material: any;
	defaultMaterial: any;
	relaventParentContainer: any;
	relevantContainer: any;
	allNames: any;
	allMaterials: any;
	templateNames: any;
	allMaterialsByName: any;

	statementPart = "";
	args = [];
	
	isContainer = false;
	isGraphics = false;
	// isGeometryModifier = false;
	// isGeometry = false;
	
	isFlowControl = false;
	isTemplate = false;

	isIntersection = false;
	isSubtraction = false;
	isUnion = false;
	
	isAnimation = false;

	isJsAssignment = false;

	isModifier = false;
	arrayVarName = null;
	arrayCount = 1;
	
	isMaterial = false;
	isMaterialAssignment = false;
	isMaterialModifier = false;

	children: any[] = [];
	nameNumbs: any = {};
	indentChars: string;
	indentation: any;
	isShape: boolean;


	

	constructor(block: Block, parent: PixiNode){
		//parent, type, name, indentationLevel, creationLine, 
		this.block = block;
		this.creationLine = block.creationLine;
		this.parent = parent;
		this.isBoolean = parent ? parent.isBoolean : false;
		this.booleanChildren = parent ? parent.booleanChildren : null;

		
		this.material = this.parent ? this.parent.material : null; //Only for meshes / it's a name.
		this.defaultMaterial = this.parent ? this.parent.defaultMaterial : null;
		this.relaventParentContainer = parent ? parent.relevantContainer : this;
		this.relevantContainer = this.relaventParentContainer;
		
		this.allNames = parent ? this.parent.allNames : [];
		this.allMaterials = parent ? this.parent.allMaterials : [];
		this.templateNames = parent ? this.parent.templateNames : {};
		this.allMaterialsByName = parent ? this.parent.allMaterialsByName : {};

		if(block){
			this.parseBlock(block);
		}
	}

	parseBlock(block){
		//console.log(block);
		// { //Block format:
		// 	parent: null,
		// 	creationLine: null,
		// 	children: [],
		// 	indentation: {level: 0, type: "none"}
		// };
		if(block.creationLine){
			this.parseLine(block);
		}
		else if(!this.parent){
			this.isContainer = true;
			this.name = "container0";
			this.allNames.push("container0");
		}
		for(var i = 0; i < block.children.length; i++){
			var node = new PixiNode(block.children[i], this);
			this.children.push(node);
			//node.parseBlock(block.children[i]);
		}
	}

	parseLine(block: Block){
		var line = block.creationLine;
		var trimmedLine = line.trim();
		// var ret = {
		// 	name: "",
		// 	threeCode: [],
		// 	error: null, errorChar: 0
		// };

		var lhs = trimmedLine.split("=", 1)[0];
		var eqParts = [];
		var statementPartPos = 0;
		this.name = null;
		this.statementPart = "";
		if(lhs.length == trimmedLine.length || lhs.indexOf("\"") != -1){ // Statement, no assignment.
			eqParts.push(lhs);
			this.statementPart = eqParts[0].trim();
			statementPartPos = 0;
		}
		else{ //Assignment to a var name.
			eqParts.push(lhs.trim());
			eqParts.push(trimmedLine.substring(lhs.length + 1));
			this.name = eqParts[0].trim();
			if(this.allNames.indexOf(this.name) != -1){ //Name already in use.
				var message = "Name `" + this.name + "` is already in use.";
				if(this.name.inedxOf("polygon") == 0) message += " Avoid using the `polygon` prefix for names because it's used internally.";
				if(this.name.inedxOf("material") == 0) message += " Avoid using the `material` prefix for names because it's used internally.";
				if(this.name == "group0") message += " `group0` is the global group used internally.";
				if(this.name == "defaultMaterial") message += " `defaultMaterial` is the default material used internally.";

				throwError(block.lineNumber, block.indentation.level, message, block.creationLine);

				return {errorChar: 0};	
			}
			this.statementPart = eqParts[1].trim();
			statementPartPos = block.indentation.level + eqParts[0].length + 1 + (eqParts[1].length - this.statementPart.length);

			if(this.statementPart.length == 0){
				throwError(block.lineNumber, statementPartPos, "Missing expression.", block.creationLine);
			}
			//When there's an " on the lhs of the assignment.
			//Handle this separately.
			//throwError(block.lineNumber, lhs.indexOf("\"") + (block.indentation.level), "Unexpected character on left hand side of `=`: `\"`", line);
		}

		var statementParts = this.statementPart.split(" ");
		this.command = statementParts[0].trim();
		var argParts = this.statementPart.split(",");
		//this.command = statementParts[0].trim();
		var args = [];
		for(var i = 0; i < argParts.length; i++){
			var pt = argParts[i].trim();
			if(i == 0){
				var firstSpace = pt.indexOf(" ");
				if(firstSpace == -1) continue;
				else pt = pt.substring(firstSpace + 1).trim();
			}
			if(pt.length == 0) continue;
			//TODO: add some type of syntax checker here to verify pt is a legit arg.
			pt = pt.split(" ").join("");
			args.push(pt);
			// if(isNaN(pt)){
			// 	//Todo: check for code injection.
			// }
		}
		this.args = args;
		var cmd = globalCommands[this.command];
		if(cmd){
			cmd.parse(this);
		}
		else{
			if(this.templateNames[this.command]){
				this.isTemplate = true;
				// TODO: templates should only realy exist in the global scope.
				if(!this.parent || !this.parent.isContainer /*&& !this.parent.isFlowControl*/){
					throwError(block.lineNumber, 0, "Templates must be nested in groups, geometry, or modifiers.", this.block.creationLine);
				}
				this.relevantContainer = this;
			}
			else{
				var didYouMean = "";
				var c = this.command.charAt(0);
				if(c == c.toLowerCase()){
					didYouMean = " All built-in commands have a capitalized first character."
				}
				else if(this.command != this.command.toLowerCase()){
					//didYouMean = " Only capitalize the first character of built-in commands."
				}
				else{
					switch(this.command.toLowerCase()){
						case "cube": didYouMean = " Did you mean `Box`?"
					}
				}
				this.isJsAssignment = true;
				//throwError(block.lineNumber, statementPartPos, "Command `" + this.command + "` not recognized." + didYouMean, block.creationLine);
			}
		}
	}

	toJs(indentation){
		this.indentChars = indent;
		if(indentation){
			for(var i = 0; i < indentation; i++) this.indentChars += indent;
		}
		this.indentation = indentation;
		var ret = "";
		if(!this.parent){
			for(var i = 0; i < this.allMaterials.length; i++){
				ret += this.allMaterials[i].toJs();
			}
		}

		var cmd = globalCommands[this.command];
		if(cmd){
			ret += cmd.render(this);
		}
		else if(this.isTemplate){
			getNameWithPrefix(this, "container");
			ret += this.indentChars + "var " + this.name + " = " + this.command + "(" + this.args.join(", ") + ");\r\n"
			if(this.relaventParentContainer) ret += this.indentChars + this.relaventParentContainer.name + ".addChild(" + this.name + ")\r\n"
		}
		else if(this.isJsAssignment){
			ret += this.indentChars + "var " + this.name + " = " + this.statementPart + "\r\n"
		}

		if(this.children.length > 0){
			for(var i = 0; i < this.children.length; i++){
				if(!this.children[i].isMaterial) ret += this.children[i].toJs(this.indentation);
			}
		}

		//Close blocks.
		if(cmd && cmd.close) ret += cmd.close(this);

		return ret;
	}

	nextName(prefix){
		var name;
		do{
			if(!this.nameNumbs[prefix]) this.nameNumbs[prefix] = 1;

			name = prefix + (this.nameNumbs[prefix]++);
		} while(this.allNames.indexOf(name) != -1);
		return name;
	}
}


	

var getIndentation = function(line){
	var ret = new Indentation(0, "none");
	for(var i = 0; i < line.length; i++){
		var c = line.charAt(i);
		if(c == "\r") continue;
		switch(ret.type){
			case "none":{
				if(c == " ") ret.type = "spaces", ret.level++;
				else if(c == "\t") ret.type = "tabs", ret.level++;
				else return ret;
				break;
			}
			case "tabs":{
				if(c == " ") ret.type = "error";
				else if(c == "\t") ret.level++;
				else return ret;
				break;
			}
			case "spaces":{
				if(c == " ") ret.level++;
				else if(c == "\t") ret.type = "error";
				else return ret;
				break;
			}
		}
		if(ret.type == "error") return ret;
	}
	return ret;
}

var throwError = function(l,c,message,line){
	var arrow = " ";
	for(var i = 0; i < c; i++){
		arrow += line[i] == "\t" ? "\t" : " ";
	}
	arrow += "^";
	throw new Error("L" + l + " C" + c + ": " + message + "\r\n\r\n`" + line + "`\r\n" + arrow);
}
