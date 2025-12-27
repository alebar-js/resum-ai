import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  index("routes/main-resume.tsx"),
  route("main-resume", "routes/main-resume.redirect.tsx"),
  route("job-postings", "routes/job-postings.tsx"),
  route("job-posting/:id", "routes/job-posting.$id.tsx"),
] satisfies RouteConfig;

