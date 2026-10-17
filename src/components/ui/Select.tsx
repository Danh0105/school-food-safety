import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import './Select.css'
export type SelectOption = { value: string; label: string; description?: string; disabled?: boolean }
type Props = { label: string; value: string; options: SelectOption[]; onValueChange: (value: string) => void; onBlur?: () => void; disabled?: boolean; variant?: 'default' | 'hero'; className?: string; name?: string }
export default function Select({ label, value, options, onValueChange, onBlur, disabled=false, variant='default', className='', name }: Props) {
 const uid=useId();const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);const panel=useRef<HTMLDivElement>(null)
 const [open,setOpen]=useState(false);const [active,setActive]=useState(0);const [position,setPosition]=useState<CSSProperties>({});const typed=useRef('');const typedAt=useRef(0)
 const supportsPopover=typeof HTMLElement!=='undefined'&&'showPopover' in HTMLElement.prototype
 const selected=options.find(option=>option.value===value)
 const close=(restore=false)=>{setOpen(false);if(restore)trigger.current?.focus({preventScroll:true})}
 const choose=(index:number)=>{const option=options[index];if(!option||option.disabled)return;onValueChange(option.value);close(true)}
 const show=()=>{if(disabled||!options.length)return;setActive(Math.max(0,options.findIndex(option=>option.value===value&&!option.disabled)));setOpen(true)}
 useLayoutEffect(()=>{
  if(!open||!panel.current||!trigger.current)return
  const popup=panel.current
  const place=()=>{const rect=trigger.current!.getBoundingClientRect();const width=Math.min(Math.max(rect.width,variant==='hero'?300:260),window.innerWidth-24);const below=window.innerHeight-rect.bottom-18;const above=rect.top-18;const height=Math.min(popup.scrollHeight,340);const flip=below<Math.min(height,180)&&above>below;setPosition({left:Math.max(12,Math.min(rect.left,window.innerWidth-width-12)),top:flip?undefined:rect.bottom+7,bottom:flip?window.innerHeight-rect.top+7:undefined,width,maxHeight:Math.max(90,Math.min(340,flip?above:below))})}
  if(supportsPopover&&!popup.matches(':popover-open'))popup.showPopover()
  place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true)
  return()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);if(supportsPopover&&popup.matches(':popover-open'))popup.hidePopover()}
 },[open,supportsPopover,variant])
 useEffect(()=>{if(!open)return;const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))close()};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside)},[open])
 useEffect(()=>{if(open)panel.current?.querySelector<HTMLElement>(`[data-option-index="${active}"]`)?.scrollIntoView({block:'nearest'})},[active,open])
 const onKeyDown=(event:KeyboardEvent<HTMLButtonElement>)=>{
  if(event.key==='Tab'){close();return}
  if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();close(true);return}
  if(event.key==='Enter'||event.key===' '){event.preventDefault();if(open)choose(active);else show();return}
  const enabled=options.map((o,i)=>o.disabled?-1:i).filter(i=>i>=0)
  if(!enabled.length)return
  if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();if(!open){show();if(event.key==='Home')setActive(enabled[0]!);if(event.key==='End')setActive(enabled.at(-1)!);return}const current=enabled.indexOf(active);setActive(event.key==='Home'?enabled[0]!:event.key==='End'?enabled.at(-1)!:enabled[(current+(event.key==='ArrowDown'?1:-1)+enabled.length)%enabled.length]!);return}
  if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();const now=Date.now();typed.current=now-typedAt.current>650?event.key:typed.current+event.key;typedAt.current=now;const match=options.findIndex(o=>!o.disabled&&o.label.toLocaleLowerCase('vi').startsWith(typed.current.toLocaleLowerCase('vi')));if(match>=0){if(!open)show();setActive(match)}}
 }
 if(!supportsPopover)return <div className={`apple-select native-fallback ${variant} ${className}`}><select aria-label={label} value={value} disabled={disabled} name={name} onBlur={onBlur} onChange={e=>onValueChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}</select><ChevronDown size={16}/></div>
 return <div ref={root} className={`apple-select ${variant} ${className}`}>
  {name&&<input type="hidden" name={name} value={value}/>}
  <button ref={trigger} className="apple-select-trigger" type="button" role="combobox" aria-label={label} aria-expanded={open} aria-haspopup="listbox" aria-controls={`${uid}-options`} aria-activedescendant={open?`${uid}-option-${active}`:undefined} disabled={disabled||!options.length} onKeyDown={onKeyDown} onBlur={e=>{onBlur?.();if(!root.current?.contains(e.relatedTarget))close()}} onClick={()=>open?close():show()}><span>{selected?.label??'Chọn một mục'}</span><ChevronDown size={16} className={open?'chevron-open':''}/></button>
  {open&&<div ref={panel} popover="manual" className="apple-select-menu" role="listbox" id={`${uid}-options`} aria-label={label} style={position} onPointerDown={e=>e.preventDefault()}>{options.map((option,index)=><div role="option" aria-selected={option.value===value} aria-disabled={option.disabled||undefined} id={`${uid}-option-${index}`} data-option-index={index} key={option.value} className={`apple-select-option ${active===index?'is-active':''} ${option.disabled?'is-disabled':''}`} onPointerMove={()=>{if(!option.disabled)setActive(index)}} onClick={()=>choose(index)}><span><strong>{option.label}</strong>{option.description&&<small>{option.description}</small>}</span><span className="select-check">{option.value===value&&<Check size={17} strokeWidth={2.3}/>}</span></div>)}</div>}
 </div>
}
