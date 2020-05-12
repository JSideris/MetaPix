
import dot from "./scripts/lib/dothtml.js";
import dotcss from "./scripts/lib/dotcss.js";
import ace from 'ace-builds'
import * as PIXI from "pixi.js";
import $ from "jquery";

//ace.config.set("basePath", "./scripts/lib/");
//ace.require("./scripts/lib/mode-javascript.js");

import MetaPix from "./scripts/metapix";

var metaPix = new MetaPix();

var config = {
	editorWidth: 0.3,
	viewerHeight: 0.9,
	lastSave: localStorage.getItem("last-save") || "",
	allSaves: JSON.parse(localStorage.getItem("all-saves") || "[]"),
	bgMode: 0
};

function loadLastSave(){
	let save = localStorage.getItem("save-" + config.lastSave) || "";
	editor.setValue(save);

	$("#new-save-name").val(config.lastSave);
	// config.lastSave = save;
	// localStorage.setItem("last-save", save);
}

let loadBtnId = 0;
function loadbtn(saveName){
	let currentBtnId = ++loadBtnId;
	dot("#saves").table(dot.tr(dot.td(
		dot.button(saveName).style(dotcss.widthP(100)).onclick(()=>{
			config.lastSave = saveName;
			localStorage.setItem("last-save", saveName);
			loadLastSave();
		})
	)
	.td(
		dot.button("x").onclick(()=>{
			config.allSaves.splice(config.allSaves.indexOf(saveName), 1);
			localStorage.setItem("all-saves", JSON.stringify(config.allSaves));

			localStorage.removeItem("save-" + saveName);
			let tbl = document.getElementById("tbl-save-" + currentBtnId);
			tbl.parentElement.removeChild(tbl);

		})
	).style(dotcss.width(30)))).id("tbl-save-" + currentBtnId).style(dotcss.widthP(100))
};

{//UI
	dot("body")
	.div(
		dot.div().id("editor")
		.div(
			dot("#saves").button("New").style(dotcss.widthP(100)).onclick(()=>{
				config.lastSave = "";
				$("#new-save-name").val("")
				loadLastSave();
			})
			.table(dot.tr(dot.td(
				dot.input().id("new-save-name").placeholder("save-name").style(dotcss.widthP(100))
				)
				.td(
					dot.button("Save").style(dotcss.widthP(100)).onclick(()=>{
						let name = $("#new-save-name").val();
						config.lastSave = name;
						localStorage.setItem("last-save", name);
						let scriptValue = editor.getValue();
						localStorage.setItem("save-" + name, scriptValue);
						if(config.allSaves.indexOf(name) == -1){
							config.allSaves.push(name);
							localStorage.setItem("all-saves", JSON.stringify(config.allSaves));
							loadbtn(name);
						}
					})
				).style(dotcss.width(80)))).style(dotcss.widthP(100))
		).id("saves")
	).id("code-editor-div").class("main-pane")
	.div(
		dot.button("").id("bg-color-toggle").style(dotcss.position("absolute").width(30).height(30).color("white")).onclick(()=>{
			config.bgMode = (config.bgMode + 1) % 2;
			switch(config.bgMode){
				case 0: {
					dotcss("#bg-color-toggle").backgroundColor("white");
					pixiApp.renderer.backgroundColor = 0x0;
					break;
				}
				case 1: {
					dotcss("#bg-color-toggle").backgroundColor("black");
					pixiApp.renderer.backgroundColor = 0xFFFFFF;
					break;
				}
			}
		})
	).id("preview-div").class("main-pane")
	//.div().id("animation-div")//.class("")
	// .div(
	// 	dot.div().id("list-of-saves")
	// ).id("saves-div")//.class("")
	.div(
		dot.div().id("output-code-viewer")
	).id("js-code-div").class("main-pane")
	.pre().id("js-code-error-div").class("main-pane").style(dotcss.display("none"));
	
	dot.each(config.allSaves, s => {
		loadbtn(s);
	});
}


{//Editors
	var editor = ace.edit("editor");
	loadLastSave();
	var outputCodeViewer = ace.edit("output-code-viewer", {/*mode: "ace/mode/javascript",*/ readOnly: true});
	var maxRefreshCountdownTime = 0.1;
	editor.on("change", function(){
		refreshCountdown = maxRefreshCountdownTime;
	});

	var refreshCountdown = 0.2;
	var errorState = false;
	var allAnimations = {};
	var updateRefreshEditor = function(){
		setTimeout(function(){updateRefreshEditor();}, 100);
		if(refreshCountdown > 0){
			refreshCountdown -= 0.1;
			if(refreshCountdown <= 0){
				try{
					var startTime = Date.now();

					// Kill current animations.
					var activeAnims = Object.keys(allAnimations);
					for(var i = 0; i < activeAnims.length; i++){
						var anim = allAnimations[activeAnims[i]];
						clearInterval(anim);
					}
					allAnimations = {};

					// Process script.
					let scriptValue = editor.getValue();
					if(config.lastSave) localStorage.setItem("save-" + config.lastSave, scriptValue);
					var code = metaPix.transpile(scriptValue);
					outputCodeViewer.setValue(code);
					outputCodeViewer.clearSelection();
					reset();
					var parentGroup = null;
					eval("(function(PIXI, pixiView){\r\n" + code + "\r\npixiView.addChild(generate())\r\n})")(PIXI, pixiView);
					//metaPix.autoUv(parentGroup);
					dot("#animation-div").empty();
					// if(parentGroup.animations){
					// 	var keys = Object.keys(parentGroup.animations);
					// 	for(var i = 0; i < keys.length; i++){
					// 		(function(){
					// 			var animName = keys[i];
					// 			var animation = parentGroup.animations[animName];
					// 			var interval = null;
					// 			dot("#animation-div").button(animName).onclick(function(){
					// 				var time = 0;
					// 				if(interval === null){
					// 					interval = setInterval(function(){
					// 						time += 0.0166;
					// 						var ret = animation(time);
					// 						if(!ret) {
					// 							clearInterval(interval);
					// 							delete allAnimations[interval];
					// 							interval = null;
					// 						}
					// 					}, 16.6);
					// 					allAnimations[interval] = interval;
					// 				}
					// 				else{
					// 					clearInterval(interval);
					// 					delete allAnimations[interval];
					// 					interval = null;
					// 				}
					// 			});
					// 		})();
					// 	}
					// }
					var endTime = Date.now();
					var dt = (endTime - startTime) / 1000;
					console.log("Render time: " + Math.round(dt * 1000) + "ms.");
					maxRefreshCountdownTime = Math.max(0.1, Math.min(1, dt * 10));
					$("#js-code-error-div").hide(300);
					errorState = false;
				}
				catch(e){
					dot("#js-code-error-div").empty().t(e.message);
					console.error(e);
					refreshCountdown = 0.5;
					if(!errorState){
						$("#js-code-error-div").show(300);
						errorState = true;
					}
				}
			}
		}
	}
	updateRefreshEditor();
}

{// Pixi stuff. 


	var pixiApp = new PIXI.Application({
		width: window.innerWidth, 
		height: window.innerHeight, 
		backgroundColor: 0
		//backgroundColor: 0xAAAAFF
	});

	var pixiView = new PIXI.Container();
	pixiView.sortableChildren = true;
	pixiApp.stage.addChild(pixiView);
	//pixiView.parentLayer = canvasHudLayer;
	var middleGfx = new PIXI.Graphics();
	middleGfx.lineStyle(1,0xffffff,0.2);
	middleGfx.moveTo(20, 0);
	middleGfx.lineTo(-20, 0);
	middleGfx.moveTo(0, 20);
	middleGfx.lineTo(0, -20);
	pixiApp.stage.addChild(middleGfx);
	
	
	var canvas = pixiApp.view;
	var canvasScale = 1;
	canvas.onwheel = e =>{
		if(e.deltaY < 0){
			canvasScale /= 0.9;
		}
		else if(e.deltaY > 0){
			canvasScale *= 0.9;
		}
		pixiView.scale.set(canvasScale,canvasScale);
	}

	canvas.onmousemove = e => {
		if(e.buttons){
			pixiView.position.set(pixiView.position.x + e.movementX, pixiView.position.y + e.movementY);
			middleGfx.position.set(pixiView.position.x + e.movementX, pixiView.position.y + e.movementY);
		}
	}
	// canvas.style.display = "block";

	var container = document.getElementById( 'preview-div' );
	container.appendChild(pixiApp.view);

	function animate() {
		requestAnimationFrame( animate );
		//render();
	}

	animate();
}

function reset(){
	for (var i = pixiView.children.length - 1; i >= 0; i--) { pixiView.removeChild(pixiView.children[i]); };
}


function windowResize(){
	dotcss("#code-editor-div")
	.height(window.innerHeight)
	.width(window.innerWidth * config.editorWidth);

	dotcss("#preview-div")
	.height(window.innerHeight * config.viewerHeight)
	.width(window.innerWidth * (1-config.editorWidth));

	dotcss("#js-code-div")
	.height(window.innerHeight * (1-config.viewerHeight))
	.width(window.innerWidth * (1-config.editorWidth));

	dotcss("#js-code-error-div")
	.width(window.innerWidth * (1-config.editorWidth) - 20);

	let windowHalfX = container.offsetWidth / 2;
	let windowHalfY = container.offsetHeight / 2;

	pixiApp.stage.position.set(windowHalfX, windowHalfY);

	// camera.aspect = container.offsetWidth / container.offsetHeight;
	// camera.updateProjectionMatrix();
	// renderer.setSize( container.offsetWidth, container.offsetHeight );
}

function onDocumentMouseMove( event ) {
	// mouseX = ( event.clientX - windowHalfX ) / 2;
	// mouseY = ( event.clientY - windowHalfY ) / 2;
}

window.addEventListener( "resize", windowResize, false );
//document.addEventListener( 'mousemove', onDocumentMouseMove, false );
windowResize();