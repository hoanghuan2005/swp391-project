import axiosClient from "./axiosClient";

export const createVnpayPayment = async () => {
  const response = await axiosClient.post("/api/payments/vnpay/create");
  return response.data;
};
