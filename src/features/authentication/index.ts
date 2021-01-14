export { default } from "./authenticate";

export interface Session {
  token: string;
  user: {
    id: string;
  };
  profile: {
    id: string;
    name: string;
  };
}
