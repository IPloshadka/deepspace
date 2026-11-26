// Software framebuffer: fixed 320x200 pixels, four entries from the CGA palette.
// It displays existing game state; it neither emulates a CPU nor changes rules.
export const WIDTH=320,HEIGHT=200;
export const PALETTE=[[0,0,0],[0,170,170],[85,255,85],[255,85,85]];
export function retroPixels(values){
  const pixels=new Uint8ClampedArray(WIDTH*HEIGHT*4);
  const pixel=(x,y,color)=>{if(x<0||x>=WIDTH||y<0||y>=HEIGHT)return;const offset=(y*WIDTH+x)*4;pixels.set([...PALETTE[color],255],offset);};
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++)pixel(x,y,0);
  for(let x=0;x<WIDTH;x+=20)for(let y=0;y<160;y++)if(y%4===0)pixel(x,y,1);
  for(let y=0;y<160;y+=20)for(let x=0;x<WIDTH;x++)if(x%4===0)pixel(x,y,1);
  const clamp=(v,max)=>Number.isFinite(v)?Math.max(0,Math.min(max,v)):0;
  const enemyX=80+Math.round(clamp(values[0],1500)/1500*220);
  for(let x=42;x<enemyX;x++)if(x%6<3)pixel(x,90,2);
  for(let dy=-8;dy<=8;dy++)for(let dx=0;dx<18-Math.abs(dy);dx++){
    pixel(26+dx,90+dy,2);if(values[3]<=99)pixel(enemyX+12-dx,90+dy,3);
  }
  for(let y=176;y<184;y++)for(let x=0;x<Math.round(clamp(values[2],100)*1.3);x++)pixel(10+x,y,2);
  for(let y=176;y<184;y++)for(let x=0;x<Math.round(clamp(values[3],100)*1.3);x++)pixel(180+x,y,3);
  return pixels;
}
export function drawRetro(canvas,values){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const frame=ctx.createImageData(WIDTH,HEIGHT);frame.data.set(retroPixels(values));ctx.putImageData(frame,0,0);
}
