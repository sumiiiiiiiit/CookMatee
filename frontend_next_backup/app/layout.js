import './globals.css'

export const metadata = {
  title: 'CookMate - Discover & Share Amazing Recipes',
  description: 'Your ultimate recipe sharing platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
