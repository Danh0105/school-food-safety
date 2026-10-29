import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export default function WarehouseDialog({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){
 const ref=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close()},[])
 return <dialog ref={ref} aria-label={title} className={`management-modal warehouse-dialog ${wide?'wide':''}`} onCancel={event=>{event.preventDefault();onClose()}} onClick={event=>{if(event.target===event.currentTarget)onClose()}}><div className="dialog-head"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Đóng" onClick={onClose}><X/></button></div>{children}</dialog>
}
