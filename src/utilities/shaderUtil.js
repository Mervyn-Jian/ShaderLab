function loadTextFile(url, callback) {
  var request = new XMLHttpRequest();
  request.open('GET', url, false);
  request.addEventListener('load', function() {
    callback(request.responseText);
  });
  request.send();
}

function getShader(gl, id) {
        
  var str = "";
  var _shader = null;
  loadTextFile(id, function(text) {
    str = text;

    if (id.indexOf("fs") !== -1) {
      _shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (id.indexOf("vs") !== -1) {
      _shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      _shader = null;
    }

    gl.shaderSource(_shader, str);
    gl.compileShader(_shader);

    if (!gl.getShaderParameter(_shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(_shader));
      _shader = null;
    }
console.log(str);
console.log(gl.getShaderInfoLog(_shader));
  });

  return _shader;
}

export {getShader}