import { apiSlice } from "../api/apiSlice";

export const tasksApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Who did not get daily tasks for a dateKey
    getMissingDailyTasksUsers: builder.query<any, string>({
      query: (dateKey) => ({
        url: `/admin/daily-tasks/missing?dateKey=${dateKey}`,
        method: "GET",
      }),
      providesTags: ["Tasks"],
    }),

    // ✅ Assign / Force re-assign to a single user
    assignDailyTasksToUser: builder.mutation<
      any,
      {
        userId: string;
        body?: {
          dateKey?: string;
          force?: boolean;
          daily_tasks_override?: number;
        };
      }
    >({
      query: ({ userId, body }) => ({
        url: `/admin/daily-tasks/assign/${userId}`,
        method: "POST",
        body: body || {},
      }),
      invalidatesTags: ["Tasks"],
    }),

    // ✅ Get a user's daily tasks by dateKey
    getUserDailyTasksByDate: builder.query<
      any,
      { userId: string; dateKey: string }
    >({
      query: ({ userId, dateKey }) => ({
        url: `/admin/daily-tasks/user/${userId}?dateKey=${dateKey}`,
        method: "GET",
      }),
      providesTags: ["Tasks"],
    }),

    getNotCompletedDailyTasksUsers: builder.query<any, string>({
      query: (dateKey) => ({
        url: `/admin/daily-tasks/not-completed?dateKey=${dateKey}`,
        method: "GET",
      }),
      providesTags: ["Tasks"],
    }),
  }),
});

export const {
  useGetMissingDailyTasksUsersQuery,
  useAssignDailyTasksToUserMutation,
  useGetUserDailyTasksByDateQuery,
  useGetNotCompletedDailyTasksUsersQuery,
} = tasksApi;
