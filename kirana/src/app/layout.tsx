import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Provider from '../Provider';  
import StoreProvider from "../redux/StoreProvider";
import InitUser from "../InitUser";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kirana",
  description: "Grocery app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="w-full min-h-screen bg-white">
        <Provider>
          <StoreProvider>
            <InitUser/>
            {children}
            </StoreProvider>
          

        </Provider>
      </body>
    </html>
  );
}
