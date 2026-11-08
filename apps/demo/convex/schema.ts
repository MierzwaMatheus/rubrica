import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { rubricaTables } from "@rubrica/core/convex/schema";

// Tabelas do login, do núcleo do Rubrica e (depois delas) as do próprio projeto.
export default defineSchema({ ...authTables, ...rubricaTables });
