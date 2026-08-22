import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "VitaQuest | Tu progreso, cada día",
  description: "Una forma amable de convertir tus objetivos de salud en acciones diarias.",
}

type RootLayoutProps = Readonly<{ children: ReactNode }>

export default function RootLayout({ children }: RootLayoutProps): ReactNode {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
