import type { Metadata } from 'next';
import './globals.css';
import './nightfall-theme.css';
import './npc-panels.css';
import './interface.css';
import './sanctuary.css';
export const metadata: Metadata = { title:'长夜 · NIGHTFALL', description:'月落之前，与友同行。', icons:{icon:'/favicon.svg'} };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="zh-CN"><body>{children}</body></html>;}
