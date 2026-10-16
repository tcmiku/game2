'use client';
import {useEffect,useRef,useState} from 'react';
import {Check,Copy} from 'lucide-react';
import {copyText} from '../../lib/clipboard.mjs';

export function RoomCode({code}:{code:string}){
 const [copied,setCopied]=useState(false),[manual,setManual]=useState(false);
 const input=useRef<HTMLInputElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),attempt=useRef(0);
 useEffect(()=>{
  attempt.current++;setCopied(false);setManual(false);
  return()=>{attempt.current++;if(timer.current)clearTimeout(timer.current);};
 },[code]);
 useEffect(()=>{if(manual){input.current?.focus({preventScroll:true});input.current?.select();}},[manual]);
 const copy=async()=>{
  if(!code)return;
  const id=++attempt.current;if(timer.current)clearTimeout(timer.current);setCopied(false);
  const success=await copyText(code);if(id!==attempt.current)return;
  setCopied(success);setManual(!success);
  if(success)timer.current=setTimeout(()=>setCopied(false),1800);
  else{input.current?.focus({preventScroll:true});input.current?.select();}
 };
 return <>
  <button type="button" className="room-code" onClick={copy} disabled={!code} aria-label={copied?'房间码已复制':'复制房间码'} title={copied?'已复制':'复制房间码'}><span>{code}</span>{copied?<Check size={17}/>:<Copy size={17}/>}</button>
  <span role="status" className="sr-only">{copied?'房间码已复制':''}</span>
  {manual&&<div className="room-code-manual"><label htmlFor="manual-room-code">请长按或按 Ctrl / ⌘ + C 复制</label><input ref={input} id="manual-room-code" aria-label="手动复制房间码" value={code} readOnly autoComplete="off" spellCheck={false} onFocus={e=>e.currentTarget.select()} onClick={e=>e.currentTarget.select()}/></div>}
 </>;
}
