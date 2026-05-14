import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">EduTrack International</div>
        <h1 className="font-display text-7xl mt-3 text-navy">404</h1>
        <h2 className="mt-4 text-xl font-display">This page is off the map</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">Go home</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-display tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-white">Try again</button>
          <a href="/" className="rounded-full border px-5 py-2.5 text-sm font-medium">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "EduTrack International — The school operating system that thinks" },
      { name: "description", content: "Every student seen. Every family connected. Every decision informed. AI-powered school OS for international schools across Africa and Asia." },
      { name: "theme-color", content: "#0B1F3A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "EduTrack" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:title", content: "EduTrack International — The school operating system that thinks" },
      { property: "og:description", content: "Every student seen. Every family connected. Every decision informed. AI-powered school OS for international schools across Africa and Asia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "EduTrack International — The school operating system that thinks" },
      { name: "twitter:description", content: "Every student seen. Every family connected. Every decision informed. AI-powered school OS for international schools across Africa and Asia." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/84ba931c-a1f3-47d5-84aa-7d3c551f9bf8/id-preview-36a4c08f--8503d4ef-dc0e-49a1-8772-190b3de2da38.lovable.app-1778717232422.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/84ba931c-a1f3-47d5-84aa-7d3c551f9bf8/id-preview-36a4c08f--8503d4ef-dc0e-49a1-8772-190b3de2da38.lovable.app-1778717232422.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  );
}
