import axiosClient from "./axiosClient";

export const createVnpayPayment = async (planCode) => {
  const url = planCode ? `/api/payments/vnpay/create?planCode=${encodeURIComponent(planCode)}` : "/api/payments/vnpay/create";
  const response = await axiosClient.post(url);
  return response.data;
};

export const confirmVnpayReturn = async (params) => {
  const response = await axiosClient.post(
    "/api/payments/vnpay/confirm-return",
    params
  );
  return response.data;
};
