export function toWords(num: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  if (num === 0) return "Zero"

  function convertLessThanOneThousand(num: number): string {
    if (num < 20) {
      return ones[num]
    }

    const ten = Math.floor(num / 10) % 10
    const one = num % 10

    return (ten > 0 ? tens[ten] + " " : "") + (one > 0 ? ones[one] : "")
  }

  let words = ""

  if (Math.floor(num / 10000000) > 0) {
    words += convertLessThanOneThousand(Math.floor(num / 10000000)) + " Crore "
    num %= 10000000
  }

  if (Math.floor(num / 100000) > 0) {
    words += convertLessThanOneThousand(Math.floor(num / 100000)) + " Lakh "
    num %= 100000
  }

  if (Math.floor(num / 1000) > 0) {
    words += convertLessThanOneThousand(Math.floor(num / 1000)) + " Thousand "
    num %= 1000
  }

  if (Math.floor(num / 100) > 0) {
    words += convertLessThanOneThousand(Math.floor(num / 100)) + " Hundred "
    num %= 100
  }

  if (num > 0) {
    words += convertLessThanOneThousand(num)
  }

  return words.trim()
}

// Add the missing export that's being referenced elsewhere in the code
export const numberToWords = toWords
