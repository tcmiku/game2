'use client';
import {useEffect} from 'react';

/** Keep keyboard navigation on the visible sheet while the camp is obscured. */
export function usePanelFocus(selector:string|null){
 useEffect(()=>{
  if(!selector)return;
  const panel=document.querySelector<HTMLElement>(selector);if(!panel)return;
  const previous=document.activeElement as HTMLElement|null;
  const controls=()=>Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]'));
  (panel.querySelector<HTMLElement>('input,.weapon-card[aria-pressed="true"]')||controls()[0])?.focus({preventScroll:true});
  const trap=(event:KeyboardEvent)=>{
   if(event.key!=='Tab')return;
   const items=controls(),first=items[0],last=items.at(-1);if(!first)return;
   if(!panel.contains(document.activeElement)){event.preventDefault();(event.shiftKey?last:first)?.focus();}
   else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  window.addEventListener('keydown',trap,true);
  return()=>{window.removeEventListener('keydown',trap,true);if(previous?.isConnected)previous.focus({preventScroll:true});};
 },[selector]);
}
