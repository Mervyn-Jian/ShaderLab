var glm = require('./gl-matrix');

function GLUtil(){
  this.name="opengl_toybox";
}

GLUtil.prototype.degToRad = function(degs){
  return degs * Math.PI / 180;
}

GLUtil.prototype.pushMatrix = function(mStack, matrix){
  var copy = glm.mat4.create();
  glm.mat4.copy(copy, matrix);
  mStack.push(copy);
}

GLUtil.prototype.popMatrix = function(mStack, matrix){
  if(mStack.length === 0) {
    throw "Invalid popMatrix!";
  }
  //matrix = mStack.pop();  //this line make data of mvMatrix are wrong. 
  glm.mat4.copy(matrix, mStack.pop());
}

GLUtil.prototype.setTexture = function(gl, tex){
  
  function powerOfTwo(x){
    return (x & (x-1)) == 0;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);

  if(powerOfTwo(tex.image.width) && powerOfTwo(tex.image.height)){
    // tri-linear filtering.
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  gl.bindTexture(gl.TEXTURE_2D, null);

}

export {GLUtil};