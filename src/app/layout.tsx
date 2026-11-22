import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'Intelligent Calculator', description:'Math tools + CI/CD classroom' };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
