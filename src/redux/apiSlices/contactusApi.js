import { api } from "../api/baseApi";

const contactUsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all contacts with pagination and filters
    getAllContacts: builder.query({
      query: (args) => {
        const params = new URLSearchParams();

        // Default pagination
        params.append("page", "1");
        params.append("limit", "10");

        if (args && args.length > 0) {
          args.forEach((arg) => {
            if (
              arg.value !== undefined &&
              arg.value !== null &&
              arg.value !== ""
            ) {
              params.append(arg.name, arg.value);
            }
          });
        }

        return {
          url: "/admin/contact",
          method: "GET",
          params,
        };
      },
      transformResponse: (response) => {
        const parsed = response;
        return {
          contacts: parsed.data?.contacts || [],
          meta: parsed.data?.meta || {
            page: 1,
            limit: 10,
            total: 0,
            totalPage: 1,
          },
        };
      },
      providesTags: ["Contact"],
    }),

    // Get contact details by ID
    getContactDetails: builder.query({
      query: (contactId) => {
        return {
          url: `/contacts/${contactId}`,
          method: "GET",
        };
      },
      transformResponse: (response) => {
        const parsed =
          typeof response === "string" ? JSON.parse(response) : response;
        return parsed.data;
      },
      providesTags: (result, error, id) => [{ type: "Contact", id }],
    }),

 
    
  }),
});

export const {
  useGetAllContactsQuery,
  useGetContactDetailsQuery,
 
} = contactUsApi;
