var objLoader = require('./webgl-obj-loader');

var divideZeroThre = 0.0000001;

function loadTextFile(url, callback) {
  var request = new XMLHttpRequest();
  request.open('GET', url, false);
  request.addEventListener('load', function() {
    callback(request.responseText);
  });
  request.send();
}

function getMesh(gl, id, normalize=true, calNormal=false, isGLobj=true) {
        
  var str = "";
  var _mesh = null;

  var successCallback = arguments[5];

  loadTextFile(id, function(text) {
    str = text;

    _mesh = new objLoader.Mesh(str);

    //normalize vertex and normal data
    if(normalize){
      _nomalize(_mesh);
    }
    
    // check normal data
    if(calNormal === true || isNaN(_mesh.vertexNormals[0]) ){
      _calculateNormal(_mesh);
    }
    
    if(isGLobj){
      objLoader.initMeshBuffers(gl, _mesh);
    }else{
      _mesh.gid = id + '|' + normalize;
    }

    if (typeof successCallback === 'function') {
      successCallback(_mesh);
    }

  });

  return _mesh;
}

function _nomalize(_mesh){
  
  var x_min = Number.MAX_VALUE;
  var y_min = Number.MAX_VALUE;
  var z_min = Number.MAX_VALUE;

  var x_max = Number.MIN_VALUE;
  var y_max = Number.MIN_VALUE;
  var z_max = Number.MIN_VALUE;

  //to find bounding box
  for(var i=0; i<_mesh.vertices.length; i+=3){
    var x = _mesh.vertices[i  ];
    var y = _mesh.vertices[i+1];
    var z = _mesh.vertices[i+2];

    if(x < x_min) x_min = x;
    if(x > x_max) x_max = x;

    if(y < y_min) y_min = y;
    if(y > y_max) y_max = y;

    if(z < z_min) z_min = z;
    if(z > z_max) z_max = z;
  }

  //to normalize into -1~1
  var x_mid = (x_max+x_min)/2;
  var y_mid = (y_max+y_min)/2;
  var z_mid = (z_max+z_min)/2;
  var x_len = (x_max-x_min)/2;
  var y_len = (y_max-y_min)/2;
  var z_len = (z_max-z_min)/2;
  var len;

  //to find scale ratio
  if(x_len > y_len) len = x_len;
  else              len = y_len;

  if(z_len > len)   len = z_len;

  for(var i=0; i<_mesh.vertices.length; i+=3){

     _mesh.vertices[i  ] = (_mesh.vertices[i  ] - x_mid ) / len;
     _mesh.vertices[i+1] = (_mesh.vertices[i+1] - y_mid ) / len;
     _mesh.vertices[i+2] = (_mesh.vertices[i+2] - z_mid ) / len;
  }
}

function _calculateNormal(_mesh){
  _mesh.vertexNormals.length = _mesh.vertices.length;
  _mesh.vertexNormals.fill(0.0);

  var len;
  for(var i=0; i<_mesh.indices.length; i+=3){
    var p1 =[];
    var p2 =[];
    var p3 =[];
    var idx1 = _mesh.indices[i   ];
    var idx2 = _mesh.indices[i +1];
    var idx3 = _mesh.indices[i +2];

    p1.push(_mesh.vertices[idx1*3   ]);
    p1.push(_mesh.vertices[idx1*3 +1]);
    p1.push(_mesh.vertices[idx1*3 +2]);

    p2.push(_mesh.vertices[idx2*3   ]);
    p2.push(_mesh.vertices[idx2*3 +1]);
    p2.push(_mesh.vertices[idx2*3 +2]);

    p3.push(_mesh.vertices[idx3*3   ]);
    p3.push(_mesh.vertices[idx3*3 +1]);
    p3.push(_mesh.vertices[idx3*3 +2]);
    
    //cross normal (counterclock wise)
    var vec1 =[];
    var vec2 =[];
    var normal =[];

    vec1.push(p3[0]-p1[0]);
    vec1.push(p3[1]-p1[1]);
    vec1.push(p3[2]-p1[2]);

    vec2.push(p2[0]-p1[0]);
    vec2.push(p2[1]-p1[1]);
    vec2.push(p2[2]-p1[2]);

    normal.push(vec1[1]*vec2[2] - vec1[2]*vec2[1]);
    normal.push(vec1[2]*vec2[0] - vec1[0]*vec2[2]);
    normal.push(vec1[0]*vec2[1] - vec1[1]*vec2[0]);

    //assign normalized value
    len = Math.sqrt( Math.pow(normal[0], 2) + Math.pow(normal[1], 2) + Math.pow(normal[2], 2) );
    len += divideZeroThre; //to prevent dividing by zero
    normal[0] /= len;
    normal[1] /= len;
    normal[2] /= len;

    //add face nomal
    _mesh.vertexNormals[idx1*3   ] += +normal[0];
    _mesh.vertexNormals[idx1*3 +1] += +normal[1];
    _mesh.vertexNormals[idx1*3 +2] += +normal[2];

    _mesh.vertexNormals[idx2*3   ] += +normal[0];
    _mesh.vertexNormals[idx2*3 +1] += +normal[1];
    _mesh.vertexNormals[idx2*3 +2] += +normal[2];

    _mesh.vertexNormals[idx3*3   ] += +normal[0];
    _mesh.vertexNormals[idx3*3 +1] += +normal[1];
    _mesh.vertexNormals[idx3*3 +2] += +normal[2];

    //normalize again
    len = Math.sqrt( Math.pow(_mesh.vertexNormals[idx1*3], 2) + Math.pow(_mesh.vertexNormals[idx1*3 +1], 2) + Math.pow(_mesh.vertexNormals[idx1*3 +2], 2) );
    len += divideZeroThre; //to prevent dividing by zero
    _mesh.vertexNormals[idx1*3   ] /= len;
    _mesh.vertexNormals[idx1*3 +1] /= len;
    _mesh.vertexNormals[idx1*3 +2] /= len;

    len = Math.sqrt( Math.pow(_mesh.vertexNormals[idx2*3], 2) + Math.pow(_mesh.vertexNormals[idx2*3 +1], 2) + Math.pow(_mesh.vertexNormals[idx2*3 +2], 2) );
    len += divideZeroThre; //to prevent dividing by zero
    _mesh.vertexNormals[idx2*3   ] /= len;
    _mesh.vertexNormals[idx2*3 +1] /= len;
    _mesh.vertexNormals[idx2*3 +2] /= len;

    len = Math.sqrt( Math.pow(_mesh.vertexNormals[idx3*3], 2) + Math.pow(_mesh.vertexNormals[idx3*3 +1], 2) + Math.pow(_mesh.vertexNormals[idx3*3 +2], 2) );
    len += divideZeroThre; //to prevent dividing by zero
    _mesh.vertexNormals[idx3*3   ] /= len;
    _mesh.vertexNormals[idx3*3 +1] /= len;
    _mesh.vertexNormals[idx3*3 +2] /= len;

  }
}

function getPlane(gl){
  var vertexPositionBuffer = null;
  var vertexNormalBuffer = null;
  var textureCoordBuffer = null;
  var indexBuffer = null;

  var _mesh = {};
  _mesh.normalBuffer = null;
  _mesh.textureBuffer = null;
  _mesh.vertexBuffer = null;
  _mesh.indexBuffer = null;

  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var vertices = [
    -1.0, -1.0,  0.0,
     1.0, -1.0,  0.0,
     1.0,  1.0,  0.0,
    -1.0,  1.0,  0.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numItems = 4;

  vertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  var vertexNormals = [
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
  vertexNormalBuffer.itemSize = 3;
  vertexNormalBuffer.numItems = 4;

  textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  var textureCoords = [
     0.0, 0.0,
     1.0, 0.0,
     1.0, 1.0,
     0.0, 1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
  textureCoordBuffer.itemSize = 2;
  textureCoordBuffer.numItems = 4;

  indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  var indices = [
    0, 1, 2,      0, 2, 3,   
  ];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  indexBuffer.itemSize = 1;
  indexBuffer.numItems = 6;

  _mesh.normalBuffer = vertexNormalBuffer;
  _mesh.textureBuffer = textureCoordBuffer;
  _mesh.vertexBuffer = vertexPositionBuffer;
  _mesh.indexBuffer = indexBuffer;

  return _mesh;
}

function getCube(gl){
  var cubeVertexPositionBuffer = null;
  var cubeVertexNormalBuffer = null;
  var cubeVertexTextureCoordBuffer = null;
  var cubeVertexIndexBuffer = null;

  var _mesh = {};
  _mesh.normalBuffer = null;
  _mesh.textureBuffer = null;
  _mesh.vertexBuffer = null;
  _mesh.indexBuffer = null;

  cubeVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  var vertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  cubeVertexPositionBuffer.itemSize = 3;
  cubeVertexPositionBuffer.numItems = 24;

  cubeVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
  var vertexNormals = [
    // Front face
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,

    // Back face
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,

    // Top face
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,

    // Bottom face
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,

    // Right face
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,

    // Left face
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
  cubeVertexNormalBuffer.itemSize = 3;
  cubeVertexNormalBuffer.numItems = 24;

  cubeVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  var textureCoords = [
    // Front face
     0.0, 0.0,
     1.0, 0.0,
     1.0, 1.0,
     0.0, 1.0,

     // Back face
     1.0, 0.0,
     1.0, 1.0,
     0.0, 1.0,
     0.0, 0.0,

     // Top face
     0.0, 1.0,
     0.0, 0.0,
     1.0, 0.0,
     1.0, 1.0,

     // Bottom face
     1.0, 1.0,
     0.0, 1.0,
     0.0, 0.0,
     1.0, 0.0,

     // Right face
     1.0, 0.0,
     1.0, 1.0,
     0.0, 1.0,
     0.0, 0.0,

     // Left face
     0.0, 0.0,
     1.0, 0.0,
     1.0, 1.0,
     0.0, 1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
  cubeVertexTextureCoordBuffer.itemSize = 2;
  cubeVertexTextureCoordBuffer.numItems = 24;

  cubeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  var cubeVertexIndices = [
    0, 1, 2,      0, 2, 3,    // Front face
    4, 5, 6,      4, 6, 7,    // Back face
    8, 9, 10,     8, 10, 11,  // Top face
    12, 13, 14,   12, 14, 15, // Bottom face
    16, 17, 18,   16, 18, 19, // Right face
    20, 21, 22,   20, 22, 23  // Left face
  ];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
  cubeVertexIndexBuffer.itemSize = 1;
  cubeVertexIndexBuffer.numItems = 36;

  _mesh.normalBuffer = cubeVertexNormalBuffer;
  _mesh.textureBuffer = cubeVertexTextureCoordBuffer;
  _mesh.vertexBuffer = cubeVertexPositionBuffer;
  _mesh.indexBuffer = cubeVertexIndexBuffer;

  return _mesh;
}

function getSphere(gl, latitude=30, longitude=30){
  var VertexPositionBuffer = null;
  var VertexNormalBuffer = null;
  var VertexTextureCoordBuffer = null;
  var VertexIndexBuffer = null;

  var _mesh = {};
  _mesh.normalBuffer = null;
  _mesh.textureBuffer = null;
  _mesh.vertexBuffer = null;
  _mesh.indexBuffer = null;

  var latitudeBands = latitude;
  var longitudeBands = longitude;
  var radius = 1;

  var vertexPositionData = [];
  var normalData = [];
  var textureCoordData = [];
  for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
    var theta = latNumber * Math.PI / latitudeBands;
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);

    for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
      var phi = longNumber * 2 * Math.PI / longitudeBands;
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);

      var x = cosPhi * sinTheta;
      var y = cosTheta;
      var z = sinPhi * sinTheta;
      var u = 1 - (longNumber / longitudeBands);
      var v = 1 - (latNumber / latitudeBands);

      normalData.push(x);
      normalData.push(y);
      normalData.push(z);
      textureCoordData.push(u);
      textureCoordData.push(v);
      vertexPositionData.push(radius * x);
      vertexPositionData.push(radius * y);
      vertexPositionData.push(radius * z);
    }
  }

  var indexData = [];
  for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
    for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
      var first = (latNumber * (longitudeBands + 1)) + longNumber;
      var second = first + longitudeBands + 1;
      indexData.push(first);
      indexData.push(second);
      indexData.push(first + 1);

      indexData.push(second);
      indexData.push(second + 1);
      indexData.push(first + 1);
   }
  }

  VertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, VertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
  VertexNormalBuffer.itemSize = 3;
  VertexNormalBuffer.numItems = normalData.length / 3;

  VertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, VertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
  VertexTextureCoordBuffer.itemSize = 2;
  VertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

  VertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, VertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
  VertexPositionBuffer.itemSize = 3;
  VertexPositionBuffer.numItems = vertexPositionData.length / 3;

  VertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, VertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STREAM_DRAW);
  VertexIndexBuffer.itemSize = 1;
  VertexIndexBuffer.numItems = indexData.length;

  _mesh.normalBuffer = VertexNormalBuffer;
  _mesh.textureBuffer = VertexTextureCoordBuffer;
  _mesh.vertexBuffer = VertexPositionBuffer;
  _mesh.indexBuffer = VertexIndexBuffer;

  return _mesh;
}

export {getMesh, getCube, getSphere, getPlane}