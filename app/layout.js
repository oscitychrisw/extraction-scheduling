import "./globals.css";

export const metadata = {
  title: "Processing Team Scheduler",
  description: "Schedule extraction weekly schedule and track production goals.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
