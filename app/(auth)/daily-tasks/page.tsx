"use client";

import {
  useAssignDailyTasksToUserMutation,
  useGetMissingDailyTasksUsersQuery,
  useGetNotCompletedDailyTasksUsersQuery,
} from "@/redux/features/tasks/tasksApi";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Button, Card, Label, TextInput } from "flowbite-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import PulseLoader from "react-spinners/PulseLoader";
import { toast } from "react-toastify";

const TZ = "Asia/Dhaka";

function getDhakaDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

type MissingUserRow = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  customer_id?: string;
};

export default function DailyTasksAdminPage() {
  const [dateKey, setDateKey] = useState<string>(getDhakaDateKey());

  // Manual assign panel
  const [userId, setUserId] = useState("");
  const [force, setForce] = useState(false);
  const [overrideCount, setOverrideCount] = useState<string>("");

  const {
    data: pendingData,
    isLoading: pendingLoading,
    isError: pendingError,
    error: pendingErrObj,
    refetch: refetchPending,
  } = useGetNotCompletedDailyTasksUsersQuery(dateKey, {
    refetchOnMountOrArgChange: true,
  });

  const notCompletedUsers = pendingData?.notCompletedUsers || [];

  const { data, isLoading, isError, error, refetch } =
    useGetMissingDailyTasksUsersQuery(dateKey, {
      refetchOnMountOrArgChange: true,
    });

  const [assignDailyTasks, { isLoading: assigning }] =
    useAssignDailyTasksToUserMutation();

  const missingUsers = data?.missingUsers || [];
  const totalMissing = data?.totalMissing ?? missingUsers.length;
  const totalEligible = data?.totalEligible ?? 0;

  const rows: MissingUserRow[] = useMemo(() => {
    return (missingUsers || []).map((u: any) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      customer_id: u.customer_id,
    }));
  }, [missingUsers]);

  const handleAssign = async (targetUserId: string, forceAssign: boolean) => {
    try {
      const body: any = { dateKey, force: forceAssign };
      if (overrideCount && !Number.isNaN(Number(overrideCount))) {
        body.daily_tasks_override = Number(overrideCount);
      }

      const res: any = await assignDailyTasks({
        userId: targetUserId,
        body,
      }).unwrap();
      toast.success(res?.message || "Tasks assigned");
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || "Failed to assign tasks");
    }
  };

  const columns: GridColDef<any>[] = [
    { field: "customer_id", headerName: "Customer ID", width: 140 },
    { field: "name", headerName: "Name", width: 200 },
    { field: "email", headerName: "Email", width: 240 },
    { field: "phone", headerName: "Phone", width: 160 },
    {
      field: "actions",
      headerName: "Action",
      width: 260,
      sortable: false,
      renderCell: (params: any) => {
        const uid = params.row.id;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              color="success"
              isProcessing={assigning}
              onClick={() => handleAssign(uid, false)}
            >
              Assign
            </Button>
            <Button
              size="xs"
              color="warning"
              isProcessing={assigning}
              onClick={() => handleAssign(uid, true)}
            >
              Force
            </Button>
            <Link
              className="text-blue-600 text-xs underline"
              href={`/daily-tasks/${uid}?dateKey=${dateKey}`}
            >
              View
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Daily Tasks Management</h1>
          <p className="text-sm text-gray-500">
            Track who missed tasks & assign individually (dateKey: {dateKey})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Label htmlFor="dateKey" value="Date" />
          <input
            id="dateKey"
            type="date"
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
          <Button size="sm" color="info" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-500">Eligible Users</div>
          <div className="text-2xl font-semibold">{totalEligible}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Missing Tasks</div>
          <div className="text-2xl font-semibold">{totalMissing}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Date</div>
          <div className="text-2xl font-semibold">{dateKey}</div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Users who did NOT complete tasks
          </h2>
          {pendingLoading && <PulseLoader size={6} />}
        </div>

        {pendingError ? (
          <div className="text-sm text-red-600">
            {(pendingErrObj as any)?.data?.message || "Failed to load"}
          </div>
        ) : (
          <div style={{ width: "100%" }}>
            <DataGrid
              rows={(notCompletedUsers || []).map((u: any) => ({
                id: u._id,
                customer_id: u.customer_id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                progress: u.progress,
              }))}
              columns={[
                {
                  field: "customer_id",
                  headerName: "Customer ID",
                  width: 140,
                },
                { field: "name", headerName: "Name", width: 200 },
                { field: "email", headerName: "Email", width: 240 },
                { field: "phone", headerName: "Phone", width: 160 },
                { field: "progress", headerName: "Progress", width: 120 },
                {
                  field: "actions",
                  headerName: "Action",
                  width: 220,
                  sortable: false,
                  renderCell: (params: any) => (
                    <div className="flex items-center gap-2">
                      <Link
                        className="text-blue-600 text-xs underline"
                        href={`/daily-tasks/${params.row.id}?dateKey=${dateKey}`}
                      >
                        View
                      </Link>
                      <Button
                        size="xs"
                        color="warning"
                        isProcessing={assigning}
                        onClick={() => handleAssign(params.row.id, true)}
                      >
                        Force
                      </Button>
                    </div>
                  ),
                },
              ]}
              autoHeight
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25, page: 0 } },
              }}
              disableRowSelectionOnClick
            />
          </div>
        )}
      </Card>

      {/* Manual assign */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1">
            <Label htmlFor="userId" value="User ID (Mongo _id)" />
            <TextInput
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="659f..."
            />
          </div>

          <div className="w-full md:w-56">
            <Label
              htmlFor="overrideCount"
              value="Override daily_tasks (optional)"
            />
            <TextInput
              id="overrideCount"
              value={overrideCount}
              onChange={(e) => setOverrideCount(e.target.value)}
              placeholder="5"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="force"
              type="checkbox"
              checked={force}
              onChange={() => setForce((p) => !p)}
            />
            <Label htmlFor="force" value="Force assign" />
          </div>

          <Button
            color="success"
            isProcessing={assigning}
            onClick={() => {
              if (!userId.trim()) return toast.error("User ID required");
              handleAssign(userId.trim(), force);
            }}
          >
            Assign Now
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Force assign দিলে existing tasks থাকলেও নতুন করে replace হবে।
        </p>
      </Card>

      {/* Table */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Users who did not get tasks</h2>
          {isLoading && <PulseLoader size={6} />}
        </div>

        {isError ? (
          <div className="text-sm text-red-600">
            {(error as any)?.data?.message || "Failed to load"}
          </div>
        ) : (
          <div style={{ width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              autoHeight
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: { paginationModel: { pageSize: 25, page: 0 } },
              }}
              disableRowSelectionOnClick
            />
          </div>
        )}
      </Card>
    </div>
  );
}
