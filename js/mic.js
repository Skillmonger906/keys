import {analyze} from './pitch.js';
export class Mic{
 on=false;sens=.5;
 async start(){ // call from a user tap (iOS)
  this.ctx=new(window.AudioContext||window.webkitAudioContext)();await this.ctx.resume();
  this.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
  this.an=this.ctx.createAnalyser();this.an.fftSize=8192;this.ctx.createMediaStreamSource(this.stream).connect(this.an); // never connected to output: no feedback
  this.buf=new Float32Array(8192);this.on=true}
 read(){this.an.getFloatTimeDomainData(this.buf);return analyze(this.buf,this.ctx.sampleRate,this.sens)}
 stop(){this.stream?.getTracks().forEach(t=>t.stop());this.ctx?.close();this.on=false}
}
