import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/15 via-background to-background pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md p-8 bg-card border border-border rounded-2xl shadow-2xl shadow-primary/5 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground mx-auto mb-6 shadow-lg shadow-primary/25">
          <CheckSquare className="w-8 h-8" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Welcome to TaskFlow AI</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Your command center for flow state productivity.
        </p>

        <Button size="lg" className="w-full text-base font-semibold shadow-lg shadow-primary/20" onClick={() => login()}>
          Sign in
        </Button>
      </motion.div>
    </div>
  );
}
