export const toDateInputValue = (value?: string): Date => {
  if (!value) return new Date();

  const normalizedDate = value.includes("T") ? value.split("T")[0] : value;
  const parsedDate = new Date(`${normalizedDate}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date();
  }

  return parsedDate;
};

export const formatDateOnly = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.replace("T", " ").slice(0, 16);
  }

  return date.toLocaleString();
};

export const formatDateShort = (value?: string | null): string => {
  if (!value) return "—";
  return value.slice(0, 10);
};
