// filepath: /Users/callumbasnett/Code/Binmaps/binmaps/binmaps/src/app/page.tsx
import Image from "next/image";
import { Inter } from 'next/font/google'
 
// If loading a variable font, you don't need to specify the font weight
const inter = Inter({ subsets: ['latin'] })
 

export default function Home() {
  return (
    <div className={`text-center p-40 ${inter.className}`}>
      <h1>Welcome to Binmaps</h1>
      <p>Coming soon!</p>
      <div className="flex justify-center items-center">
        <Image
          src="/images/binmaps.png"
          alt="Binmaps logo"
          width={300}
          height={300}
        />
      </div>
      <p>Find the nearest bin locations quickly and easily!</p>
    </div>
  );
}