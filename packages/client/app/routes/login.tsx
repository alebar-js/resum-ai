import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/hooks/use-auth";

export function meta() {
  return [
    { title: "ResumAI - Login" },
    { name: "description", content: "Sign in to continue" },
  ];
}

export default function LoginRoute() {
  const { loginUrl } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Continue with Google to access your resumes and job postings.
        </p>

        <div className="mt-6">
          <Button asChild className="w-full">
            <a href={loginUrl}>Login with Google</a>
          </Button>
        </div>
      </div>
    </div>
  );
}




