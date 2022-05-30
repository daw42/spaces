import GUI from 'lil-gui';
import { BoxGeometry, GridHelper, Group, Mesh, 
    MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Scene, Texture, 
    TextureLoader, WebGLRenderer } from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import { Frustum } from './frustum';

window.addEventListener("DOMContentLoaded", main);
window.addEventListener( 'resize', onWindowResize, false );

let scene : Scene;
let renderer : WebGLRenderer;
let windowWidth : number, windowHeight : number;
let mainCamera : (PerspectiveCamera | OrthographicCamera);
let frustum : Frustum;
let sceneTransform : Group;

class View {
    camera : PerspectiveCamera;
    controls : OrbitControls;

    constructor(cam : PerspectiveCamera, el : Element ) {
        this.camera = cam;
        this.controls = new OrbitControls(this.camera, el as HTMLElement);
    }

    updateProjection( aspect : number ) {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }
}

const views : View[] = [];

function init() {
    const aspect = window.innerWidth / window.innerHeight;

    const viewEls = document.querySelectorAll('.view-grid > div');
    mainCamera = new PerspectiveCamera( 25, aspect, 1, 12 );
    mainCamera.position.set(4,4,4);
    frustum = new Frustum(mainCamera);
    const camera2 = new PerspectiveCamera( 48, aspect, 0.1, 1000 );
    camera2.position.set(0,10,10);
    const camera3 = new PerspectiveCamera( 48, aspect, 0.1, 1000 );
    camera3.position.set(0,7,10);
    const camera4 = new PerspectiveCamera( 48, aspect, 0.1, 1000 );
    camera4.position.set(4,4,4);
    views.push( new View( mainCamera, viewEls.item(0) ) );
    views.push( new View( camera2, viewEls.item(1) ) );
    views.push( new View( camera3, viewEls.item(2) ) );
    views.push( new View( camera4, viewEls.item(3) ) );
}

const shapes : Record<string, Mesh> = {
    box: new Mesh(new BoxGeometry(1,1,1)),
    spot: null as Mesh
};

const selectedShape = {
    shape: 'spot'
};

function main() {
    scene = new Scene();
    renderer = new WebGLRenderer();

    init();
    
    window.addEventListener( 'resize', onWindowResize, false );
    onWindowResize();

    const gui = new GUI();
    gui.add( selectedShape, 'shape', Object.keys(shapes) ).onFinishChange( selectMesh );
    gui.add( mainCamera, "near", 0.5, 50 ).onChange( updateFrustum );
    gui.add( mainCamera, "far", 5, 50 ).onChange( updateFrustum );
    gui.add( mainCamera, "fov", 1, 120).onChange( updateFrustum );

    shapes.box.visible = false;
    const textureLoader = new TextureLoader();
    textureLoader.load('data/crate0_diffuse.png', ( texture : Texture) => {
        const b = shapes.box as Mesh;
        b.material = new MeshBasicMaterial( {map: texture} );
    });
    const objLoader = new OBJLoader();
    objLoader.load('data/spot_triangulated.obj', (grp: Group) => {
        shapes.spot = grp.children[0] as Mesh;
        textureLoader.load('data/spot_texture.png', (tex : Texture) => {
            shapes.spot.material = new MeshBasicMaterial( { map: tex} );
            sceneTransform.add(shapes.spot);
            selectMesh('spot');
        });
    });

    const grid = new GridHelper(50, 50, 0x0000ff);
    scene.add(grid);
    sceneTransform = new Group();
    sceneTransform.add(shapes.box);
    scene.add(frustum.group);
    scene.add(sceneTransform);

    selectMesh( 'spot' );
    document.body.appendChild( renderer.domElement );
    animate();
}

function selectMesh( name : string ) : void { 
    for( const meshName of Object.keys(shapes) ) {
        const s = shapes[meshName];
        if( s !== null ) s.visible = (meshName === name);
    }
}

function animate() {
    draw();
    window.requestAnimationFrame( animate );
}

function draw() {
    const w2 = windowWidth / 2;
    const h2 = windowHeight / 2;
    renderer.autoClear = false;
    sceneTransform.matrixAutoUpdate = false;
    frustum.group.matrixAutoUpdate = false;
    frustum.group.matrix.identity();
    sceneTransform.matrix.identity();
    frustum.showDecorations(true);

    // Screen view
    frustum.group.visible = false;
    renderer.setViewport(0, h2, w2, h2);
    renderer.render( scene, views[0].camera );

    // World space
    frustum.group.visible = true;
    renderer.setViewport(w2, h2, w2, h2);
    frustum.group.matrix.copy( mainCamera.matrix );
    renderer.render( scene, views[1].camera );
    
    // Camera space
    renderer.setViewport(0, 0, w2, h2);
    frustum.group.matrix.identity();
    sceneTransform.matrix.copy( mainCamera.matrixWorldInverse );
    renderer.render( scene, views[2].camera );

    // Clip space
    renderer.setViewport(w2, 0, w2, h2);
    frustum.showDecorations(false);
    sceneTransform.matrix.premultiply( mainCamera.projectionMatrix );
    frustum.group.matrix.copy(mainCamera.projectionMatrix);
    renderer.render( scene, views[3].camera );
}

function onWindowResize() {
    if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
        const aspect = windowWidth / windowHeight;

        views.forEach( (view) => view.updateProjection(aspect) );
        if( mainCamera instanceof PerspectiveCamera ) {
            mainCamera.aspect = aspect;
            updateFrustum();
        }
        renderer.setSize( windowWidth, windowHeight );
    }
}

function updateFrustum() {
    mainCamera.updateProjectionMatrix();
    frustum.set(mainCamera as PerspectiveCamera);
}