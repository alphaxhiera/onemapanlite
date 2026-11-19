import { axiosInstance } from "@/lib/axios";

export const loginApi = async ({ username, password }) => {
    const response = await axiosInstance.post("/login", {
        username: typeof username === "string" ? username.trim() : username,
        password,
    });
    return response.data;
};