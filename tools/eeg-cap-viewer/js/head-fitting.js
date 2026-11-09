/* EEG Cap Viewer: shape-preserving display registration and scalp projection.
 * Source/MNI electrode coordinates are never changed by this module.
 * This is a visualization fit, not individual MRI coregistration.
 */
(function (root) {
  'use strict';
  const xyz = ['x', 'y', 'z'];
  const I = () => [[1,0,0],[0,1,0],[0,0,1]];
  const v = (x=0,y=0,z=0) => ({x,y,z});
  const add = (a,b) => v(a.x+b.x,a.y+b.y,a.z+b.z);
  const sub = (a,b) => v(a.x-b.x,a.y-b.y,a.z-b.z);
  const mul = (a,s) => v(a.x*s,a.y*s,a.z*s);
  const dot = (a,b) => a.x*b.x+a.y*b.y+a.z*b.z;
  const cross = (a,b) => v(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
  const length = a => Math.hypot(a.x,a.y,a.z);
  const unit = a => mul(a,1/(length(a)||1));
  const dist = (a,b) => length(sub(a,b));
  const finite = a => a && xyz.every(k => Number.isFinite(a[k]));
  const clamp = (a,lo,hi) => Math.max(lo,Math.min(hi,a));
  const median = a => {const b=a.slice().sort((x,y)=>x-y);return b.length ? (b[Math.floor((b.length-1)/2)]+b[Math.floor(b.length/2)])/2 : 0;};
  const quantile = (a,p) => {const b=a.slice().sort((x,y)=>x-y); return b[Math.min(b.length-1,Math.floor(p*(b.length-1)))]||0;};
  const center = (points,weights) => {
    let total=0, c=v(); points.forEach((p,i)=>{const w=weights ? weights[i] : 1; total+=w;c=add(c,mul(p,w));});
    return total ? mul(c,1/total) : v();
  };
  const rotate = (p,r) => v(...r.map(row=>row[0]*p.x+row[1]*p.y+row[2]*p.z));
  const transpose = r => r[0].map((_,j)=>r.map(row=>row[j]));
  const identity = () => ({scale:1,rotation:I(),translation:v()});
  const apply = (p,t) => add(mul(rotate(p,t.rotation),t.scale),t.translation);
  const inverse = t => {
    const rotation=transpose(t.rotation), scale=1/t.scale;
    return {rotation,scale,translation:mul(rotate(t.translation,rotation),-scale)};
  };
  const toView = (p,fit) => rotate(sub(p,fit.pose.translation),transpose(fit.pose.rotation));

  function eigen4(matrix) {
    const a=matrix.map(row=>row.slice()), vectors=Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>+(i===j)));
    for(let n=0;n<100;n++) {
      let p=0,q=1,big=0;
      for(let i=0;i<4;i++) for(let j=i+1;j<4;j++) if(Math.abs(a[i][j])>big){big=Math.abs(a[i][j]);p=i;q=j;}
      if(big<1e-10) break;
      const angle=0.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(angle),s=Math.sin(angle);
      const app=a[p][p],aqq=a[q][q],apq=a[p][q];
      a[p][p]=c*c*app-2*s*c*apq+s*s*aqq;
      a[q][q]=s*s*app+2*s*c*apq+c*c*aqq;a[p][q]=a[q][p]=0;
      for(let k=0;k<4;k++) if(k!==p&&k!==q){const x=a[k][p],y=a[k][q];a[k][p]=a[p][k]=c*x-s*y;a[k][q]=a[q][k]=s*x+c*y;}
      for(let k=0;k<4;k++){const x=vectors[k][p],y=vectors[k][q];vectors[k][p]=c*x-s*y;vectors[k][q]=s*x+c*y;}
    }
    let idx=0;for(let i=1;i<4;i++) if(a[i][i]>a[idx][idx])idx=i;
    return vectors.map(row=>row[idx]);
  }

  function nonCollinear(points) {
    if(points.length<3)return false;
    const a=points[0];let b=a,largest=0;
    points.forEach(p=>{const d=dist(p,a);if(d>largest){largest=d;b=p;}});
    if(largest<1e-6)return false;
    return points.some(p=>length(cross(sub(b,a),sub(p,a)))>largest*largest*1e-5);
  }

  function fitOnce(src,dst,weights,allowScale=true,fixedRotation=null) {
    if(src.length!==dst.length||!nonCollinear(src)||!nonCollinear(dst))return null;
    const sc=center(src,weights),tc=center(dst,weights);
    let rotation=fixedRotation;
    if(!rotation) {
      const S=Array.from({length:3},()=>[0,0,0]);
      src.forEach((p,i)=>{const a=sub(p,sc),b=sub(dst[i],tc),w=weights?weights[i]:1;
        xyz.forEach((k,r)=>xyz.forEach((l,c)=>{S[r][c]+=w*a[k]*b[l];}));});
      const [[xx,xy,xz],[yx,yy,yz],[zx,zy,zz]]=S,t=xx+yy+zz;
      const [w,x,y,z]=eigen4([[t,yz-zy,zx-xz,xy-yx],[yz-zy,xx-yy-zz,xy+yx,zx+xz],[zx-xz,xy+yx,-xx+yy-zz,yz+zy],[xy-yx,zx+xz,yz+zy,-xx-yy+zz]]);
      rotation=[[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]];
    }
    let numerator=0,denominator=0;
    src.forEach((p,i)=>{const a=sub(p,sc),b=sub(dst[i],tc),w=weights?weights[i]:1;
      numerator+=w*dot(rotate(a,rotation),b);denominator+=w*dot(a,a);});
    const scale=allowScale ? numerator/denominator : 1;
    if(!Number.isFinite(scale)||scale<1e-6||scale>1e6)return null;
    return {scale,rotation,translation:sub(tc,mul(rotate(sc,rotation),scale))};
  }

  function fitSimilarity(src,dst,{allowScale=true,fixedRotation=null,robust=true}={}) {
    if(src.length!==dst.length)return null;
    const indices=src.map((p,i)=>finite(p)&&finite(dst[i])?i:-1).filter(i=>i>=0);
    src=indices.map(i=>src[i]);dst=indices.map(i=>dst[i]);
    let fit=fitOnce(src,dst,null,allowScale,fixedRotation);
    if(!fit)return null;
    let weights=null;
    for(let n=0;robust&&n<8&&src.length>=6;n++) {
      const residual=src.map((p,i)=>dist(apply(p,fit),dst[i]));
      const m=median(residual),sigma=1.4826*median(residual.map(x=>Math.abs(x-m)));
      const limit=Math.max(0.25,m+2.5*sigma);
      weights=residual.map(r=>r<=limit?1:Math.max(1e-5,(limit/r)**2));
      const next=fitOnce(src,dst,weights,allowScale,fixedRotation);if(!next)break;fit=next;
    }
    const residual=src.map((p,i)=>dist(apply(p,fit),dst[i]));
    fit.rmsResidual=Math.sqrt(residual.reduce((a,r)=>a+r*r,0)/residual.length);
    fit.medianResidual=median(residual);
    fit.inliers=residual.filter(r=>r<=Math.max(2,fit.medianResidual*3)).length;
    fit.count=src.length;
    return fit;
  }

  function solve(A,b) {
    const m=A.map((row,i)=>[...row,b[i]]),n=b.length;
    const max=Math.max(...A.flat().map(Math.abs));if(!max)return null;
    for(let i=0;i<n;i++) {
      let p=i;for(let j=i+1;j<n;j++)if(Math.abs(m[j][i])>Math.abs(m[p][i]))p=j;
      if(Math.abs(m[p][i])<max*1e-10)return null;
      [m[i],m[p]]=[m[p],m[i]];const pivot=m[i][i];for(let k=i;k<=n;k++)m[i][k]/=pivot;
      for(let j=0;j<n;j++)if(j!==i){const f=m[j][i];for(let k=i;k<=n;k++)m[j][k]-=f*m[i][k];}
    }
    return m.map(row=>row[n]);
  }

  function sphereFit(points) {
    if(points.length<4)return null;
    const medianPoint=v(...xyz.map(k=>median(points.map(p=>p[k]))));
    const distances=points.map(p=>dist(p,medianPoint)),md=median(distances);
    let used=points.filter((p,i)=>distances[i]<=Math.max(1,md*4));
    let result=null;
    for(let pass=0;pass<4;pass++) {
      const origin=center(used),p=used.map(x=>sub(x,origin));
      const A=Array.from({length:4},()=>[0,0,0,0]),b=[0,0,0,0];
      p.forEach(x=>{const row=[2*x.x,2*x.y,2*x.z,1],r=dot(x,x);
        for(let i=0;i<4;i++){b[i]+=row[i]*r;for(let j=0;j<4;j++)A[i][j]+=row[i]*row[j];}});
      const solution=solve(A,b);if(!solution)return null;
      const c=v(...solution.slice(0,3)),rad2=solution[3]+dot(c,c);
      if(rad2<=0)return null;
      result={center:add(c,origin),radius:Math.sqrt(rad2)};
      const errors=used.map(x=>Math.abs(dist(x,result.center)-result.radius)),m=median(errors);
      const cut=Math.max(result.radius*0.02,m*3);
      const next=used.filter((_,i)=>errors[i]<=cut);
      if(next.length<4||next.length===used.length)break;
      used=next;
    }
    if(!result||result.radius>Math.max(md,1)*8||result.radius<1e-3)return null;
    return result;
  }

  // Closest point on a triangle (barycentric Voronoi-region method).
  function closestTriangle(p,a,b,c) {
    const ab=sub(b,a),ac=sub(c,a),ap=sub(p,a),d1=dot(ab,ap),d2=dot(ac,ap);
    if(d1<=0&&d2<=0)return a;
    const bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);if(d3>=0&&d4<=d3)return b;
    const vc=d1*d4-d3*d2;if(vc<=0&&d1>=0&&d3<=0)return add(a,mul(ab,d1/(d1-d3)));
    const cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);if(d6>=0&&d5<=d6)return c;
    const vb=d5*d2-d1*d6;if(vb<=0&&d2>=0&&d6<=0)return add(a,mul(ac,d2/(d2-d6)));
    const va=d3*d6-d5*d4;if(va<=0&&(d4-d3)>=0&&(d5-d6)>=0)return add(b,mul(sub(c,b),(d4-d3)/((d4-d3)+(d5-d6))));
    const sum=va+vb+vc;if(Math.abs(sum)<1e-20)return a;
    return add(a,add(mul(ab,vb/sum),mul(ac,vc/sum)));
  }

  function createSurface(geometry) {
    const vertices=geometry.vertices;
    const faces=[];
    let volume=0;
    geometry.i.forEach((a,idx)=>{
      const b=geometry.j[idx],c=geometry.k[idx],n=cross(sub(vertices[b],vertices[a]),sub(vertices[c],vertices[a]));
      if(length(n)<1e-10)return;
      volume+=dot(vertices[a],cross(vertices[b],vertices[c]));
      faces.push({a,b,c,n:unit(n),lo:xyz.map(k=>Math.min(vertices[a][k],vertices[b][k],vertices[c][k])),hi:xyz.map(k=>Math.max(vertices[a][k],vertices[b][k],vertices[c][k])),mid:xyz.map(k=>(vertices[a][k]+vertices[b][k]+vertices[c][k])/3)});
    });
    if(volume<0)faces.forEach(f=>{f.n=mul(f.n,-1);});
    function node(list) {
      const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
      list.forEach(i=>{for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],faces[i].lo[k]);hi[k]=Math.max(hi[k],faces[i].hi[k]);}});
      if(list.length<=12)return {lo,hi,list};
      let axis=0;for(let k=1;k<3;k++)if(hi[k]-lo[k]>hi[axis]-lo[axis])axis=k;
      list.sort((a,b)=>faces[a].mid[axis]-faces[b].mid[axis]);const mid=Math.floor(list.length/2);
      return {lo,hi,left:node(list.slice(0,mid)),right:node(list.slice(mid))};
    }
    const tree=node(faces.map((_,i)=>i));
    const boxDistance=(p,n)=>xyz.reduce((s,k,i)=>s+Math.max(n.lo[i]-p[k],0,p[k]-n.hi[i])**2,0);
    function nearest(p) {
      let best=Infinity,point=null,face=null;
      function visit(n) {
        if(boxDistance(p,n)>best)return;
        if(n.list){for(const idx of n.list){const f=faces[idx],q=closestTriangle(p,vertices[f.a],vertices[f.b],vertices[f.c]),r=sub(p,q),d=dot(r,r);if(d<best){best=d;point=q;face=f;}}return;}
        const left=boxDistance(p,n.left),right=boxDistance(p,n.right);
        if(left<right){visit(n.left);visit(n.right);}else{visit(n.right);visit(n.left);}
      }
      visit(tree);
      return {point,normal:face.n,distance:Math.sqrt(best)};
    }
    return {geometry,nearest,center:v(0,-20,0)};
  }

  function fitHead(electrodes,options) {
    const {surface,canonicalMap=new Map(),fiducials={},templateFiducials={},adaptive=true,overallScale=1}=options;
    const good=electrodes.filter(finite),warnings=[];
    let pose=null,method='',orientationKnown=true;
    const supplied=good.filter(e=>[e.providedMniX,e.providedMniY,e.providedMniZ].every(Number.isFinite));
    const stored=good.filter(e=>e.presetId&&[e.mniPreX,e.mniPreY,e.mniPreZ].every(Number.isFinite));
    if(good.length&&good.every(e=>e.mniCompatible)) {pose=identity();method='Declared template/MNI coordinate frame';}
    if(!pose&&supplied.length>=3){pose=fitSimilarity(supplied.map(e=>v(e.providedMniX,e.providedMniY,e.providedMniZ)),supplied);method='Supplied source-to-MNI coordinate pairs';}
    if(!pose&&['nasion','lpa','rpa'].every(k=>finite(fiducials[k])&&finite(templateFiducials[k]))){pose=fitSimilarity(['nasion','lpa','rpa'].map(k=>templateFiducials[k]),['nasion','lpa','rpa'].map(k=>fiducials[k]));method='NAS/LPA/RPA landmark registration';}
    if(!pose&&stored.length>=3){pose=fitSimilarity(stored.map(e=>v(e.mniPreX,e.mniPreY,e.mniPreZ)),stored);method='Bundled cap-to-template registration';}
    if(!pose) {
      const pairs=good.map(e=>({e,p:canonicalMap.get(String(e.label).toLowerCase())})).filter(a=>finite(a.p));
      if(pairs.length>=3){pose=fitSimilarity(pairs.map(a=>a.p),pairs.map(a=>a.e));method=`Robust registration using ${pairs.length} standard labels`;}
    }
    if(!pose) {
      const sphere=sphereFit(good);
      orientationKnown=false;
      if(sphere){pose={scale:sphere.radius/95,rotation:I(),translation:sub(sphere.center,mul(surface.center,sphere.radius/95))};method='Geometry-only sphere initialization';}
      else {pose=identity();method='Unregistered template fallback';}
      warnings.push('Orientation cannot be determined from these labels/points. Display assumes +X right, +Y anterior, +Z superior; provide NAS/LPA/RPA or known MNI coordinates.');
      if(!sphere)warnings.push('Insufficient 3D coverage for a stable fit. Sparse/collinear coordinates do not define a head; display projection is illustrative only.');
    }
    if(Number.isFinite(pose.rmsResidual) && pose.rmsResidual > Math.max(15,15*pose.scale))
      warnings.push('Large landmark/label registration residual: verify axis directions, handedness, labels, and units. A scalp projection cannot validate registration.');
    const initial=pose;
    // Only a global uniform size and translation are refined. NO local vertex warping.
    if(adaptive&&good.length>=8) {
      for(let pass=0;pass<3;pass++) {
        const inv=inverse(pose),pairs=good.map(e=>{const local=apply(e,inv),q=surface.nearest(local);return {e,q:q.point,d:q.distance};});
        const cutoff=Math.max(12,quantile(pairs.map(x=>x.d),0.8)*1.6);
        const usable=pairs.filter(p=>p.d<=cutoff&&!/^(eog|ecg|ekg|emg|exg|aux)/i.test(p.e.label));
        if(usable.length<8)break;
        const next=fitSimilarity(usable.map(p=>p.q),usable.map(p=>p.e),{fixedRotation:initial.rotation});
        if(!next)break;
        const ratio=clamp(next.scale/initial.scale,0.85,1.18);
        const newScale=initial.scale*ratio;
        const oldCenter=apply(surface.center,initial),proposed=apply(surface.center,next),change=sub(proposed,oldCenter);
        const bounded=mul(change,Math.min(1,15*initial.scale/(length(change)||1)));
        pose={scale:newScale,rotation:initial.rotation,translation:sub(add(oldCenter,bounded),mul(rotate(surface.center,initial.rotation),newScale))};
      }
      method+='; uniform scalp-size refinement';
    }
    if(pose.scale<0.4||pose.scale>2.2)warnings.push('Fitted head size is unusual: check the CSV units. No nonuniform deformation was applied.');
    const scale=pose.scale*overallScale;
    const viewTransform={scale,rotation:I(),translation:mul(surface.center,pose.scale-scale)};
    const inv=inverse(viewTransform);
    const adjustments=good.map(e=>surface.nearest(apply(toView(e,{pose}),inv)).distance*scale);
    const large=adjustments.filter(d=>d>Math.max(25,scale*25)).length;
    if(large)warnings.push(`${large} electrode(s) require a large display projection (> ${Math.max(25,scale*25).toFixed(0)} mm); inspect the raw-coordinate view and check the input.`);
    return {pose,viewTransform,surface,method,warnings,orientationKnown,
      medianAdjustment:median(adjustments),maxAdjustment:Math.max(0,...adjustments),count:good.length,
      rmsSurfaceResidual:Math.sqrt(adjustments.reduce((s,d)=>s+d*d,0)/Math.max(1,adjustments.length))};
  }

  function projectViewPoint(point,fit,clearance=2) {
    const local=apply(point,inverse(fit.viewTransform)),near=fit.surface.nearest(local);
    const surfacePoint=apply(near.point,fit.viewTransform);
    const normal=near.normal;
    const display=add(surfacePoint,mul(normal,Math.max(0,clearance)));
    return {point:display,surfacePoint,normal,adjustment:dist(display,point),distanceToSurface:near.distance*fit.viewTransform.scale};
  }

  root.EEGHeadFitting=Object.freeze({identity,apply,inverse,rotate,transpose,toView,fitSimilarity,fitHead,createSurface,projectViewPoint,sphereFit,nonCollinear,
    vector:{v,add,sub,mul,dot,cross,dist,length,unit,finite}});
})(typeof window!=='undefined'?window:globalThis);
