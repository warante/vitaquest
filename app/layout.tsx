import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import "./globals.css"
import { PwaRegister } from "./pwa-register"

export const metadata: Metadata = {
  title: "VitaQuest | Tu progreso, cada día",
  description: "Una forma amable de convertir tus objetivos de salud en acciones diarias.",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#2c8a68",
  width: "device-width",
  initialScale: 1,
}

type RootLayoutProps = Readonly<{ children: ReactNode }>

export default function RootLayout({ children }: RootLayoutProps): ReactNode {
  return (
    <html lang="es">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  )
}
