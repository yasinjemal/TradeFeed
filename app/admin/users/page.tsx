// ============================================================
// Page — Admin Users (/admin/users)
// ============================================================
// Cross-tenant user management — view, search, ban/unban users.
// ============================================================

import { getAdminUsers } from "@/lib/db/admin-users";
import { AdminUserList } from "@/components/admin/admin-user-list";

interface AdminUsersPageProps {
  searchParams: Promise<{ search?: string; page?: string; filter?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1", 10);
  const filter = (params.filter || "all") as "all" | "banned" | "active";

  const userData = await getAdminUsers({ search, page, filter });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-stone-500 text-sm mt-1">
          View all platform users, search by email or name, and manage bans.
        </p>
      </div>

      <AdminUserList
        users={userData.users}
        total={userData.total}
        page={userData.page}
        totalPages={userData.totalPages}
        currentSearch={search}
        currentFilter={filter}
      />
    </div>
  );
}
