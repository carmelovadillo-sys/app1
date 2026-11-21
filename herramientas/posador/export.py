import json, sys, re, asyncio
sys.path.insert(0,'/home/claude/rig')
from ex2 import EX, EJM, GRADS, pose_transforms, joints, build
from playwright.async_api import async_playwright
svgs={}
for i,(n,(sp,gear,obj,view)) in enumerate(EX.items()):
    T=pose_transforms(sp); J=joints(T); back,front=gear(J,sp) if gear else ('','')
    s,_=build(sp, EJM.get(n,''), GRADS+back, front, '0 0 400 300', obj, 'f%d'%i)
    s=re.sub(r'\s(visibility="visible"|vector-effect="non-scaling-stroke")','',s)
    s=re.sub(r'(\d+\.\d)\d+',r'\1',s)
    svgs[n]=s
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg=await b.new_page()
        await pg.set_content('<div id=c></div>')
        out={}
        for n,s in svgs.items():
            bb=await pg.evaluate("""(s)=>{ const c=document.getElementById('c'); c.innerHTML=s; const v=c.querySelector('svg'); v.setAttribute('width','400'); v.setAttribute('height','300');
              let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
              for(const el of v.children){ if(el.tagName==='defs') continue; if(el.tagName==='rect' && +el.getAttribute('width')>200) continue; if(el.tagName==='ellipse') continue;
                try{ const r=el.getBoundingClientRect(); if(!r.width&&!r.height) continue; const M=v.getScreenCTM().inverse();
                  const a=new DOMPoint(r.left,r.top).matrixTransform(M), z=new DOMPoint(r.right,r.bottom).matrixTransform(M);
                  x0=Math.min(x0,a.x); y0=Math.min(y0,a.y); x1=Math.max(x1,z.x); y1=Math.max(y1,z.y);}catch(e){} }
              return [x0,y0,x1,y1]; }""", s)
            x0,y0,x1,y1=bb; y1=max(y1,263)
            pad=10; w=x1-x0+2*pad; h=y1-y0+2*pad
            # proporción 4:3 como mucho, para que no salga una tira
            if w/h>1.3: dh=w/1.3-h; y0-=dh*0.75; h=w/1.3
            if h/w>1.25: dw=h/1.25-w; x0-=dw/2; w=h/1.25
            vb='%.1f %.1f %.1f %.1f'%(x0-pad,y0-pad,w,h)
            out[n]=re.sub(r'viewBox="[^"]+"','viewBox="%s"'%vb,s,count=1)
        await b.close()
        import collections
        norm={}
        for n,v in out.items(): norm[n]=re.sub(r'\bf\d+_','§',v)
        cnt=collections.Counter(); toks={}
        for n,v in norm.items():
            t=re.split(r'(?=<)',v); toks[n]=t; cnt.update(set(t))
        tab=[k for k,c in cnt.items() if len(k)>40 and c>=3]; idx={k:i for i,k in enumerate(tab)}
        comp={n:''.join(('{{%d}}'%idx[x]) if x in idx else x for x in t) for n,t in toks.items()}
        js='/* App 1% · dibujos estáticos de ejercicios (21 nov). Generado con el posador: no editar a mano */\nvar FOTOS_T='+json.dumps(tab,ensure_ascii=False,separators=(',',':'))+';\nvar FOTOS_C='+json.dumps(comp,ensure_ascii=False,separators=(',',':'))+';\n'
        js+='var FOTOS={}; Object.keys(FOTOS_C).forEach(function(n){ Object.defineProperty(FOTOS,n,{enumerable:true,get:function(){ return FOTOS_C[n].replace(/\\{\\{(\\d+)\\}\\}/g,function(m,k){ return FOTOS_T[+k]; }).replace(/§/g,"fx_"); }}); });\n'
        open('/home/claude/app1-new/fotos.js','w').write(js)
        print(len(out), round(len(js)/1024),'KB')
asyncio.run(main())
