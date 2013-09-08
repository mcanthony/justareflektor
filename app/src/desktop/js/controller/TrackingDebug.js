//===================
//
// Template test scene
//
//===================
window.trackingDebug = new (function() {

    //===================
    //
    // Variables
    //
    //===================
    var renderer,
        scene,
        camera,

        border = 6,
        planeScale = 1.0,
        allTextures = [],
        allPlanes = [],
        allCanvas = {},
        allFbos = {};


    //===================
    //
    // Preload all needed shaders and images
    //
    //===================
    this.getShadersToPreload = function(){return []}
    this.preload = function(loader) {}
    this.addGuiOptions = function(opt,range) {
        options = opt;
    }


    //===================
    //
    // Setup the 3d scene
    //
    //===================
    this.setup = function(_renderer,shadersTextByName) {
        renderer = _renderer;

        //the 2d video scene
        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera( 0, window.innerWidth , 0, window.innerHeight-105, -1000, 1000 );
        camera.position.set(0,0,1);
        camera.lookAt(new THREE.Vector3());
    }

    //===================
    //
    // Add Textures to the scene
    //
    //===================
    this.addTexture = function(tex,posx,posy) {
        var p = new THREE.Mesh(
            new THREE.PlaneGeometry( 256, 256, 1, 1 ),
            new THREE.MeshBasicMaterial( {color:0xffffff,map:tex,side:THREE.DoubleSide,transparent:true} )
        );
        p.scale.set(planeScale,-planeScale,planeScale);
        p.position.x = (border + 256 * planeScale) * (posx + 0.5); //position plane
        p.position.y = border*2 + (border + 256  * planeScale) * (posy + 0.5); //position plane


        scene.add(p);
        allPlanes.push(p);
        allTextures.push(tex);
    }

    //===================
    //
    // Add Textures to the scene
    //
    //===================
    this.addCanvasTexture = function(name,posx,posy) {


        var canvas = document.createElement('canvas');
        canvas.c = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 256;
        canvas.c.fillStyle = 'black';
        canvas.c.fillRect(0,0,256,256);
        canvas.c.fillStyle = 'white';

        var tex = new THREE.Texture(
            canvas,
            new THREE.UVMapping(),
            THREE.ClampToEdgeWrapping,
            THREE.ClampToEdgeWrapping,
            THREE.LinearFilter, THREE.LinearFilter,
            THREE.RGBAFormat, THREE.UnsignedByteType,1);
        tex.needsUpdate = true;
        tex.generateMipmaps = false
        canvas.texture = tex;

        var p = new THREE.Mesh(
            new THREE.PlaneGeometry( 256, 256, 1, 1 ),
            new THREE.MeshBasicMaterial( {color:0xffffff,map:tex,side:THREE.DoubleSide,transparent:false} )
        );
        p.scale.set(planeScale,-planeScale,planeScale);
        p.position.x = (border + 256 * planeScale) * (posx + 0.5); //position plane
        p.position.y = border*2 + (border + 256  * planeScale) * (posy + 0.5); //position plane

        scene.add(p);
        allPlanes.push(p);
        allTextures.push(tex);
        allCanvas[name] = canvas;
    }


    //===================
    //
    // Add a render target for rendering a 3d scene / phone
    //
    //===================
    this.addRenderTexture = function(name,posx,posy) {


        var fbo = new FramebufferWrapper(256,256,{
            minFilter:THREE.LinearFilter,
            magFilter:THREE.LinearFilter,
            format:THREE.RGBFormat,
            type:THREE.UnsignedByteType,
            camera:new THREE.PerspectiveCamera( 45, 1/1, 0.05, 1000 ),
            depthBuffer:false,
            stencilBuffer:false,
            premultiplyAlpha:false,
            generateMipmaps:false,
            backgroundColor:0x777777,
            backgroundAlpha:1,
            renderer:renderer
        });

        //add the phone
        fbo.camera.lookAt(new THREE.Vector3(0,0,1));
        fbo.phone = createDebugPhoneModel(1,false);
        fbo.phone.position.set(0,0,-500);
        fbo.scene.add(fbo.phone);


        fbo.camera.lookAt(new THREE.Vector3(0,0,1));
        fbo.phoneEst = createDebugPhoneModel(1,true);
        fbo.phoneEst.position.set(0,0,-500);


        //add a light
        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, 0, -1).normalize();
        directionalLight.lookAt(new THREE.Vector3( 0, 0, 1 ));
        fbo.scene.add(directionalLight);

        //
        // Add display plane
        //
        var p = new THREE.Mesh(
            new THREE.PlaneGeometry( 256, 256, 1, 1 ),
            new THREE.MeshBasicMaterial( {color:0xffffff,map:fbo.texture,side:THREE.DoubleSide,transparent:false} )
        );
        p.scale.set(planeScale,-planeScale,planeScale);
        p.position.x = (border + 256 * planeScale) * (posx + 0.5); //position plane
        p.position.y = border*2 + (border + 256  * planeScale) * (posy + 0.5); //position plane

        scene.add(p);
        allPlanes.push(p);
        allTextures.push(fbo.texture);
        allFbos[name] = fbo;
        fbo.render();
    }


    //
    // Create a phone made of two cubes and an axis helper
    //
    function createDebugPhoneModel(modelScale,isGhost) {
        var geometryPhone = new THREE.CubeGeometry(37 * modelScale, 70 * modelScale, 10 * modelScale);
        var geometryScreen = new THREE.CubeGeometry(31 * modelScale, 55 * modelScale, 1 * modelScale);

        isGhost = isGhost?true:false;
        var materialBody = new THREE.MeshLambertMaterial({color: 0x44ffaa,transparent:true,depthTest:true,depthWrite:true});
        var materialScreen = new THREE.MeshLambertMaterial({color: 0x333333,transparent:true,depthTest:true,depthWrite:true});
        if (isGhost) {
            materialBody.opacity = materialScreen.opacity = 0.25;
            materialBody.color = new THREE.Color(0xff0000);
        }

        var meshPhone = new THREE.Mesh(geometryPhone, materialBody);
        var meshScreen = new THREE.Mesh(geometryScreen, materialScreen);
        meshScreen.position.y = 3 * modelScale;
        meshScreen.position.z = 5 * modelScale;

        var axis = new THREE.AxisHelper( 50*modelScale );


        var model = new THREE.Object3D();
        model.add(meshPhone);
        model.add(meshScreen);
        model.add(axis);

        model.useQuaternion = true;
        model.quaternion = new THREE.Quaternion();

        model.projectedPosition = new THREE.Vector3(0,0,0);

        model.mat = materialBody;

        return model;
    }




    //===================
    //
    // Draw Blobs
    //
    //===================
    this.updateCanvasWithBlobs = function(name,mainVideo,contours) {
        var canvas = allCanvas[name];
        if (!canvas) {console.error("Debug Error - Blob Canvas "+name+" doesn't exist"); return;}
        var c = canvas.c;

        //video background
        if (mainVideo) c.drawImage(mainVideo,0,0,256,256);
        c.globalAlpha = 0.75;
        c.fillStyle = 'black';
        c.fillRect(0,0,256,256);
        c.fillStyle = 'white';
        c.globalAlpha = 1.0;

        //draw blobs
        for (var i=0; i<contours.length; i++) {
            if (contours[i].length>8)  {
                c.save();
                c.globalAlpha = 0.8;
                c.strokeStyle = '#00ff00';
                if (contours[i].hole) c.strokeStyle = '#ff0000';
                c.beginPath();
                c.moveTo(contours[i][0].x,256-contours[i][0].y);
                for (var j=1; j<contours[i].length; j++) {
                    nc = contours[i][j];
                    c.lineTo(nc.x,256-nc.y);
                }
                c.closePath();
                c.stroke();


                if (contours[i].edist) {
                    c.font = "8pt Arial";
                    c.fillStyle = 'white';
                    //c.fillText(parseInt(contours[i].edist),contours[i].centerX,256-contours[i].centerY);
                }

                c.restore();


            };
        }


        //update the 3d texture
        canvas.texture.needsUpdate = true;
    }



    //===================
    //
    // Draw Candidates (corners)
    //
    //===================
    this.updateCanvasWithCandidates = function(name,mainVideo,candidates) {
        var canvas = allCanvas[name];
        if (!canvas) {console.error("Debug Error - Candidates Canvas "+name+" doesn't exist"); return;}
        var c = canvas.c;

        //video background
        if (mainVideo) c.drawImage(mainVideo,0,0,256,256);

        c.save();

        for (var i=0; i<candidates.length; i++) {
            if (candidates[i].hasHole) c.fillStyle = 'green'; else c.fillStyle = 'blue';
            if (candidates[i].wasMatched) c.fillStyle = 'red';
            for (var j=0; j<candidates[i].length; j++) {
                c.fillRect(candidates[i][j].x,256-candidates[i][j].y,4,4);
            }

            if (candidates[i].life) {
                c.font = "14pt Arial";
                c.fillStyle = 'white';
                c.fillText(candidates[i].life,10,15);
            }
        }
        c.restore();


        //update the 3d texture
        canvas.texture.needsUpdate = true;
    }

    //
    //
    //
    this.updateCanvasWithEstimate = function(name,mainVideo,estimatedX,estimatedY) {
        var canvas = allCanvas[name];
        if (!canvas) {console.error("Debug Error - Candidates Canvas "+name+" doesn't exist"); return;}
        var c = canvas.c;

        //video background
        if (mainVideo) c.drawImage(mainVideo,0,0,256,256);

        c.save();
        c.fillStyle = 'yellow';
        c.fillRect(estimatedX-3,256-estimatedY-0.5,6,1);
        c.fillRect(estimatedX-0.5,256-estimatedY-3,1,6);
        c.restore();


        //update the 3d texture
        canvas.texture.needsUpdate = true;
    }

    //
    //
    //
    this.updateCanvasWithMotion = function(name,mainVideo,estimatedX,estimatedY) {
        var canvas = allCanvas[name];
        if (!canvas) {console.error("Debug Error - Candidates Canvas "+name+" doesn't exist"); return;}
        var c = canvas.c;

        //video background
        if (mainVideo) c.drawImage(mainVideo,0,0,256,256);

        if (!c.motionX || isNaN(c.motionX)) c.motionX = 128;
        if (!c.motionY || isNaN(c.motionY)) c.motionY = 128;
        c.motionX = c.motionX*0.6 + estimatedX*0.4;
        c.motionY = c.motionY*0.6 + estimatedY*0.4;

        c.save();
        c.fillStyle = '#00ffff';
        c.fillRect(c.motionX-3,256-c.motionY-0.5,6,1);
        c.fillRect(c.motionX-0.5,256-c.motionY-3,1,6);
        c.restore();


        //update the 3d texture
        canvas.texture.needsUpdate = true;
    }



    //===================
    //
    // Draw Pose (update phone orientation)
    //
    //===================
    this.renderPhone = function(name) {
        var fbo = allFbos[name];
        if (!fbo) {console.error("Debug Error - Fbo Canvas "+name+" doesn't exist"); return;}
        fbo.render();
    }
    this.updatePhoneTranslationRotation = function(name,translation,rotation) {
        var fbo = allFbos[name];
        if (!fbo) {console.error("Debug Error - Fbo Canvas "+name+" doesn't exist"); return;}

        fbo.phone.useQuaternion = false;

        fbo.phone.rotation.x = -Math.asin(-rotation[1][2]);
        fbo.phone.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]);
        fbo.phone.rotation.z = -Math.atan2(rotation[1][0], rotation[1][1]) - Math.PI/2;

        fbo.phone.position.x = -translation[0];// + 0.5;
        fbo.phone.position.y = translation[1];// - 0.5;
        fbo.phone.position.z = translation[2];

        fbo.phoneEst.position.copy(fbo.phone.position);

        fbo.scene.remove(fbo.phoneEst);
        //fbo.render();
    }


    this.updatePhoneTranslationRotationEstimate = function(name,translation,rotation) {
        var fbo = allFbos[name];
        if (!fbo) {console.error("Debug Error - Fbo Canvas "+name+" doesn't exist"); return;}

        fbo.scene.add(fbo.phoneEst);
        fbo.phoneEst.useQuaternion = false;

        fbo.phoneEst.rotation.x = -Math.asin(-rotation[1][2]);
        fbo.phoneEst.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]);
        fbo.phoneEst.rotation.z = -Math.atan2(rotation[1][0], rotation[1][1]) - Math.PI/2;

        fbo.phoneEst.position.x = fbo.phoneEst.position.x*0.55 + -translation[0]*0.45;// + 0.5;
        fbo.phoneEst.position.y = fbo.phoneEst.position.y*0.55 + translation[1]*0.45;// - 0.5;
        fbo.phoneEst.position.z = fbo.phoneEst.position.z*0.7 + translation[2]*0.3;
        //fbo.render();
    }

    this.updatePhoneSmooth = function(name,position,rotation,foundHole,useEstimate) {
        var fbo = allFbos[name];
        if (!fbo) {console.error("Debug Error - Fbo Canvas "+name+" doesn't exist"); return;}

        if (useEstimate) fbo.phone.mat.color = new THREE.Color(0xff0000); else fbo.phone.mat.color = new THREE.Color(0x0000ff);
        if (foundHole) fbo.phone.mat.color = new THREE.Color(0x00ffff);

        fbo.phone.useQuaternion = false;

        fbo.phone.rotation.x = rotation.x;
        fbo.phone.rotation.y = rotation.y;
        fbo.phone.rotation.z = rotation.z;

        fbo.phone.position.x = -position.x;
        fbo.phone.position.y = position.y;
        fbo.phone.position.z = position.z;
    }





    //===================
    //
    // Update everything using the phone as a controller
    //
    //===================
    this.update = function(trackingIsValid,phonePosition,phoneQuaternion) {
    }


    //===================
    //
    // Render the test scene
    //
    //===================
    this.render = function() {
        //renderer.setClearColorHex(0x333333,1);
        //renderer.clear();
        renderer.render(scene,camera);
    }
});