

export default class MetaPix{
	constructor(){}

	transpile(code){
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
		var lines = code.split("\n");

		var parentBlock = new Block(null);
		var topLevelBlock = parentBlock;
		var lastBlock = null;
		//var indentationStack = [];
		//indentationStack.push(0);
		//console.log("Building.");
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

			var thisBlock = new Block(indentation);
			thisBlock.creationLine = fullLine;
			thisBlock.lineNumber = i + 1;
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
		// output.push("var geometry = new THREE.BoxBufferGeometry( 200, 200, 200 );")
		// output.push("var material = new THREE.MeshPhysicalMaterial( { color: 0xFF0000 } );")
		// output.push("var object = new THREE.Mesh( geometry, material );")

		//output.push("\treturn " + codeTree.name + ";");
		output.push("}");
		return output.join("\r\n");
	}
}

class Block {
	parent: any;
	creationLine: any;
	lineNumber: number;
	children: Block[];
	indentation: { level: number; type: string; };
	
	constructor(indentation){
		this.parent = null;
		this.creationLine = null; 
		this.lineNumber = null;
		this.children = [];
		this.indentation = indentation ?? {level: 0, type: "none"};
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


	
	var gfxFunctions = [
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

		["DrawCircle", "drawCircle", ["x", "y", "radius"], []],
		["DrawEllipse", "drawEllipse", ["x", "y", "width", "height"], []],
		["DrawPolygon", "drawPolygon", ["path"], []],
		["DrawRect", "drawRect", ["x", "y", "width", "height"], []],
		["DrawRoundedRect", "drawRoundedRect", ["x", "y", "width", "height", "radius"], []],
		["DrawStar", "drawStar", ["x", "y", "points", "radius"], ["innerRadius", "rotation"]],
	];

	for(let i = 0; i < gfxFunctions.length; i++){
		let command = gfxFunctions[i];
		new MetaPixCommand(command[0], (node) => {
			if(!node.relevantContainer || !node.parent.isGraphics){
			//if(!this.parent.isGeometry && !this.parent.isContainer && !this.parent.isModifier && !this.parent.isFlowControl){
				throwError(node.block.lineNumber, 0, "Shapes must be nested in a Graphics object.", node.block.creationLine);
			}
			
			if(node.args.length < command[2].length || node.args.length > command[2].length + command[3].length){
				throwError(node.block.lineNumber, 0, `Invalid usage. The ${command[0]} has ${command[2].length} ${command[2].length + command[3].length == 0 ? "" : "required "}parameters${command[2].length > 0 ? ` (${(command[2] as string[]).join(", ")})`:``}${command[3].length > 0 ? `, and ${command[3].length} optional parameters (${(command[3] as string[]).join(", ")})`:``}.`, node.block.creationLine);

			}

			node.relevantContainer = node;
		}, (node) => {
			var ret = "";
			//ret += node.indentChars + "" + node.parent.name + ".beginFill(0xe74c3c); // Red\r\n"
			ret += `${node.indentChars}${node.parent.name}.${command[1]}( ${node.args.join(", ")} );\r\n`
	
			return ret;
		}, null/*GeometryCommandClose*/);
	}

	// for(var i = 0; i < gfxFunctions.length; i++){
	// 	var command = gfxFunctions[i];
	// 	new MetaPixCommand(command, GeometryCommandParse, GeometryCommandRender, null/*GeometryCommandClose*/);
	// }
	

	// var GeometryModifierCommandParse = function(node: PixiNode){
	// 	//node.isGeometryModifier = true;
	// 	//if(!node.parent.isGeometry && !node.parent.isContainer && !node.parent.isModifier && !node.parent.isFlowControl){
	// 	if(!node.relevantContainer){
	// 		throwError(node.block.lineNumber, 0, "Translations and transformations must be nested in geometry, groups, or modifiers.", node.block.creationLine);
	// 	}
	// }
	// var GeometryModifierCommandRender = function(node: PixiNode){
	// 	var ret = "";
	// 	if(!node.relevantContainer){
	// 		throwError(node.block.lineNumber, node.block.indentation.level, "No parent geometry or container found for modifier.", node.block.creationLine); // TODO: is this the correct last param? Use to be nul?
	// 	}
		
	// 	switch(node.command){
	// 		case "Rot": ret += node.indentChars + node.relevantContainer.name + ".rotation.set(" + node.args.join(", ") + ");\r\n"; break;
	// 		case "RotX": ret += node.indentChars + node.relevantContainer.name + ".rotation.x = " + node.args[0] + ";\r\n"; break;
	// 		case "RotY": ret += node.indentChars + node.relevantContainer.name + ".rotation.y = " + node.args[0] + ";\r\n"; break;
	// 		case "RotZ": ret += node.indentChars + node.relevantContainer.name + ".rotation.z = " + node.args[0] + ";\r\n"; break;

	// 		case "Scale": ret += node.indentChars + node.relevantContainer.name + ".scale.set(" + node.args.join(", ") + ");\r\n"; break;
	// 		case "ScaleX": ret += node.indentChars + node.relevantContainer.name + ".scale.x = " + node.args[0] + ";\r\n"; break;
	// 		case "ScaleY": ret += node.indentChars + node.relevantContainer.name + ".scale.y = " + node.args[0] + ";\r\n"; break;
	// 		case "ScaleZ": ret += node.indentChars + node.relevantContainer.name + ".scale.z = " + node.args[0] + ";\r\n"; break;

	// 		case "Pos": ret += node.indentChars + node.relevantContainer.name + ".position.set(" + node.args.join(", ") + ");\r\n"; break;
	// 		case "PosX": ret += node.indentChars + node.relevantContainer.name + ".position.x = " + node.args[0] + ";\r\n"; break;
	// 		case "PosY": ret += node.indentChars + node.relevantContainer.name + ".position.y = " + node.args[0] + ";\r\n"; break;
	// 		case "PosZ": ret += node.indentChars + node.relevantContainer.name + ".position.z = " + node.args[0] + ";\r\n"; break;
	// 	}
	// 	return ret;
	// }
	
	// var GeometryModifierTypes = [
	// 	"Pos",
	// 	"PosX",
	// 	"PosY",
	// 	"PosZ",
	// 	"Rot",
	// 	"RotX",
	// 	"RotY",
	// 	"RotZ",
	// 	"Scale",
	// 	"ScaleX",
	// 	"ScaleY",
	// 	"ScaleZ"
	// ];

	// for(var i = 0; i < GeometryModifierTypes.length; i++){
	// 	var command = GeometryModifierTypes[i];
	// 	new MetaPixCommand(command, GeometryModifierCommandParse, GeometryModifierCommandRender);
	// }

	// var MaterialCommandParse = function(node){
	// 	node.isMaterial = true;
	// 	node.parent.material = null;
	// 	node.parent.defaultMaterial = node;
	// 	node.allMaterials.push(node);
	// }
	// var MaterialCommandRender = function(node){
	// 	var ret = "";
	// 	if(!node.name) {
	// 		node.name = node.nextName("material");
	// 		if(node.allNames.indexOf(node.name) != -1) throwError(node.block.lineNumber, node.block.indentation.level, "The name `" + node.name + "` was declared twice. Avoid the `material` prefix because it's used internally.", null);
	// 		node.allNames.push(node.name);
	// 	}
	// 	node.allMaterialsByName[node.name] = node;
	// 	switch(node.command){
	// 		case "LineMat": ret += node.indentChars + "var " + node.name + " = new THREE.LineBasicMaterial(" + node.args.join(", ") + ");\r\n"; break;
	// 		case "DashedMat": ret += node.indentChars + "var " + node.name + " = new THREE.LineDashedMaterial(" + node.args.join(", ") + ");\r\n"; break;
	// 		case "MeshMat": ret += node.indentChars + "var " + node.name + " = new THREE.MeshBasicMaterial(" + node.args.join(", ") + ");\r\n"; break;
	// 		case "DepthMat": ret += node.indentChars + "var " + node.name + " = new THREE.MeshDepthMaterial(" + node.args.join(", ") + ");\r\n"; break;
	// 		case "LambertMat": ret += node.indentChars + "var " + node.name + " = new THREE.MeshLambertMaterial(" + node.args.join(", ") + ");\r\n"; break;
	// 		case "NormalMat": ret += node.indentChars + "var " + node.name + " = new THREE.MeshNormalMaterial(" + node.args.join(", ") + ");\r\n"; break;
	// 		case "PhongMat": ret += node.indentChars + "var " + node.name + " = new THREE.MeshPhongMaterial(" + node.args.join(", ") + ");\r\n"; break;
	// 		case "PhysicalMat": ret += node.indentChars + "var " + node.name + " = new THREE.MeshPhysicalMaterial(" + node.args.join(", ") + ");\r\n"; break;
	// 		case "StandardMat": ret += node.indentChars + "var " + node.name + " = new THREE.MeshStandardMaterial(" + node.args.join(", ") + ");\r\n"; break;
	// 		case "ToonMat": ret += node.indentChars + "var " + node.name + " = new THREE.MeshToonMaterial(" + node.args.join(", ") + ");\r\n"; break;
	// 		case "PointsMat": ret += node.indentChars + "var " + node.name + " = new THREE.PointsMaterial(" + node.args.join(", ") + ");\r\n"; break;
	// 		case "ShadowMat": ret += node.indentChars + "var " + node.name + " = new THREE.ShadowMaterial(" + node.args.join(", ") + ");\r\n"; break;
	// 	}
	// 	return ret;
	// }
	
	// var MaterialTypes = [
	// 	"LineMat",
	// 	"DashedMat",
	// 	"MeshMat",
	// 	"DepthMat",
	// 	"LambertMat",
	// 	"NormalMat",
	// 	"PhongMat",
	// 	"PhysicalMat",
	// 	"StandardMat",
	// 	"ToonMat",
	// 	"PointsMat",
	// 	"ShadowMat",
	// 	//"rawshader",
	// 	"ShaderMat"
	// 	//"sprite",
	// ];

	// for(var i = 0; i < MaterialTypes.length; i++){
	// 	var command = MaterialTypes[i];
	// 	new MetaPixCommand(command, MaterialCommandParse, MaterialCommandRender);
	// }
	
	// var MaterialModifierCommandParse = function(node){
	// 	node.isMaterialModifier = true;
	// 	if(!node.parent.isMaterial){
	// 		throwError(node.block.lineNumber, 0, "Material modifiers must be nested in a material.", node.block.creationLine);
	// 	}
	// }
	// var MaterialModifierCommandRender = function(node){
	// 	var ret = "";
	// 	//ret += node.indentChars + node.parent.name + "." + node.command.toLowerCase() + " = " + node.args[0] + ";\r\n"
	// 	if(!node.parent) throwError(node.block.lineNumber, node.block.indentation.level, "No parent material found for material modifier."); //TODO: is parent guaranteed to be a material?
	// 	//TODO: won't work with if statemntes.
	// 	var fullName = node.parent.name + "." + node.command[0].toLowerCase() + node.command.substring(1);
	// 	ret += node.indentChars + fullName + ".set ? " + fullName + ".set(" + node.args[0] + ") : " + fullName + " = " + node.args[0] + ";\r\n"
	// 	return ret;
	// }
	
	// var MaterialModifierTypes = [
	// 	"Color",
	// 	"DoubleSided",
	// 	"Roughness",
	// 	"Reflectivity",
	// 	"RefractionRatio",
	// 	"Skinning",
	// 	"Wireframe",
	// 	"WireframeLinecap",
	// 	"WireframeLinewidth",
	// 	"WireframeLineJoin",
	// ];

	// for(var i = 0; i < MaterialModifierTypes.length; i++){
	// 	var command = MaterialModifierTypes[i];
	// 	new MetaPixCommand(command, MaterialModifierCommandParse, MaterialModifierCommandRender);
	// }

	var BooleanCommandParse = function(node){
		//if(!THREE.CSG) throwError(node.block.lineNumber, 0, "Cannot use boolean operations unless CSG dependency is resolved.", node.block.creationLine);
		node.isBoolean = true;
		node.isIntersection = true;
		node.booleanChildren = [];
		if(node.parent && !node.parent.isGeometry && !node.parent.isContainer && !node.parent.isFlowControl){
			throwError(node.block.lineNumber, 0, "Boolead operations must be nested in groups, geometry.", node.block.creationLine);
		}
	}

	var BooleanCommandRender = function(node){
		return node.indentChars + node.parent.name + " = new ThreeBSP(" + node.parent.name + ");\r\n"
	}

	var BooleanCommandClose = function(node){
		var ret = "";
		if(node.booleanChildren) {
			for(var i = 0; i < node.booleanChildren.length; i++){
				var cn = node.booleanChildren[i];

				ret += node.indentChars + cn.name + " = new ThreeBSP(" + cn.name + ");\r\n"
				ret += node.indentChars + node.parent.name + " = " + node.parent.name + "." + cn.parent.command.toLowerCase() + "(" + cn.name + ");\r\n";

				//ret += node.indentChars + node.parent.name + " = THREE.CSG.toGeometry(" + node.parent.name + ");\r\n"
				//ret += node.indentChars + node.parent.name + ".intersect(new ThreeBSP(" + node.booleanChildren[i].name + "));\r\n"
			}
		}
		ret += node.indentChars + node.parent.name + " = " + node.parent.name + ".toMesh();\r\n"
		ret += node.indentChars + node.parent.name + ".material = " + node.parent.material + ";\r\n"

		return ret;
	}
	
	var BooleanTypes = [
		"Intersect", "Subtract", "Union"
	];

	for(var i = 0; i < BooleanTypes.length; i++){
		let command = BooleanTypes[i];
		new MetaPixCommand(command, BooleanCommandParse, BooleanCommandRender, BooleanCommandClose);
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
		node.name = node.nextName("container");
		node.allNames.push(node.name);
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
		node.isGraphics = true;
		if(!node.parent || !node.parent.isContainer && !node.parent.isGraphics){
			throwError(node.block.lineNumber, 0, "Graphics can only go in containers or other graphics.", node.block.creationLine);
		}
		node.relevantContainer = node;
	}, function(node){
		var ret = "";
		if(!node.name) {
			node.name = node.nextName("gfx");
			if(node.allNames.indexOf(node.name) != -1) throwError(node.block.lineNumber, node.block.indentation.level, "The name `" + node.name + "` was declared twice.", node.block.creationLine);
			node.allNames.push(node.name);
		}
		ret += `${node.indentChars}var ${node.name} = new PIXI.Graphics();\r\n`
		if(node.relaventParentContainer && node.parent) ret += node.indentChars + node.relaventParentContainer.name + ".addChild(" + node.name + ")\r\n";
		if(node.args.length == 2) ret += `${node.indentChars}${node.name}.position.set(${node.args.join(", ")});\r\n`;
		return ret;		
	});

	new MetaPixCommand("Container", function(node){
		node.isContainer = true;
		if(!node.parent || !node.parent.isContainer/* || !node.parent.isFlowControl*/){
			throwError(node.block.lineNumber, 0, "Containers can only exist inside of other containers.", node.block.creationLine);
		}
		node.relevantContainer = node;
	}, function(node){
		var ret = "";
		if(!node.name) {
			node.name = node.nextName("container");
			if(node.allNames.indexOf(node.name) != -1) throwError(node.block.lineNumber, node.block.indentation.level, "The name `" + node.name + "` was declared twice. Avoid the `group` prefix because it's used internally.", node.block.creationLine);
			node.allNames.push(node.name);
		}
		ret += node.indentChars + "var " + node.name + " = new PIXI.Container();\r\n"
		if(node.relaventParentContainer && node.parent) ret += node.indentChars + node.relaventParentContainer.name + ".addChild(" + node.name + ")\r\n"
		return ret;
	});

	new MetaPixCommand("Animate", function(node){
		node.isAnimation = true;
	}, function(node){
		var ret = "";
		if(!node.name) {
			node.name = node.nextName("animation");
			if(node.allNames.indexOf(node.name) != -1) throwError(node.block.lineNumber, node.block.indentation.level, "The name `" + node.name + "` was declared twice.", node.block.creationLine);
			node.allNames.push(node.name);
		}
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
			if(!this.name) {
				this.name = this.nextName("container");
				if(this.allNames.indexOf(this.name) != -1) throwError(this.block.lineNumber, this.block.indentation.level, "The name `" + this.name + "` was declared twice. Avoid the `group` prefix because it's used internally.", this.block.creationLine);
				this.allNames.push(this.name);
			}
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
