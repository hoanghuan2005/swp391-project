import axiosClient from "./axiosClient";

export const createVnpayPayment = async () => {
  const response = await axiosClient.post("/api/payments/vnpay/create");
  return response.data;
};

export const confirmVnpayReturn = async (params) => {
  const response = await axiosClient.post(
    "/api/payments/vnpay/confirm-return",
    params
  );
  return response.data;
};
