const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQz8wlSQU4x1ndGYJJgJsAIFrW2VVuXOBm8d9u8vAK7N5lypKUlYj46LP6xqF-Xqqv2PCIpB6EzP5ws/pub?output=csv";

const parseCSVRow = (row) => {
  let result = [];
  let current = "";
  let insideQuotes = false;
  for (const char of row) {
    if (char === '"') insideQuotes = !insideQuotes;
    else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else current += char;
  }
  result.push(current);
  return result.map((c) => c.replace(/^"|"$/g, "").trim());
};

const formatDateForMatch = (sheetDate) => {
  const [d, m, y] = sheetDate.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};
const formatDateForDisplay = (sheetDate) => {
  const [d, m, y] = sheetDate.split("/");
  return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
};

export const fetchEvents = async () => {
  const res = await fetch(url);
  const text = await res.text();
  const rows = text.split("\n").slice(1).filter(Boolean);

  return rows.map((row) => {
    const cols = parseCSVRow(row);
    return {
      date: formatDateForMatch(cols[0]),
      displayDate: formatDateForDisplay(cols[0]),
      title: cols[1],
      location: cols[2],
      startTime: cols[3],
      endTime: cols[4],
      description: cols[5],
      website: cols[6],
      address: cols[7],
      type: cols[8],
    };
  });
};
