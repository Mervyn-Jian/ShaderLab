import {getMesh} from '../../utilities/objUtil';
import p5 from '../../lib/p5/p5.min';

export default function sketch (p) {
  let theta = 0;
  let lr = 255;
  let lg = 255;
  let lb = 255;
  let model;
  let loadMesh = false;

  p.preload = function(){
    
  };

  p.setup = function(){

    p.createCanvas(800, 600, p.WEBGL);

    let loadMeshFuc = new Promise((resolve, reject) => {
      model = p.loadModel("/models/standford_dragon.obj", true, function(){
        loadMesh = true;
      });
    });

    /*let loadMeshFuc = new Promise((resolve, reject) => {
      
      getMesh(null, "/models/standford_dragon.obj",true,true,false, function(_mesh){

        model = new p5.Geometry();
        model.gid = _mesh.gid;

        for(var i=0; i<_mesh.vertices.length; i+=3){
          //vertices
          var vertex = new p5.Vector(parseFloat(_mesh.vertices[i]) * 100.0,
                                     parseFloat(_mesh.vertices[i+1] * 100.0),
                                     parseFloat(_mesh.vertices[i+2]) * 100.0);
          model.vertices.push(vertex);
          //normal
          var normal = new p5.Vector(parseFloat(_mesh.vertexNormals[i]),
                                     parseFloat(_mesh.vertexNormals[i+1]),
                                     parseFloat(_mesh.vertexNormals[i+2]));
          model.vertexNormals.push(normal);
        }

        //texture uv
        var uv_len;
        if(_mesh.textures.length != 0){
          uv_len = _mesh.textures.length;
        }else{
          uv_len = _mesh.vertices.length/3*2;
        }

        for(var i=0; i<uv_len; i+=2){
          //uv
          var uv;
          if(_mesh.textures.length != 0){
            uv = [ _mesh.textures[i], _mesh.textures[i+1] ];
          }else{
            uv = [0,0];
          }
          model.uvs.push(uv);
        }

        //face
        for(var i=0; i<_mesh.indices.length; i+=3){
          var face = [ _mesh.indices[i], _mesh.indices[i+1], _mesh.indices[i+2] ];
          model.faces.push(face);
        }

        loadMesh = true;
      });
    });
*/
    loadMeshFuc.then((successMessage) => {
      console.log("Yay! " + successMessage);
    });

  };

  p.ReactAttrHandler = function (attr) {
    if (attr.theta){
      theta = p.radians(attr.theta);
    }
  };

  p.draw = function(){
    
    p.background(0);
    //p.frameRate(30);
    p.stroke(255,255,255);
    p.strokeWeight(3);
    p.fill(lr, lg, lb);

    if(loadMesh){
      p.model(model);
      //console.log(model);
    }

    p.translate( 0, p.height/2, 0);
    p.line(0.0,0.0,0.0, 0.0,-120.0,0.0);
    p.translate(0,-120, 0);

    p.branch(120);
  };

  p.branch = function(h){
    h *= 0.66;
    if (h > 2) {
      p.push();    
      p.rotateZ(theta);  
      p.line(0, 0,0, 0, -h, 0); 
      p.translate(0, -h, 0);
      p.branch(h);       
      p.pop();     
      
      
      p.push();
      p.rotateZ(-theta);
      p.line(0,0,0, 0,-h,0);
      p.translate(0, -h, 0);
      p.branch(h);
      p.pop();
    }
  };

};
