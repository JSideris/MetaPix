/*
This is a NPM-ready modification of [CSG-2-Three converter](https://gist.github.com/chandlerprall/1590424) by [Chandler Prall](https://github.com/chandlerprall)

It enables conversion of ThreeJS models into CSG objects and back.

Objects created by this converter can then be manipulated via any CSG library.

Provided under the MIT License
*/
THREE_Vector3 = THREE.Vector3;
THREE_Mesh = THREE.Mesh;
THREE_Geometry = THREE.Geometry;
THREE_Face3 = THREE.Face3;
THREE_Face4 = THREE.Face4;

/**
* Converts a ThreeJS 3D object into a CSG solid
* @param {ThreeJS_Mesh} three_model ThreeJS Mesh (or Geometry) which needs to be converted
* @returns {CSG_solid}
*/
function toCSG ( three_model ) {
var i, geometry, polygons, vertices;

 if ( !CSG ) {
	 throw 'CSG library not loaded. Please get a copy from https://github.com/evanw/csg.js';
 }

if ( three_model instanceof THREE_Mesh ) {
	geometry = new THREE_Geometry();
	geometry.mergeMesh(three_model);
} else if ( three_model instanceof THREE_Geometry ) {
	geometry = three_model;
} else {
	throw 'Model type not supported.';
}

var polygons = [];
for ( i = 0; i < geometry.faces.length; i++ ) {
	if ( geometry.faces[i] instanceof THREE_Face3 ) {
		polygons.push( ThreeFace3_to_CsgPoly(geometry.faces[i], geometry.vertices) );
	} else if ( geometry.faces[i] instanceof THREE_Face4 ) {
		// [ThreeFace4_to_CsgPoly] return an array
		polygons.push.apply(polygons,  ThreeFace4_to_CsgPoly(geometry.faces[i], geometry.vertices) );
	} else {
		throw 'Model contains unsupported face.';
	}
}

return CSG.fromPolygons( polygons );
}

function ThreeVertex2CsgVertex(threeVertex) {
return(new CSG.Vertex(new CSG.Vector(threeVertex.x, threeVertex.y, threeVertex.z)));
}

function ThreeFace3_to_CsgPoly(face, vertices) {
return(new CSG.Polygon([
	ThreeVertex2CsgVertex(vertices[face.a]),
	ThreeVertex2CsgVertex(vertices[face.b]),
	ThreeVertex2CsgVertex(vertices[face.c])]));
}

function ThreeFace4_to_CsgPoly(face, vertices) {
return([
	new CSG.Polygon([
		ThreeVertex2CsgVertex(vertices[face.a]),
		ThreeVertex2CsgVertex(vertices[face.b]),
		ThreeVertex2CsgVertex(vertices[face.d])]),
	new CSG.Polygon([
		ThreeVertex2CsgVertex(vertices[face.b]),
		ThreeVertex2CsgVertex(vertices[face.c]),
		ThreeVertex2CsgVertex(vertices[face.d])])
]);
}

/**
* Converts a CSG solid (3d object) into regular ThreeJS geometry
* @param {CSG_solid} csg_model = CSG solid to be converted
* @returns {THREE_Geometry}
*/
function fromCSG( csg_model ) {
var i, j, vertices, face,
	three_geometry = new THREE_Geometry( ),
	polygons = csg_model.toPolygons( );

if ( !CSG ) {
	throw 'CSG library not loaded. Please get a copy from https://github.com/evanw/csg.js';
}

for ( i = 0; i < polygons.length; i++ ) {
	
	// Vertices
	vertices = [];
	for ( j = 0; j < polygons[i].vertices.length; j++ ) {
		vertices.push( _getGeometryVertice( three_geometry, polygons[i].vertices[j].pos ) );
	}
	if ( vertices[0] === vertices[vertices.length - 1] ) {
		vertices.pop( );
	}
	
	for (var j = 2; j < vertices.length; j++) {
		face = new THREE_Face3( vertices[0], vertices[j-1], vertices[j], new THREE_Vector3( ).copy( polygons[i].plane.normal ) );
		three_geometry.faces.push( face );
		//three_geometry.faceVertexUvs[0].push( new THREE.UV( ) );
	}
}

three_geometry.computeBoundingBox();

return three_geometry;
}

function _getGeometryVertice ( geometry, vertice_position ) {
geometry.vertices.push(new THREE_Vector3( vertice_position.x, vertice_position.y, vertice_position.z ) );
return geometry.vertices.length - 1;
}


//export { toCSG, fromCSG }