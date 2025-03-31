/**
 * Safely formats a date value to a string
 * @param dateValue - The date value to format (can be Date, string, or undefined)
 * @param format - The format to use (default: 'localeDate')
 * @returns Formatted date string or empty string if invalid
 */
export function formatDate(
  dateValue: Date | string | undefined | null,
  format: "localeDate" | "localeDateTime" | "iso" = "localeDate",
): string {
  if (!dateValue) return ""

  let date: Date

  if (typeof dateValue === "string") {
    // Try to parse the string as a date
    date = new Date(dateValue)
    if (isNaN(date.getTime())) return dateValue // Return original string if parsing fails
  } else if (dateValue instanceof Date) {
    date = dateValue
  } else {
    return ""
  }

  switch (format) {
    case "localeDate":
      return date.toLocaleDateString()
    case "localeDateTime":
      return date.toLocaleString()
    case "iso":
      return date.toISOString()
    default:
      return date.toLocaleDateString()
  }
}

/**
 * Safely formats a number to a currency string
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null) return "$0.00"
  return `$${value.toFixed(decimals)}`
}

