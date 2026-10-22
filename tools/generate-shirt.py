import bpy, math, os
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
cloth=bpy.data.materials.new('Graphite cotton'); cloth.diffuse_color=(0.11,0.11,0.11,1); cloth.use_nodes=True
cloth.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(0.11,0.11,0.11,1)
cloth.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.92
seam=bpy.data.materials.new('Seams'); seam.diffuse_color=(0.075,0.075,0.075,1)
def torso_width(t):
    # A relaxed tee: slightly flared hem, drawn-in waist, broad but sloped shoulders.
    return .65 + .13*math.exp(-((t-.77)/.25)**2) + .10*math.exp(-((t-.02)/.18)**2) + .11*math.exp(-((t-1.0)/.14)**2)

def shoulder_y(x, front):
    neck=.20 if front else .11
    a=abs(x)
    if a < .43: return 1.06-neck*(1-(a/.43)**2)
    return 1.06-.105*min(1,(a-.43)/.37)

def panel(name, front):
    verts=[]; faces=[]; bottom=-1.24; top=1.06; nx=56; ny=72
    for j in range(ny+1):
        row_y=bottom+(top-bottom)*j/ny
        t=j/ny
        width=torso_width(t)
        for i in range(nx+1):
            x=(-1+2*i/nx)*width
            y=bottom+(shoulder_y(x,front)-bottom)*t
            if j==0: y+=.022*math.cos(x*8)+.012*math.cos(x*16)
            bulge=(1-(x/max(width,.01))**2)*(.045+.055*math.sin(math.pi*t))
            vertical=.045*math.sin(13*x+2.4*t)*(1-t)**2
            cross=.047*math.sin(8*math.pi*t+8*abs(x))*math.exp(-((abs(x)-.58)/.25)**2)*math.exp(-((t-.57)/.34)**2)
            soft=.022*math.sin(7*x-11*t)*math.sin(math.pi*t)
            fold=vertical+cross+soft
            z=(.18+bulge+fold+.025*math.sin(5*x+1.7*t)*(1-t)) if front else (-.17-bulge-fold)
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
# Curved side fabric joins the front and back panels.
for sign in [-1,1]:
    verts=[]; faces=[]; ny=56
    for j in range(ny+1):
        t=j/ny; width=torso_width(t)
        y=-1.24+(shoulder_y(sign*width,True)+1.24)*t
        verts.extend([(sign*width,y,.18),(sign*width,y,-.17)])
    for j in range(ny):
        a=j*2; faces.append((a,a+1,a+3,a+2))
    mesh=bpy.data.meshes.new('Side fabric');mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new('Side_'+str(sign),mesh);bpy.context.collection.objects.link(obj);obj.data.materials.append(cloth)
    for poly in mesh.polygons:poly.use_smooth=True
# Rounded sleeves with open cuffs and a gently draped upper surface.
for sign,label in [(-1,'Left'),(1,'Right')]:
    verts=[]; faces=[]; rings=12; sides=16
    for j in range(rings+1):
        t=j/rings
        cx=sign*(.76+.50*t); cy=.80-.27*t
        ry=.225-.052*t; rz=.185-.015*t
        for i in range(sides):
            a=2*math.pi*i/sides
            x=cx+sign*.042*math.cos(a)*math.sin(math.pi*t)
            y=cy+ry*math.cos(a)
            z=rz*math.sin(a)+.012*math.sin(5*t+3*a)
            verts.append((x,y,z))
    for j in range(rings):
        for i in range(sides):
            a=j*sides+i;b=j*sides+(i+1)%sides;c=(j+1)*sides+(i+1)%sides;d=(j+1)*sides+i
            faces.append((a,b,c,d) if sign==1 else (d,c,b,a))
    mesh=bpy.data.meshes.new(label+' sleeve');mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(label+'_Sleeve',mesh);bpy.context.collection.objects.link(obj);obj.data.materials.append(cloth)
    for poly in mesh.polygons:poly.use_smooth=True
    solid=obj.modifiers.new('Sleeve fabric','SOLIDIFY');solid.thickness=.01
    cuff=[verts[rings*sides+i] for i in range(sides)]+[verts[rings*sides]]
    # cuff edge is added after curve() is defined below
    globals()[label.lower()+'_cuff']=cuff
# Collar made of short fabric segments in a visible U shape.
def curve(name, points, radius, mat):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.bevel_depth=radius;cu.bevel_resolution=3
    sp=cu.splines.new('POLY');sp.points.add(len(points)-1)
    for p,xyz in zip(sp.points,points):p.co=(*xyz,1)
    ob=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(ob);ob.data.materials.append(mat)
curve('Collar_front',[(.43*math.cos(a),1.06-.20*math.sin(a),.24) for a in [i*math.pi/32 for i in range(33)]],.026,seam)
curve('Collar_back',[(.43*math.cos(a),1.06-.11*math.sin(a),-.22) for a in [i*math.pi/32 for i in range(33)]],.023,seam)
# bottom and sleeve hems
for z in [.19,-.18]:
 curve('Bottom_hem',[(x,-1.19+.022*math.cos(x*8)+.012*math.cos(x*16),z) for x in [-.73,-.55,-.36,-.18,0,.18,.36,.55,.73]],.007,seam)
curve('Left_cuff_hem',left_cuff,.008,seam)
curve('Right_cuff_hem',right_cuff,.008,seam)
for sign in [-1,1]:
 curve('Shoulder_stitch',[(sign*(.43+.36*t/16),1.055-.105*t/16,.23) for t in range(17)],.005,seam)
model_objects=list(bpy.context.scene.objects)
for obj in model_objects: obj.rotation_euler[0]=math.pi/2
bpy.ops.export_scene.gltf(filepath=os.path.abspath('public/models/aura-tee.glb'),export_format='GLB',use_selection=False,export_apply=True)
for obj in model_objects: obj.rotation_euler[0]=0
