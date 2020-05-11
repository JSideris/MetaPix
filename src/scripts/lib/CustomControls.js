/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga 	/ http://lantiga.github.io
 */

THREE.CustomControls = function ( camera, domElement, scene, interactionPlane, eventCallbacks ) {

	var _this = this;
	var STATE = { NONE: - 1, ROTATE: 2, INTERACT: 0, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	this.eventCallbacks = eventCallbacks;
	this.scene = scene;
	this.interactionPlane = interactionPlane;
	this.models = [];
	this.canvasPosition = $(domElement).position();
	this.lastMx = 0;
	this.lastMy = 0;

	// API

	this.enabled = true;

	this.screen = { left: 0, top: 0, width: 0, height: 0 };

	this.rotateSpeed = 0.1;
	this.zoomSpeed = 1.2;
	this.panSpeed = 0.3;

	this.noRotate = false;
	this.noZoom = false;
	this.noPan = false;

	this.staticMoving = false;
	this.dynamicDampingFactor = 0.2;

	this.minDistance = 0;
	this.maxDistance = Infinity;

	this.mouselookMode = false;

	this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

	// internals

	this.target = new THREE.Vector3();

	var EPS = 0.000001;

	var lastPosition = new THREE.Vector3();

	var _state = STATE.NONE,
	_prevState = STATE.NONE,

	_eye = new THREE.Vector3(),

	_movePrev = new THREE.Vector2(),
	_moveCurr = new THREE.Vector2(),
	_dragStart = new THREE.Vector2(),
	_dragTo = new THREE.Vector2(),

	_lastAxis = new THREE.Vector3(),
	_lastAngle = 0,

	//_zoomStart = new THREE.Vector2(),
	//_zoomEnd = new THREE.Vector2(),
	_zoomSpeed = 0,
	_elevationSpeed = 0;

	_touchZoomDistanceStart = 0,
	_touchZoomDistanceEnd = 0,

	_panStart = new THREE.Vector2(),
	_panEnd = new THREE.Vector2();

	//From flight controls:
	this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
	this.moveVector = new THREE.Vector3( 0, 0, 0 );
	this.movementSpeed = 1.0;
	this.vMovementSpeed = 1.0;
	this.shiftMode = false;

	//Crazy camera hack.
	this.cameraYaw = 0;
	this.cameraPitch = 0;
	this.camera = camera;

	// for reset

	this.target0 = this.target.clone();
	this.position0 = this.camera.position.clone();
	this.up0 = this.camera.up.clone();

	// events

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };


	// methods

	this.handleResize = function () {

		if ( this.domElement === document ) {

			this.screen.left = 0;
			this.screen.top = 0;
			this.screen.width = window.innerWidth;
			this.screen.height = window.innerHeight;

		} else {

			var box = this.domElement.getBoundingClientRect();
			// adjustments come from similar code in the jquery offset() function
			var d = this.domElement.ownerDocument.documentElement;
			this.screen.left = box.left + window.pageXOffset - d.clientLeft;
			this.screen.top = box.top + window.pageYOffset - d.clientTop;
			this.screen.width = box.width;
			this.screen.height = box.height;

		}

	};

	this.handleEvent = function ( event ) {

		if ( typeof this[ event.type ] == 'function' ) {

			this[ event.type ]( event );

		}

	};

	var getMouseOnScreen = ( function () {

		var vector = new THREE.Vector2();

		return function getMouseOnScreen( pageX, pageY ) {

			vector.set(
				( pageX - _this.screen.left ) / _this.screen.width,
				( pageY - _this.screen.top ) / _this.screen.height
			);

			return vector;

		};

	}() );

	var getMouseOnCircle = ( function () {

		var vector = new THREE.Vector2();

		return function getMouseOnCircle( pageX, pageY ) {

			vector.set(
				( ( pageX - _this.screen.width * 0.5 - _this.screen.left ) / ( _this.screen.width * 0.5 ) ),
				( ( _this.screen.height + 2 * ( _this.screen.top - pageY ) ) / _this.screen.width ) // screen.width intentional
			);

			return vector;

		};

	}() );

	this.rotateCamera = ( function() {

		var axis = new THREE.Vector3(),
			quaternion = new THREE.Quaternion(),
			eyeDirection = new THREE.Vector3(),
			objectUpDirection = new THREE.Vector3(),
			objectSidewaysDirection = new THREE.Vector3(),
			moveDirection = new THREE.Vector3(),
			angle;

		return function rotateCamera(delta) {
			var angleY = (_moveCurr.x - _movePrev.x);
			var angleX = (_moveCurr.y - _movePrev.y);


			/*_this.cameraYaw -= angleY * _this.rotateSpeed;
			_this.camera.rotation.y = _this.cameraYaw;
			_this.cameraPitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, _this.cameraPitch + angleX * _this.rotateSpeed));
			_this.camera.rotation.x = _this.cameraPitch;*/

			
			
			_this.camera.rotation.y -= angleY * _this.rotateSpeed * delta;
			_this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, _this.camera.rotation.x + angleX * _this.rotateSpeed * delta));
			

			_movePrev.copy( _moveCurr );

		};

	}() );


	/*this.zoomCamera = function () {

		var factor;

		if ( _state === STATE.TOUCH_ZOOM_PAN ) {

			factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
			_touchZoomDistanceStart = _touchZoomDistanceEnd;
			_eye.multiplyScalar( factor );

		} else {

			factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * _this.zoomSpeed;

			if ( factor !== 1.0 && factor > 0.0 ) {

				_eye.multiplyScalar( factor );

			}

			if ( _this.staticMoving ) {

				_zoomStart.copy( _zoomEnd );

			} else {

				_zoomStart.y += ( _zoomEnd.y - _zoomStart.y ) * this.dynamicDampingFactor;

			}

		}

	};*/

	/*this.panCamera = ( function() {

		var mouseChange = new THREE.Vector2(),
			objectUp = new THREE.Vector3(),
			pan = new THREE.Vector3();

		return function panCamera() {

			mouseChange.copy( _panEnd ).sub( _panStart );

			if ( mouseChange.lengthSq() ) {

				mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );

				pan.copy( _eye ).cross( _this.camera.up ).setLength( mouseChange.x );
				pan.add( objectUp.copy( _this.camera.up ).setLength( mouseChange.y ) );

				_this.camera.position.add( pan );
				_this.target.add( pan );

				if ( _this.staticMoving ) {

					_panStart.copy( _panEnd );

				} else {

					_panStart.add( mouseChange.subVectors( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor ) );

				}

			}

		};

	}() );/*/

	this.checkDistances = function () {

		if ( ! _this.noZoom || ! _this.noPan ) {

			if ( _eye.lengthSq() > _this.maxDistance * _this.maxDistance ) {

				_this.camera.position.addVectors( _this.target, _eye.setLength( _this.maxDistance ) );
				_zoomStart.copy( _zoomEnd );

			}

			if ( _eye.lengthSq() < _this.minDistance * _this.minDistance ) {

				_this.camera.position.addVectors( _this.target, _eye.setLength( _this.minDistance ) );
				_zoomStart.copy( _zoomEnd );

			}

		}

	};

	this.update = function (delta, mouselookMode) {
		if(!delta) delta = 0;

		_this.mouselookMode = mouselookMode || false;
		_eye.subVectors( _this.camera.position, _this.target );

		if ( ! _this.noRotate ) {

			_this.rotateCamera(delta);

		}

		/*if ( ! _this.noZoom ) {

			_this.zoomCamera();

		}

		if ( ! _this.noPan ) {

			//_this.panCamera();

		}*/

		//_this.object.position.addVectors( _this.target, _eye );

		_this.checkDistances();



		var moveMult = delta * _this.movementSpeed;
		var moveMultV = delta * _this.vMovementSpeed;
		//var rotMult = delta * this.rollSpeed;

		if(_this.moveVector.z != 0) _zoomSpeed = 0;
		var dx = _this.moveVector.x * moveMult;
		var dy = (_this.moveVector.y + _elevationSpeed) * moveMultV;
		var dz = (_this.moveVector.z + _zoomSpeed * 10) * moveMult;
		_zoomSpeed *= 0.95;
		_elevationSpeed *= 0.95;

		var c = Math.cos(_this.camera.rotation.y);
		var s = Math.sin(_this.camera.rotation.y);

		/*_this.object.translateX( dx );
		_this.object.translateY( dy );
		_this.object.translateZ( dz );*/
		_this.camera.position.x = Math.max(-100, Math.min(100, _this.camera.position.x + dx * c + dz * s));
		_this.camera.position.y = Math.max(-100, Math.min(100, _this.camera.position.y + dy));
		_this.camera.position.z = Math.max(-100, Math.min(100, _this.camera.position.z + dz * c - dx * s));
		//console.log(_this.object.rotation.x);

		/*_this.target.x += ( dx );
		_this.target.y += ( dy );
		_this.target.z += ( dz );*/

		//_this.object.lookAt( _this.target );
		
		//if(dx != 0 || dy != 0 || dz != 0){
			let pt = getClicked3DPoint(_this.lastMx, _this.lastMy);
			if(_this.eventCallbacks && _this.eventCallbacks.hover && pt) _this.eventCallbacks.hover(pt);
		//}

		if ( lastPosition.distanceToSquared( _this.camera.position ) > EPS ) {

			_this.dispatchEvent( changeEvent );

			lastPosition.copy( _this.camera.position );


		}

	};

	this.reset = function () {

		_state = STATE.NONE;
		_prevState = STATE.NONE;

		_this.target.copy( _this.target0 );
		_this.camera.position.copy( _this.position0 );
		_this.camera.up.copy( _this.up0 );

		_eye.subVectors( _this.camera.position, _this.target );

		_this.camera.lookAt( _this.target );

		_this.dispatchEvent( changeEvent );

		lastPosition.copy( _this.camera.position );

	};

	// listeners

	function keydown( event ) {

		//event.preventDefault();
		switch ( event.keyCode ) {
			
			case 16: /* shift */ 
				_this.movementSpeedMultiplier = .1; 
				_this.shiftMode = true;
				break;

			// case 87: case 188: case 38: /*W, comma*/ _this.moveState.forward = 1; break;
			// case 83: case 79: case 40: /*S, O*/ _this.moveState.back = 1; break;

			// case 65: case 37: /*A*/ _this.moveState.left = 1; break;
			// case 68: case 69: case 39: /*D, E*/ _this.moveState.right = 1; break;

			// case 82: case 80: /*R, P*/ _this.moveState.up = 1; break;
			// case 70: case 85: /*F, U*/ _this.moveState.down = 1; break;

		}

		_this.updateMovementVector();

	}

	function keyup( event ) {
		switch ( event.keyCode ) {

			case 16: /* shift */ 
				_this.movementSpeedMultiplier = 1;
				_this.shiftMode = false;
				break;

			// case 87: case 188: case 38: /*W*/ _this.moveState.forward = 0; break;
			// case 83: case 79: case 40: /*S*/ _this.moveState.back = 0; break;

			// case 65: case 37: /*A*/ _this.moveState.left = 0; break;
			// case 68: case 69: case 39: /*D*/ _this.moveState.right = 0; break;

			// case 82: case 80: /*R*/ _this.moveState.up = 0; break;
			// case 70: case 85: /*F*/ _this.moveState.down = 0; break;

			//case 38: /*up*/ _this.moveState.pitchUp = 0; break;
			//case 40: /*down*/ _this.moveState.pitchDown = 0; break;

			//case 37: /*left*/ _this.moveState.yawLeft = 0; break;
			//case 39: /*right*/ _this.moveState.yawRight = 0; break;

		}

		_this.updateMovementVector();
	}

	this.updateMovementVector = function() {

		let mouseX = 0;
		let mouseY = 0;
		if(_state == STATE.INTERACT && _this.mouselookMode){
			mouseX = (_dragTo.x - _dragStart.x) * 1;
			mouseY = (_dragTo.y - _dragStart.y) * 1;
			//console.log(mouseX);
		}

		_this.moveVector.x = ( - _this.moveState.left    + _this.moveState.right ) * 10 + mouseX;
		_this.moveVector.y = ( - _this.moveState.down    + _this.moveState.up ) * 10 + mouseY;
		_this.moveVector.z = ( - _this.moveState.forward + _this.moveState.back ) * 10;
		//console.log(mouseX);

		//console.log( 'move:', [ this.moveVector.x, this.moveVector.y, this.moveVector.z ] );

	};

	this.rayCaster = new THREE.Raycaster();

	function getClicked3DPoint(mx, my) {
		return; //Not needed in this application.
		let canvas = _this.domElement;
	
    	let mousePosition = new THREE.Vector2();
		//mousePosition.x = ((evt.clientX - _this.canvasPosition.left) / canvas.width) * 2 - 1;
		//mousePosition.y = -((evt.clientY - _this.canvasPosition.top) / canvas.height) * 2 + 1;
	
		mousePosition.x = ((mx - 0) / canvas.offsetWidth) * 2 - 1;
		mousePosition.y = -((my - 40) / canvas.offsetHeight) * 2 + 1;

		_this.rayCaster.setFromCamera(mousePosition, _this.camera);
		var objects = [_this.interactionPlane];
		for(let i = 0; i < _this.models.length; i++){
			objects.push(_this.models[i]);
		}
		var intersects = _this.rayCaster.intersectObjects(objects, true);
		if (intersects.length > 0){
			intersects[0].point.distance = intersects[0].distance;
			return intersects[0].point;
		}
	};

	function mousedown( event ) {
		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.NONE ) {

			_state = event.button;

		}
		var mouseC = getMouseOnCircle( event.pageX, event.pageY );
		_dragStart.copy(mouseC);
		if ( _state === STATE.ROTATE && ! _this.noRotate ) {

			_moveCurr.copy( mouseC );
			_movePrev.copy( _moveCurr );

		} 
		else if(_state === STATE.INTERACT){
			let pt = getClicked3DPoint(event.clientX, event.clientY);
			if(_this.eventCallbacks && _this.eventCallbacks.startInteraction) _this.eventCallbacks.startInteraction(pt);
		}
		/*else if ( _state === STATE.ZOOM && ! _this.noZoom ) {

			_zoomStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
			_zoomEnd.copy( _zoomStart );

		} else if ( _state === STATE.PAN && ! _this.noPan ) {

			_panStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
			_panEnd.copy( _panStart );

		}*/

		//document.addEventListener( 'mousemove', mousemove, false );
		document.addEventListener( 'mouseup', mouseup, false );

		_this.updateMovementVector(); 
		_this.dispatchEvent( startEvent );
	}

	function mousemove( event ) {
		//console.log("wow");
		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		let mouseC = getMouseOnCircle( event.pageX, event.pageY );
		_dragTo.copy(mouseC);
		if ( _state === STATE.ROTATE && ! _this.noRotate ) {

			_movePrev.copy( _moveCurr );
			_moveCurr.copy( mouseC );

		} 
		//else if(_state === STATE.INTERACT){
		_this.lastMx = event.clientX;
		_this.lastMy = event.clientY;
		let pt = getClicked3DPoint(event.clientX, event.clientY);
		if(_this.eventCallbacks && _this.eventCallbacks.hover) _this.eventCallbacks.hover(pt);

		//if(_state == STATE.INTERACT){}
			//}
		/*else if ( _state === STATE.ZOOM && ! _this.noZoom ) {

			_zoomEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

		} else if ( _state === STATE.PAN && ! _this.noPan ) {

			_panEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

		}*/
		_this.updateMovementVector();
	}

	function mouseup( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		if(_state === STATE.INTERACT){
			let pt = getClicked3DPoint(event.clientX, event.clientY);
			if(_this.eventCallbacks && _this.eventCallbacks.endInteraction) _this.eventCallbacks.endInteraction(pt);
		}
		
		_state = STATE.NONE;

		//document.removeEventListener( 'mousemove', mousemove );
		_this.updateMovementVector();
		document.removeEventListener( 'mouseup', mouseup );
		_this.dispatchEvent( endEvent );

	}

	function mousewheel( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();
		var dScale = 0;
		switch ( event.deltaMode ) {

			case 2:
				// Zoom in pages
				dScale = event.deltaY * 0.025;
				break;

			case 1:
				// Zoom in lines
				dScale = event.deltaY * 0.01;
				break;

			default:
				// undefined, 0, assume pixels
				dScale = event.deltaY * 0.00025;
				break;

		}
		if(_this.shiftMode){
			//dScale *= -1;
			_elevationSpeed -= dScale * 100;
			//if(Math.sign(_zoomSpeed) == Math.sign(event.deltaY)) _elevationSpeed *= 1.5;
		}
		else{
			_zoomSpeed += dScale * 10;
			if(Math.sign(_zoomSpeed) == Math.sign(event.deltaY)) _zoomSpeed *= 1.2;
		}
		

		_this.dispatchEvent( startEvent );
		_this.dispatchEvent( endEvent );

	}

	function touchstart( event ) {

		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				_state = STATE.TOUCH_ROTATE;
				_moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				_movePrev.copy( _moveCurr );
				break;

			default: // 2 or more
				_state = STATE.TOUCH_ZOOM_PAN;
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );

				var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
				var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
				_panStart.copy( getMouseOnScreen( x, y ) );
				_panEnd.copy( _panStart );
				break;

		}

		_this.dispatchEvent( startEvent );

	}

	function touchmove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1:
				_movePrev.copy( _moveCurr );
				_moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				break;

			default: // 2 or more
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );

				var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
				var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
				_panEnd.copy( getMouseOnScreen( x, y ) );
				break;

		}

	}

	function touchend( event ) {

		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 0:
				_state = STATE.NONE;
				break;

			case 1:
				_state = STATE.TOUCH_ROTATE;
				_moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				_movePrev.copy( _moveCurr );
				break;

		}

		_this.dispatchEvent( endEvent );

	}

	function contextmenu( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();

	}

	this.dispose = function() {

		this.domElement.removeEventListener( 'contextmenu', contextmenu, false );
		this.domElement.removeEventListener( 'mousedown', mousedown, false );
		this.domElement.removeEventListener( 'wheel', mousewheel, false );

		this.domElement.removeEventListener( 'touchstart', touchstart, false );
		this.domElement.removeEventListener( 'touchend', touchend, false );
		this.domElement.removeEventListener( 'touchmove', touchmove, false );

		document.removeEventListener( 'mousemove', mousemove, false );
		document.removeEventListener( 'mouseup', mouseup, false );

		window.removeEventListener( 'keydown', keydown, false );
		window.removeEventListener( 'keyup', keyup, false );

	};

	this.domElement.addEventListener( 'contextmenu', contextmenu, false );
	this.domElement.addEventListener( 'mousedown', mousedown, false );
	this.domElement.addEventListener( 'mousemove', mousemove, false );
	this.domElement.addEventListener( 'wheel', mousewheel, false );

	this.domElement.addEventListener( 'touchstart', touchstart, false );
	this.domElement.addEventListener( 'touchend', touchend, false );
	this.domElement.addEventListener( 'touchmove', touchmove, false );

	window.addEventListener( 'keydown', keydown, false );
	window.addEventListener( 'keyup', keyup, false );

	this.handleResize();

	// force an update at start
	this.update();

};

THREE.CustomControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.CustomControls.prototype.constructor = THREE.CustomControls;
