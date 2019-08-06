var glm = require('./gl-matrix');

function camera(){
  this.up = glm.vec3.create();
  this.right = glm.vec3.create();
  this.forward = glm.vec3.create();
  this.eye = glm.vec3.create();

  glm.vec3.set(this.eye, 0.0, 0.0, -3.0);
  glm.vec3.set(this.up , 0.0, 1.0,  0.0);
  glm.vec3.set(this.right, 1.0, 0.0,  0.0);

  glm.vec3.cross(this.forward, this.up, this.right);
  glm.vec3.normalize(this.forward, this.forward);
}

camera.prototype.set = function(eye, up, right){
  glm.vec3.set(this.eye, eye[0], eye[1], eye[2]);
  glm.vec3.set(this.up , up[0], up[1], up[2]);
  glm.vec3.set(this.right, right[0], right[1], right[2]);

  glm.vec3.cross(this.forward, this.up, this.right);
  glm.vec3.normalize(this.forward, this.forward);
}

camera.prototype.reset = function(){
  glm.vec3.set(this.eye, 0.0, 0.0, -3.0);
  glm.vec3.set(this.up , 0.0, 1.0,  0.0);
  glm.vec3.set(this.right, 1.0, 0.0,  0.0);

  glm.vec3.cross(this.forward, this.up, this.right);
  glm.vec3.normalize(this.forward, this.forward);
}

export {camera}