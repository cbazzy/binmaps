import Image from "next/image";
import { Metadata } from "next";
import { Inter } from 'next/font/google';

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Binmaps',
  description: 'a place to find the nearest bin locations quickly and easily!',
};

export default function Home() {
  return (
    <div className={`text-center p-4 md:p-12 ${inter.className}`}>
      <h1 className="text-2xl md:text-4xl">Welcome to Binmaps</h1>
      <p className="text-lg md:text-xl">Coming soon!</p>
      <div className="flex justify-center items-center my-4">
        <Image
          src="/images/binmaps.png"
          alt="Binmaps logo"
          width={300}
          height={300}
          className="w-40 h-40 md:w-60 md:h-60"
        />
      </div>
      <p className="text-base md:text-lg">
        Find the nearest bin locations quickly and easily!
      </p>
    </div>
  );
}