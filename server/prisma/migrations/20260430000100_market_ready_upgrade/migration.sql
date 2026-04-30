CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$
BEGIN
    CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "SnippetVisibility" AS ENUM ('PRIVATE', 'TEAM', 'PUBLIC');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "SnippetAccessRole" AS ENUM ('VIEWER', 'EDITOR');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('COMMENT_ADDED', 'SNIPPET_UPDATED', 'TEAM_JOINED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "rememberMeDefault" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT,
    ADD COLUMN IF NOT EXISTS "twoFactorBackupCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

ALTER TABLE "snippets"
    ADD COLUMN IF NOT EXISTS "visibility" "SnippetVisibility" NOT NULL DEFAULT 'PRIVATE',
    ADD COLUMN IF NOT EXISTS "teamId" TEXT;

UPDATE "snippets"
SET "visibility" = 'PUBLIC'
WHERE "isPublic" = true;

CREATE TABLE IF NOT EXISTS "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "inviteCode" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "teams_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "teams_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "snippet_collaborators" (
    "id" TEXT NOT NULL,
    "snippetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "SnippetAccessRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "snippet_collaborators_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "snippet_collaborators_snippetId_fkey" FOREIGN KEY ("snippetId") REFERENCES "snippets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "snippet_collaborators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "comments" (
    "id" TEXT NOT NULL,
    "snippetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "comments_snippetId_fkey" FOREIGN KEY ("snippetId") REFERENCES "snippets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

DO $$
BEGIN
    ALTER TABLE "snippets"
        ADD CONSTRAINT "snippets_teamId_fkey"
        FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "teams_slug_key" ON "teams"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "teams_inviteCode_key" ON "teams"("inviteCode");
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "snippet_collaborators_snippetId_userId_key" ON "snippet_collaborators"("snippetId", "userId");

CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "snippets_userId_updatedAt_idx" ON "snippets"("userId", "updatedAt");
CREATE INDEX IF NOT EXISTS "snippets_visibility_updatedAt_idx" ON "snippets"("visibility", "updatedAt");
CREATE INDEX IF NOT EXISTS "snippets_teamId_updatedAt_idx" ON "snippets"("teamId", "updatedAt");
CREATE INDEX IF NOT EXISTS "snippets_language_idx" ON "snippets"("language");
CREATE INDEX IF NOT EXISTS "snippets_title_idx" ON "snippets"("title");
CREATE INDEX IF NOT EXISTS "teams_ownerId_idx" ON "teams"("ownerId");
CREATE INDEX IF NOT EXISTS "team_members_userId_role_idx" ON "team_members"("userId", "role");
CREATE INDEX IF NOT EXISTS "snippet_collaborators_userId_role_idx" ON "snippet_collaborators"("userId", "role");
CREATE INDEX IF NOT EXISTS "comments_snippetId_createdAt_idx" ON "comments"("snippetId", "createdAt");
CREATE INDEX IF NOT EXISTS "comments_userId_createdAt_idx" ON "comments"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

CREATE INDEX IF NOT EXISTS "snippets_title_trgm_idx" ON "snippets" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "snippets_code_trgm_idx" ON "snippets" USING GIN ("code" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "snippets_tags_gin_idx" ON "snippets" USING GIN ("tags");
