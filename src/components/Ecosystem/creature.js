var glm = require('./gl-matrix');

var boundary = 400.0;

function Creature(maxspeed, mass){
  this.name="Creature_base";
  this.position = glm.vec3.create();
  this.velocity = glm.vec3.create();
  this.acceleration = glm.vec3.create();
  this.maxspeed = maxspeed;
  this.mass = mass;

  glm.vec3.set(this.poition, boundary*Math.random(), boundary*Math.random(), boundary*Math.random());
  glm.vec3.set(this.velocity,0.0,0.0,0.0);
}

Creature.prototype.update = function(){
	/*
  PVector mouse = new PVector(mouseX,mouseY);
    PVector dir = PVector.sub(mouse,location);

    dir.normalize();

    dir.mult(0.5);
    acceleration = dir;
 

    velocity.add(acceleration);
    velocity.limit(topspeed);
    location.add(velocity);
    */

}

Creature.prototype.applyForce = function(force){
	this.acceleration = force;
}

Creature.prototype.render = function() {
  /*
  stroke(0);
  fill(175);
  ellipse(location.x,location.y,16,16); */
}

Creature.prototype.boundaryCase = function(xr, yr, zr){
  var x = this.position[0];
  var y = this.position[1];
  var z = this.position[2];

  if (x > xr) {
    this.position[0] = xr;
  }else if (x < -xr) {
    this.position[0] = -xr;
  }
 
  if (y > yr) {
    this.position[1] = yr;
  }else if (y < -yr) {
    this.position[1] = -yr;
  }

  if (z > zr) {
    this.position[2] = zr;
  }else if (z < -zr) {
    this.position[2] = -zr;
  }
}

export {Creature};