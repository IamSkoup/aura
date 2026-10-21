import bpy, math
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
cloth=bpy.data.materials.new('Graphite cotton'); cloth.diffuse_color=(0.11,0.11,0.11,1); cloth.use_nodes=True
cloth.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(0.11,0.11,0.11,1)
cloth.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.86
seam=bpy.data.materials.new('Seams'); seam.diffuse_color=(0.075,0.075,0.075,1)
def panel(name, front):
    verts=[]; uv=[]; faces=[]; w=.88; bottom=-1.24; top=1.06; nx=16; ny=18
    for j in range(ny+1):
        row_y=bottom+(top-bottom)*j/ny
        taper=.92+.08*(j/ny)
        for i in range(nx+1):
            x=(-w+2*w*i/nx)*taper
            y=row_y
            if j==ny and abs(x)<.43: y=top-(.20 if front else .10)*(1-(x/.43)**2)
            bulge=(1-(x/w)**2)*.10
            z=(.18+bulge) if front else (-.17-bulge)
            verts.append((x,y,z))
    for j in range(ny):
      for i in range(nx):
        a=j*(nx+1)+i; b=a+1; c=b+nx+1; d=a+nx+1
        faces.append((a,b,c,d) if front else (d,c,b,a))
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],faces); mesh.update(); obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj); obj.data.materials.append(cloth)
    layer=mesh.uv_layers.new(name='Print UV')
    for poly in mesh.polygons:
      for li in poly.loop_indices:
        vi=mesh.loops[li].vertex_index; i=vi%(nx+1); j=vi//(nx+1)
        layer.data[li].uv=(i/nx,j/ny)
    for p in mesh.polygons:p.use_smooth=True
    solid=obj.modifiers.new('Soft fabric edge','SOLIDIFY'); solid.thickness=.014
    return obj
panel('Front_Print_Surface',True); panel('Back_Print_Surface',False)
def cube(name, loc, scale, material=cloth, bevel=.06):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name
    o.dimensions=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    if bevel:
      m=o.modifiers.new('Soft hem','BEVEL');m.width=bevel;m.segments=3
      o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o
# Side fabric joins front and back.
for sign in [-1,1]:
    cube('Side_seam', (sign*.86,-.10,0),(.04,2.15,.37),cloth,.02)
# Sloped sleeves: custom prisms spanning the shoulder to each arm.
for sign,label in [(-1,'Left'),(1,'Right')]:
    pts=[(.76,1.02),(1.17,.94),(1.42,.37),(1.04,.25),(.84,.57)]
    verts=[(sign*x,y,z) for z in [-.17,.19] for x,y in pts]
    faces=[(0,1,2,3,4),(9,8,7,6,5)] if sign==1 else [(4,3,2,1,0),(5,6,7,8,9)]
    for i in range(5):faces.append((i,(i+1)%5,(i+1)%5+5,i+5))
    mesh=bpy.data.meshes.new(label+' sleeve');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(label+'_Sleeve',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(cloth)
    bevel=o.modifiers.new('Soft sleeve hem','BEVEL');bevel.width=.035;bevel.segments=3
    o.modifiers.new('Normals','WEIGHTED_NORMAL')
# Collar made of short fabric segments in a visible U shape.
def curve(name, points, radius, mat):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.bevel_depth=radius;cu.bevel_resolution=3
    sp=cu.splines.new('POLY');sp.points.add(len(points)-1)
    for p,xyz in zip(sp.points,points):p.co=(*xyz,1)
    ob=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(ob);ob.data.materials.append(mat)
curve('Collar_front',[(.43*math.cos(a),1.06-.20*math.sin(a),.24) for a in [i*math.pi/24 for i in range(25)]],.035,seam)
curve('Collar_back',[(.43*math.cos(a),1.06-.10*math.sin(a),-.22) for a in [i*math.pi/24 for i in range(25)]],.026,seam)
# bottom and sleeve hems
for z in [.19,-.18]:
 curve('Bottom_hem',[(x,-1.19,z) for x in [-.86,-.43,0,.43,.86]],.012,seam)
for sign in [-1,1]:
 curve('Sleeve_hem',[(sign*1.14,.94,.19),(sign*1.42,.38,.19),(sign*1.42,.38,-.17),(sign*1.14,.94,-.17)],.012,seam)
model_objects=list(bpy.context.scene.objects)
for obj in model_objects: obj.rotation_euler[0]=math.pi/2
bpy.ops.export_scene.gltf(filepath='/workspace/aura/public/models/aura-tee.glb',export_format='GLB',use_selection=False,export_apply=True)
for obj in model_objects: obj.rotation_euler[0]=0
# studio product image
world=bpy.context.scene.world;world.color=(.8,.8,.8)
bpy.ops.object.light_add(type='AREA',location=(-3,4,5));bpy.context.object.data.energy=500;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=5
bpy.ops.object.light_add(type='AREA',location=(3,-2,3));bpy.context.object.data.energy=300;bpy.context.object.data.size=4
bpy.ops.object.camera_add(location=(0,0,5.6));cam=bpy.context.object;direction=Vector((0,0,0))-cam.location;cam.rotation_euler=(0,0,0);bpy.context.scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=4.35
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE_NEXT';scene.render.resolution_x=1100;scene.render.resolution_y=1250;scene.render.resolution_percentage=100
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.filepath='/workspace/aura/public/images/aura-tee.png'
bpy.ops.render.render(write_still=True)
