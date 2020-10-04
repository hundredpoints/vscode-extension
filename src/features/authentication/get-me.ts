import fetch from "node-fetch";

export interface GetMeResponse {
  data: {
    me: {
      id: string;
      profile: {
        name: string;
        nickname: string;
      };
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type this later
export default async function getMe(token: string): Promise<any> {
  const response = await fetch("http://localhost:3000/api/graphql", {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        {
          me {
            id
            profile {
              id
              name
            }
          }
        }
        `,
    }),
  });

  // Should handle some global errors here
  if (!response.ok) {
    throw response;
  }

  return response.json();
}
