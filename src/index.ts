
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
	viewerHeight: 0.6,
	lastScript: localStorage.getItem("lastScript") || ""
};

{//UI
	dot("body")
	.div(
		dot.div().id("editor")
	).id("code-editor-div").class("main-pane")
	.div().id("preview-div").class("main-pane")
	//.div().id("animation-div")//.class("")
	// .div(
	// 	dot.div().id("list-of-saves")
	// ).id("saves-div")//.class("")
	.div(
		dot.div().id("output-code-viewer")
	).id("js-code-div").class("main-pane")
	.pre().id("js-code-error-div").class("main-pane").style(dotcss.display("none"))
}

{//Editors
	var editor = ace.edit("editor");
	editor.setValue(config.lastScript);
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
					config.lastScript = editor.getValue();
					localStorage.setItem("lastScript", config.lastScript);
					var code = metaPix.transpile(config.lastScript);
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

window.addEventListener( 'resize', windowResize, false );
//document.addEventListener( 'mousemove', onDocumentMouseMove, false );
windowResize();