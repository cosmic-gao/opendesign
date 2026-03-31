const DEMO_USER = "demo-user";
const CLERK_ADMIN_ROLE = "org:admin";

export const createEditCheck =
  ({ orgRole, userId }: { orgRole?: string | null; userId?: string | null }) =>
  (workflow: { id?: string | null; userId?: string | null }) =>
    workflow.userId === userId ||
    workflow.userId === DEMO_USER ||
    orgRole === CLERK_ADMIN_ROLE;
