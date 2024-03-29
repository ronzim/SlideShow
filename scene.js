var path = require("path");
var fs = require("fs-extra");
var TrackballControls = require(path.join(
  rootPath,
  "lib",
  "TrackballControls.js"
));

const dev = false;

var camera, scene, renderer, video, controls;
var stars = [];
var cameraOriginalPosition = new THREE.Vector3(0, 20, 90);

var initScene = function () {
  //make your video canvas
  video = document.createElement("video");
  var videocanvas = document.createElement("canvas");
  var videocanvasctx = videocanvas.getContext("2d");

  //================================//
  //====== SCENE SETUP =============//
  //================================//

  renderer = new THREE.WebGLRenderer({ antialias: true });
  document.getElementById("app-container").appendChild(renderer.domElement);
  renderer.setClearColor(0x112233, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();

  // var camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 0.001, 1000 );

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.copy(cameraOriginalPosition);
  camera.lookAt(0, 0, 0);

  controls = new THREE.TrackballControls(camera, renderer.domElement);

  var light = new THREE.AmbientLight(0x555555, 1);
  scene.add(light);
  var directionalLight = new THREE.PointLight(0xffffff, 1);
  directionalLight.position.set(0, 50, 50);
  scene.add(directionalLight);

  if (dev) {
    var gridPlane = new THREE.GridHelper(300, 50);
    var gridPlaneAxis = new THREE.AxisHelper(20);
    scene.add(gridPlane);
    scene.add(gridPlaneAxis);
  }
};

function populateScene() {
  //================================//
  //====== SCENE CONTENT ===========//
  //================================//

  var slides = fs.readdirSync("./slides/").filter(f => {
    return f.includes(".jpg") || f.includes(".JPG") || f.includes(".png");
  });
  var numberOfSlides = slides.length;
  console.log(slides);
  var baseName = slides[0].split("-")[0];
  // var numberOfSlides = 23;
  // var slides = new Array(numberOfSlides)
  //   .fill(0)
  //   .map((a, n) => baseName + (n + 1));
  var videos = new Array(numberOfSlides);
  videos[22] = "./Video.mp4";
  var planeDim = new THREE.Vector3(16, 9, 0);
  var videoPlaying;

  // create a circle and sample to obtain plane positions
  var geometry = new THREE.CircleGeometry(50, numberOfSlides);
  var material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4,
    wireframe: true
  });
  var circle = new THREE.Mesh(geometry, material);
  circle.geometry.rotateX(-Math.PI / 2);
  circle.geometry.rotateY(-Math.PI / 2);
  var slidePos = circle.geometry.vertices;

  if (dev) {
    scene.add(circle);

    circle.geometry.vertices.forEach(function (v, i) {
      var color = i == 1 ? "red" : "green";
      var ball = new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 8),
        new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.4
        })
      );
      ball.position.copy(v);
      scene.add(ball);
    });
  }

  // add slides
  slides.forEach((s, i) => addSlide(s, i));

  function addSlide(name, i) {
    console.log("addSlide", name, i);

    if (!fs.existsSync("./slides/" + name)) {
      console.warn("slide not found", name);
      return;
    }

    var img = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      map: THREE.ImageUtils.loadTexture("./slides/" + name),
      // wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    img.map.anisotropy = renderer.getMaxAnisotropy();
    img.map.wrapS = THREE.RepeatWrapping;
    img.map.wrapT = THREE.RepeatWrapping;
    img.map.magFilter = THREE.LinearFilter;
    img.map.minFilter = THREE.LinearFilter;
    img.map.needsUpdate = true; //ADDED
    // console.log(img.map)

    // plane
    var plane = new THREE.Mesh(
      new THREE.PlaneGeometry(planeDim.x, planeDim.y, planeDim.x, planeDim.y),
      img
    );
    plane.name = name;
    plane.position.copy(slidePos[i + 1]);
    scene.add(plane);
  }

  // title

  var title;
  var loader = new THREE.FontLoader();

  loader.load("./resources/optimer_regular.typeface.json", function (font) {
    var geometry = new THREE.TextGeometry("3D Visualization", {
      font: font,
      size: 5,
      height: 3,
      curveSegments: 15
      // bevelEnabled: true,
      // bevelThickness: 10,
      // bevelSize: 8,
      // bevelSegments: 5
    });

    var titleMaterial = new THREE.MeshPhongMaterial({ color: "yellow" });
    title = new THREE.Mesh(geometry, titleMaterial);
    geometry.computeBoundingBox();
    var center = geometry.boundingBox.getCenter();
    geometry.applyMatrix(
      new THREE.Matrix4().makeTranslation(-center.x, 5, -center.z)
    );
    scene.add(title);
  });

  console.log(scene);

  function spawnVideo(slideNumber) {
    video.src = videos[slideNumber];

    if (!video.src) {
      console.warn("no video to play");
      return;
    }

    video.load();

    //set its size
    videocanvas.width = planeDim.x * 100;
    videocanvas.height = planeDim.y * 100;

    //draw a black rectangle so that your spheres don't start out transparent
    videocanvasctx.fillStyle = "#000000";
    videocanvasctx.fillRect(0, 0, planeDim.x * 100, planeDim.y * 100);

    //add canvas to new texture
    var texture = new THREE.Texture(videocanvas);

    var img = new THREE.MeshBasicMaterial({ map: texture });
    img.map.anisotropy = renderer.getMaxAnisotropy();
    img.map.wrapS = THREE.RepeatWrapping;
    img.map.wrapT = THREE.RepeatWrapping;
    img.map.magFilter = THREE.LinearFilter;
    img.map.minFilter = THREE.LinearFilter;
    img.map.needsUpdate = true;

    // plane as screen
    var plane = new THREE.Mesh(
      new THREE.PlaneGeometry(
        planeDim.x / 1.5,
        planeDim.y / 1.5,
        planeDim.x / 1.5,
        planeDim.y / 1.5
      ),
      img
    );
    plane.name = "videoScreen";
    plane.position.copy(slidePos[slideNumber]);
    plane.position.z += 0.2;
    scene.add(plane);

    videoPlaying = true;
    video.play();
  }

  function closeVideo() {
    videoPlaying = false;
    var videoScreen = scene.getObjectByName("videoScreen");
    scene.remove(videoScreen);
  }

  //================================//
  //======= EVENTS =================//
  //================================//

  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  var selected = null;
  var cameraTargetPosition = null;
  var controlsTargetPosition = null;
  var fixedView = false;

  function onmousemove(event) {
    selected = null;

    scene.children.forEach(function (child) {
      if (child.name.includes(baseName)) {
        child.material.transparent = true;
        child.material.opacity = 0.5;
      }
    });

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(scene.children);

    var int = intersects.shift();
    if (int && int.object.name.includes(baseName)) {
      selected = int.object;
      int.object.material.transparent = false;
    }
  }

  function onmouseup(event) {
    console.log("onmouseup", selected);
    if (selected && event.which === 1) {
      // if (selected.name.includes('22')){
      //   video.play()
      // };

      cameraTargetPosition = new THREE.Vector3(
        selected.position.x,
        selected.position.y,
        selected.position.z + 7.5
      );
      controlsTargetPosition = selected.position;
      fixedViewOn();
    } else if (event.which === 3) {
      // camera.up = new THREE.Vector3(0,1,0);
      // camera.position.set(50,50,50)
      // control.target.set(0,0,0);
      // camera.updateMatrix()
      fixedViewOff();
    }
  }

  function onkeydown(event) {
    console.log(event);
    // next slide
    if (fixedView && event.key == "ArrowRight") {
      var currentSlideNumber = selected.name.split("-")[1];
      moveToSlide(++currentSlideNumber);
    }
    // previous slide
    else if (fixedView && event.key == "ArrowLeft") {
      var currentSlideNumber = selected.name.split("-")[1];
      moveToSlide(--currentSlideNumber);
    }
    // start/stop video
    else if (fixedView && event.key == " ") {
      if (!videoPlaying) {
        var slideN = selected.name.split("-")[1];
        spawnVideo(slideN);
      } else {
        closeVideo();
      }
    }
  }

  document.onmousemove = onmousemove;
  document.onmouseup = onmouseup;
  document.onkeydown = onkeydown;

  function moveToSlide(slideN) {
    console.log(slideN);
    var next_selected = scene.getObjectByName(baseName + slideN);
    if (next_selected) {
      fixedViewOff();
      selected = next_selected;
      fixedViewOn();
      setTimeout(function () {
        cameraTargetPosition = new THREE.Vector3(
          selected.position.x,
          selected.position.y,
          selected.position.z + 7.5
        );
        controlsTargetPosition = selected.position;
      }, 0);
    }
  }

  function fixedViewOn() {
    fixedView = true;
    document.onmousemove = null;
    scene.children.forEach(function (child) {
      if (child.name.includes(baseName) && child.name !== selected.name) {
        // child.material.color = new THREE.Color('white');
        child.visible = false;
      }
    });
    selected.material.transparent = false;
    console.log(selected.material);
  }

  function fixedViewOff() {
    fixedView = false;
    document.onmousemove = onmousemove;
    scene.children.forEach(function (child) {
      if (child.name.includes(baseName)) {
        // child.material.color = new THREE.Color('white');
        child.visible = true;
        child.material.transparent = true;
      }
    });

    console.log("cameraTargetPosition", cameraTargetPosition);
    cameraTargetPosition = new THREE.Vector3().copy(cameraOriginalPosition);
    controlsTargetPosition = new THREE.Vector3(0, 0, 0);

    setTimeout(function () {
      console.log("cameraTargetPosition", null);
      cameraTargetPosition = null;
      controlsTargetPosition = null;
    }, 1000);
  }

  function moveCamera() {
    if (cameraTargetPosition) {
      camera.up = new THREE.Vector3(0, 1, 0);
      camera.position.lerp(cameraTargetPosition, 0.1);
      controls.target.lerp(controlsTargetPosition, 0.1);
    }
  }

  function rotateTitle() {
    if (title) {
      title.matrixAutoUpdate = false;
      title.position.set(0, 0, 0);
      title.rotateY(0.01);
      // title.updateMatrix();
      var center = title.geometry.boundingBox.getCenter();
      title.position.set(-center.x, 20, -center.z);
      // title.updateMatrix();
      title.matrixAutoUpdate = true;
    }
  }

  //================================//
  //=======RENDER FUNCTION==========//
  //================================//

  var theta = 0;
  var radius = 1.0;

  function render() {
    //check for vid data
    if (video.readyState === video.HAVE_ENOUGH_DATA && videoPlaying) {
      //draw video to canvas starting from upper left corner
      videocanvasctx.drawImage(video, 0, 0);
      //tell texture object it needs to be updated
      scene.getObjectByName("videoScreen").material.map.needsUpdate = true;
    }

    requestAnimationFrame(animate);
    controls.update(0.5);
    renderer.render(scene, camera);
  }

  function animate() {
    animateStars();
    rotateTitle();
    moveCamera();
    render();
  }

  render();
}

function addSphere() {
  // The loop will move from z position of -1000 to z position 1000, adding a random particle at each position.
  for (var z = -1000; z < 1000; z += 20) {
    // Make a sphere (exactly the same as before).
    var geometry = new THREE.SphereGeometry(0.5, 32, 32);
    var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var sphere = new THREE.Mesh(geometry, material);

    // This time we give the sphere random x and y positions between -500 and 500
    sphere.position.x = Math.random() * 1000 - 500;
    sphere.position.y = Math.random() * 1000 - 500;

    // Then set the z position to where it is in the loop (distance of camera)
    sphere.position.z = z;

    // scale it up a bit
    sphere.scale.x = sphere.scale.y = 2;

    //add the sphere to the scene
    scene.add(sphere);

    //finally push it to the stars array
    stars.push(sphere);
  }
}

function animateStars() {
  // loop through each star
  for (var i = 0; i < stars.length; i++) {
    star = stars[i];

    // and move it forward dependent on the mouseY position.
    star.position.z += i / 10;

    // if the particle is too close move it to the back
    if (star.position.z > 1000) star.position.z -= 2000;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  console.log("resize");
}

window.addEventListener("resize", onWindowResize, false);

exports.render = function () {
  initScene();
  addSphere();
  populateScene();
};
