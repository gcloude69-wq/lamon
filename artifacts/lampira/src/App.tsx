import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { I18nProvider } from "@/hooks/use-i18n";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Listings from "@/pages/listings";
import ListingDetail from "@/pages/listing-detail";
import Bookings from "@/pages/bookings";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Profile from "@/pages/profile";
import VendorDashboard from "@/pages/vendor/dashboard";
import VendorListings from "@/pages/vendor/listings";
import VendorEarnings from "@/pages/vendor/earnings";

const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedRoute = ({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="p-8">Loading...</div>;

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    setLocation("/");
    return null;
  }

  return <Component />;
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/listings" component={Listings} />
      <Route path="/listings/:id" component={ListingDetail} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected Tourist Routes */}
      <Route path="/bookings">
        {() => <ProtectedRoute component={Bookings} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>

      {/* Protected Vendor Routes */}
      <Route path="/vendor/dashboard">
        {() => <ProtectedRoute component={VendorDashboard} allowedRoles={['vendor']} />}
      </Route>
      <Route path="/vendor/listings">
        {() => <ProtectedRoute component={VendorListings} allowedRoles={['vendor']} />}
      </Route>
      <Route path="/vendor/earnings">
        {() => <ProtectedRoute component={VendorEarnings} allowedRoles={['vendor']} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="lampira-theme">
        <AuthProvider>
          <I18nProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Layout>
                  <Router />
                </Layout>
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </I18nProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
