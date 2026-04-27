export const getOnboardingErrorMessage = (error: unknown): string => {
  const response =
    typeof error === "object" && error !== null && "response" in error
      ? error.response
      : undefined;

  const status =
    typeof response === "object" && response !== null && "status" in response
      ? response.status
      : undefined;

  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (status === 403) {
    return "Bạn không có quyền kết nối thiết bị này.";
  }

  if (status === 404) {
    return "Không tìm thấy thiết bị hoặc khu vực đã chọn.";
  }

  if (status === 409) {
    return "Thiết bị đã tồn tại hoặc đã được kết nối trước đó.";
  }

  if (status === 400) {
    return "Thông tin thiết bị hoặc mã xác nhận không hợp lệ.";
  }

  if (status === 502 || status === 503 || status === 504) {
    return "Dịch vụ IoT đang không sẵn sàng. Vui lòng thử lại sau.";
  }

  return "Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.";
};
