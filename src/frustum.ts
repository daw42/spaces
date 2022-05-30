import { BufferAttribute, BufferGeometry, Group, LineBasicMaterial, LineLoop, LineSegments, PerspectiveCamera } from "three";

export class Frustum {
    group : Group;
    frustumLines : LineSegments;
    arrow : LineLoop;
    secondaryLines : LineSegments;

    constructor(cam : PerspectiveCamera) {
        this.frustumLines = new LineSegments(new BufferGeometry(), new LineBasicMaterial( {color: 0xffff00}));
        this.arrow = new LineLoop(new BufferGeometry(), new LineBasicMaterial( {color: 0x00ffff}));
        this.secondaryLines = new LineSegments(new BufferGeometry(), new LineBasicMaterial( {color: 0xaaaaaa}) );
        this.group = new Group();
        this.group.add(this.frustumLines);
        this.group.add(this.arrow);
        this.group.add(this.secondaryLines);

        this.set(cam);
    }

    set( cam : PerspectiveCamera ) : void {
        const t = Math.tan( (Math.PI / 180.0) * cam.fov / 2 );

        const nearHeight2 = t * cam.near;
        const nearWidth2 = nearHeight2 * cam.aspect;
        const farHeight2 = t * cam.far;
        const farWidth2 = farHeight2 * cam.aspect;

        const frustum = [];

        // Near plane in eye coords
        frustum.push( -nearWidth2, -nearHeight2, -cam.near );
        frustum.push(  nearWidth2, -nearHeight2, -cam.near );
        frustum.push(  nearWidth2,  nearHeight2, -cam.near );
        frustum.push( -nearWidth2,  nearHeight2, -cam.near );

        // Far plane in eye coords
        frustum.push( -farWidth2, -farHeight2, -cam.far );
        frustum.push(  farWidth2, -farHeight2, -cam.far );
        frustum.push(  farWidth2,  farHeight2, -cam.far );
        frustum.push( -farWidth2,  farHeight2, -cam.far );

        const idx = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7 ];

        if( this.frustumLines.geometry !== null ) this.frustumLines.geometry.dispose();
        const geom = new BufferGeometry();
        geom.setAttribute('position', new BufferAttribute(Float32Array.from(frustum), 3));
        geom.setIndex(idx);
        this.frustumLines.geometry = geom;

        const pts = [];
        pts.push( 0, -nearHeight2, -cam.near );
        pts.push( nearWidth2, 0, -cam.near );
        pts.push( 0, nearHeight2, -cam.near );
        pts.push( -nearWidth2, 0, -cam.near );

        pts.push( 0, -farHeight2, -cam.far );
        pts.push( farWidth2, 0, -cam.far );
        pts.push( 0, farHeight2, -cam.far );
        pts.push( -farWidth2, 0, -cam.far );

        pts.push( 0, 0, -cam.near );
        pts.push( 0, 0, -cam.far );
        pts.push( 0, 0, 0 );

        // Near plane in eye coords
        pts.push( -nearWidth2, -nearHeight2, -cam.near );
        pts.push(  nearWidth2, -nearHeight2, -cam.near );
        pts.push(  nearWidth2,  nearHeight2, -cam.near );
        pts.push( -nearWidth2,  nearHeight2, -cam.near );
        
        const geom2 = new BufferGeometry();
        geom2.setAttribute('position', new BufferAttribute(Float32Array.from(pts), 3));
        geom2.setIndex([ 0, 2, 1, 3, 4, 6, 5, 7, 8, 9, 9, 10, 10, 11, 10, 12, 10, 13, 10, 14 ]);
        if(this.secondaryLines.geometry !== null ) this.secondaryLines.geometry.dispose();
        this.secondaryLines.geometry = geom2;

        const upArrowPts = [];
        upArrowPts.push( -nearWidth2 * 0.8, nearHeight2 * 1.2, -cam.near );
        upArrowPts.push( nearWidth2 * 0.8, nearHeight2 * 1.2, -cam.near );
        upArrowPts.push( 0, nearHeight2 * 1.7, -cam.near );
        const geom3 = new BufferGeometry();
        geom3.setAttribute('position', new BufferAttribute(Float32Array.from(upArrowPts), 3));
        if( this.arrow.geometry !== null ) this.arrow.geometry.dispose();
        this.arrow.geometry = geom3;
    }

    showDecorations( show : boolean ) : void {
        this.arrow.visible = show;
        this.secondaryLines.visible = show;
    }
}