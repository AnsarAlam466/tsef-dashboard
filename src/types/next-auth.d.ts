import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      department: string;
      avatarColor: string;
    };
  }

  interface User {
    id: string;
    role: string;
    department: string;
    avatarColor: string;
  }
}
