// Hex values for places className can't reach (icons, tab bar)
export const colors = {
  ink: "#151A22",
  muted: "#6B7280",
  line: "#E7E9EE",
  accent: "#1F3A5F",
};

export const money = (n) =>
  "₹" +
  Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
