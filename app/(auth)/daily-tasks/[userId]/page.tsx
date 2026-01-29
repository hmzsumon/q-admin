"use client";

import {
  useAssignDailyTasksToUserMutation,
  useGetUserDailyTasksByDateQuery,
} from "@/redux/features/tasks/tasksApi";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Button, Card, Label, TextInput } from "flowbite-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function DailyTasksUserPage({ params }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = params;

  const initialDate = searchParams.get("dateKey") || getDhakaDateKey();
  const [dateKey, setDateKey] = useState(initialDate);
  const [overrideCount, setOverrideCount] = useState<string>("");

  const { data, isLoading, isError, error, refetch } =
    useGetUserDailyTasksByDateQuery(
      { userId, dateKey },
      { refetchOnMountOrArgChange: true },
    );

  const [assignDailyTasks, { isLoading: assigning }] =
    useAssignDailyTasksToUserMutation();

  const dailyTasks = data?.dailyTasks || null;
  const tasks = dailyTasks?.tasks || [];
  const completedCount = tasks.filter((t: any) => !!t.completed).length;

  const rows = useMemo(() => {
    return (tasks || []).map((t: any, idx: number) => ({
      id: String(t._id || t.id || idx),
      sl: idx + 1,
      title: t.title || t.name || t.task_name || t.id || "Task",
      image: t.image || t.img || t.url || t.photo || "",
      completed: !!t.completed,
      completed_at: t.completed_at
        ? new Date(t.completed_at).toLocaleString()
        : "",
    }));
  }, [tasks]);

  const columns: GridColDef<any>[] = [
    { field: "sl", headerName: "SL", width: 70 },
    { field: "title", headerName: "Task", width: 260 },
    {
      field: "image",
      headerName: "Image",
      width: 130,
      sortable: false,
      renderCell: (params: any) => {
        const src = params.row.image;
        if (!src) return <span className="text-xs text-gray-400">-</span>;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="task"
            style={{
              width: 42,
              height: 42,
              objectFit: "cover",
              borderRadius: 6,
            }}
          />
        );
      },
    },
    {
      field: "completed",
      headerName: "Status",
      width: 120,
      renderCell: (params: any) =>
        params.row.completed ? (
          <span className="text-xs text-green-600">Completed</span>
        ) : (
          <span className="text-xs text-red-600">Pending</span>
        ),
    },
    { field: "completed_at", headerName: "Completed At", width: 200 },
  ];

  const handleAssign = async (force: boolean) => {
    try {
      const body: any = { dateKey, force };
      if (overrideCount && !Number.isNaN(Number(overrideCount))) {
        body.daily_tasks_override = Number(overrideCount);
      }
      const res: any = await assignDailyTasks({ userId, body }).unwrap();
      toast.success(res?.message || "Tasks assigned");
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || e?.message || "Failed to assign tasks");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Daily Tasks</h1>
          <p className="text-sm text-gray-500">User: {userId}</p>
        </div>
        <Link className="text-blue-600 text-sm underline" href="/daily-tasks">
          Back
        </Link>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="w-full md:w-60">
            <Label htmlFor="dateKey" value="Date" />
            <input
              id="dateKey"
              type="date"
              value={dateKey}
              onChange={(e) => {
                setDateKey(e.target.value);
                router.replace(
                  `/daily-tasks/${userId}?dateKey=${e.target.value}`,
                );
              }}
              className="border rounded px-3 py-2 text-sm w-full"
            />
          </div>

          <div className="w-full md:w-72">
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
            <Button
              color="success"
              isProcessing={assigning}
              onClick={() => handleAssign(false)}
            >
              Assign
            </Button>
            <Button
              color="warning"
              isProcessing={assigning}
              onClick={() => handleAssign(true)}
            >
              Force
            </Button>
            <Button color="info" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Force assign দিলে existing tasks থাকলেও replace হবে।
        </p>
      </Card>

      {isLoading ? (
        <div className="flex items-center gap-3">
          <PulseLoader size={7} />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      ) : isError ? (
        <Card>
          <div className="text-sm text-red-600">
            {(error as any)?.data?.message || "Failed to load"}
          </div>
          <div className="mt-3">
            <Button
              color="success"
              onClick={() => handleAssign(false)}
              isProcessing={assigning}
            >
              Assign for this date
            </Button>
          </div>
        </Card>
      ) : !dailyTasks ? (
        <Card>
          <div className="text-sm text-gray-600">
            No daily tasks found for this date.
          </div>
          <div className="mt-3">
            <Button
              color="success"
              onClick={() => handleAssign(false)}
              isProcessing={assigning}
            >
              Assign now
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="text-sm text-gray-500">Assigned At</div>
              <div className="text-sm font-semibold">
                {dailyTasks.assigned_at
                  ? new Date(dailyTasks.assigned_at).toLocaleString()
                  : "-"}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-2xl font-semibold">
                {dailyTasks.is_completed ? "Yes" : "No"}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Progress</div>
              <div className="text-2xl font-semibold">
                {completedCount}/{tasks.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Tasks Value</div>
              <div className="text-2xl font-semibold">
                {Number(dailyTasks.tasks_value || 0)}
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="text-lg font-semibold mb-3">Tasks</h2>
            <DataGrid
              rows={rows}
              columns={columns}
              autoHeight
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
              }}
              disableRowSelectionOnClick
            />
          </Card>
        </>
      )}
    </div>
  );
}
