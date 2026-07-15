import './globals.css';

export const metadata = {
  title: 'Sprints — Client Progress Portal',
  description: 'Show clients real-time project progress from GitHub activity without exposing source code.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chewy&family=Patrick+Hand&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-neutral-950 antialiased">
        {children}
      </body>
    </html>
  );
}
